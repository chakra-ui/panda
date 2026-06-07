//! Atomic style encoder for the Panda Rust engine.
//!
//! Takes a typed style object ([`pandacss_extractor::Literal::Object`]) or a recipe
//! model ([`pandacss_recipes::Recipe`] / [`pandacss_recipes::SlotRecipe`]) and decomposes
//! it into a flat set of [`Atom`] records — one per
//! `(prop, value, condition_chain)` triple. The emitter turns those atoms
//! into CSS rules; the encoder doesn't care about CSS syntax.
//!
//! ## Hot-path tradeoffs
//!
//! - Single reused path buffer during recursion → O(depth) allocation,
//!   not O(depth²).
//! - `SmallVec` for `Atom::conditions` and the traversal buffer →
//!   no-heap for the 0-2-condition / ≤8-deep common case.
//! - `Box<str>` for `Atom` strings → 8 bytes saved per string vs `String`
//!   (no capacity field); fine because atoms are immutable.
//! - `FxHashSet<Atom>` for dedup — non-cryptographic hash for internal
//!   trusted data.

use std::borrow::Cow;
use std::cmp::Ordering;
use std::hash::{Hash, Hasher};

use rustc_hash::{FxHashSet, FxHasher};
use serde::Serialize;
use smallvec::SmallVec;

use pandacss_extractor::Literal;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{number_to_js_string, push_number_to_js_string, split_important};

// PERF(port): inline budget for `Atom::conditions`. Picked from real
// Panda usage where atoms typically have 0-2 conditions; 3+ spills.
const INLINE_CONDS: usize = 2;
// PERF(port): inline budget for path traversal. Most style objects nest
// ≤8 deep; deeper spills.
const INLINE_PATH: usize = 8;

/// One atomic style declaration: `(prop, value, conditions)`.
#[derive(Debug, Clone, Eq, Serialize)]
pub struct Atom {
    prop: Box<str>,
    value: AtomValue,
    /// Outer-to-inner condition chain. Empty for unconditional atoms.
    conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
    #[serde(skip_serializing_if = "is_false")]
    important: bool,
    #[serde(skip)]
    hash: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(untagged)]
pub enum AtomValue {
    String(Box<str>),
    /// Numbers stored as their JS string form so `Atom` can be `Hash`
    /// (f64 isn't `Eq`). Round-trips through `to_string()` exactly.
    Number(Box<str>),
    Bool(bool),
    Null,
}

#[derive(Debug, Clone, Default)]
pub struct RecipeStyleGroup {
    pub class_name: Box<str>,
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
    pub entries: FxHashSet<RecipeStyleEntry>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeStyleEntry {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
    #[serde(skip_serializing_if = "is_false")]
    pub important: bool,
}

impl From<Atom> for RecipeStyleEntry {
    fn from(atom: Atom) -> Self {
        let Atom {
            prop,
            value,
            conditions,
            important,
            hash: _,
        } = atom;
        Self {
            prop,
            value,
            conditions,
            important,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodedRecipesSnapshot {
    pub base: Vec<RecipeStyleGroupSnapshot>,
    pub variants: Vec<RecipeStyleGroupSnapshot>,
    pub atomic: Vec<Atom>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeStyleGroupSnapshot {
    pub recipe: Box<str>,
    pub slot: serde_json::Value,
    pub class_name: Box<str>,
    #[serde(skip_serializing_if = "is_empty_conditions")]
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
    pub entries: Vec<RecipeStyleEntry>,
}

impl Atom {
    #[must_use]
    pub fn new(
        prop: Box<str>,
        value: AtomValue,
        conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
        important: bool,
    ) -> Self {
        let hash = hash_atom_parts(&prop, &value, &conditions, important);
        Self {
            prop,
            value,
            conditions,
            important,
            hash,
        }
    }

    #[must_use]
    pub fn with_prefixed_conditions(&self, prefix: &SmallVec<[Box<str>; INLINE_CONDS]>) -> Self {
        if prefix.is_empty() {
            return self.clone();
        }

        let mut conditions = prefix.clone();
        conditions.extend(self.conditions.iter().cloned());

        Self::new(
            self.prop.clone(),
            self.value.clone(),
            conditions,
            self.important,
        )
    }

    #[must_use]
    pub fn prop(&self) -> &str {
        &self.prop
    }

    #[must_use]
    pub fn value(&self) -> &AtomValue {
        &self.value
    }

    #[must_use]
    pub fn conditions(&self) -> &[Box<str>] {
        &self.conditions
    }

    #[must_use]
    pub fn important(&self) -> bool {
        self.important
    }
}

impl PartialEq for Atom {
    fn eq(&self, other: &Self) -> bool {
        self.prop == other.prop
            && self.value == other.value
            && self.conditions == other.conditions
            && self.important == other.important
    }
}

impl Hash for Atom {
    fn hash<H: Hasher>(&self, state: &mut H) {
        state.write_u64(self.hash);
    }
}

/// Decides which object keys are *conditions* vs CSS properties.
///
/// Callers must derive this from the resolved Panda config so condition
/// recognition matches the user's configured conditions and breakpoints.
pub trait ConditionMatcher {
    fn is_condition(&self, key: &str) -> bool;
}

#[derive(Debug, Clone, Default)]
pub struct ConditionSet {
    names: FxHashSet<Box<str>>,
}

impl ConditionSet {
    #[must_use]
    pub fn from_names<'a>(names: impl IntoIterator<Item = &'a str>) -> Self {
        Self {
            names: names
                .into_iter()
                .filter(|name| !name.is_empty())
                .map(Box::<str>::from)
                .collect(),
        }
    }

    /// The configured condition names, for "did you mean …?" suggestions.
    pub fn names(&self) -> impl Iterator<Item = &str> {
        self.names.iter().map(AsRef::as_ref)
    }
}

impl ConditionMatcher for ConditionSet {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        self.names.contains(key) || is_raw_condition(key)
    }
}

/// Inline normalization the encoder applies during a single walk over the
/// input style — avoids the upfront `StyleNormalizer.normalize` pass and the
/// `Cow<Literal>` it produces. Default impls are no-ops; the project layer
/// supplies a real impl via `pandacss_utility::StyleNormalizer`.
pub trait NormalizeAtomic {
    /// Canonical key for an Object entry (shorthand expansion).
    /// May borrow from `self` (e.g. utility-owned strings) or pass the input through.
    fn resolve_key<'a>(&'a self, key: &'a str) -> &'a str {
        key
    }

    /// Normalize a leaf value before atom construction.
    /// Returns `Cow::Borrowed(value)` when nothing changes — no alloc.
    fn normalize_leaf<'a>(&self, _prop: &str, value: &'a Literal) -> Cow<'a, Literal> {
        Cow::Borrowed(value)
    }

    /// For `Literal::Array` items at responsive positions: the synthetic
    /// condition name to attach (e.g. `"sm"`). `None` → arrays don't encode
    /// (matches the pre-fusion default-walker behavior).
    fn array_condition(&self, _index: usize) -> Option<&str> {
        None
    }
}

/// Zero-cost "do nothing" implementation. Use when the caller has already
/// normalized the input.
pub struct NoNormalize;
impl NormalizeAtomic for NoNormalize {}

pub struct Encoder<C: ConditionMatcher> {
    conditions: C,
    atoms: FxHashSet<Atom>,
}

impl<C: ConditionMatcher> Encoder<C> {
    pub fn with_conditions(conditions: C) -> Self {
        Self {
            conditions,
            atoms: FxHashSet::default(),
        }
    }

    /// Iteration order isn't stable across runs — sort by
    /// `(prop, conditions, value)` if you need determinism.
    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms
    }

    /// Cheaper than `atoms().clone()` — the inner set moves out, no
    /// re-hash.
    #[must_use]
    pub fn into_atoms(self) -> FxHashSet<Atom> {
        self.atoms
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.atoms.is_empty()
    }

    pub fn reserve(&mut self, additional: usize) {
        self.atoms.reserve(additional);
    }

    /// Walk a style object and emit one atom per leaf. Mirrors
    /// `processAtomic` in the JS encoder.
    pub fn process_atomic(&mut self, style: &Literal) {
        let _span = tracing::trace_span!("encoding", kind = "encoder_atomic").entered();
        let mut path = SmallVec::new();
        self.walk(style, &mut path);
    }

    /// Fused variant: walks `style` once while applying `norm` inline (key
    /// resolution, leaf normalization, responsive-array expansion). Caller
    /// avoids the upfront `StyleNormalizer.normalize` allocation pass.
    pub fn process_atomic_with<'a, N: NormalizeAtomic>(&mut self, style: &'a Literal, norm: &'a N) {
        let _span = tracing::trace_span!("encoder_atomic").entered();
        let mut path = SmallVec::new();
        self.walk_with(style, norm, &mut path);
    }

    pub fn process_atomic_recipe(&mut self, recipe: &Recipe) {
        let _span = tracing::trace_span!("encoding", kind = "encoder_recipe").entered();
        for style in recipe.atomic_styles() {
            self.process_atomic(style);
        }
    }

    pub fn process_atomic_slot_recipe(&mut self, recipe: &SlotRecipe) {
        let _span = tracing::trace_span!("encoding", kind = "encoder_slot_recipe").entered();
        for (_slot, styles) in recipe.atomic_styles_per_slot() {
            for style in styles {
                self.process_atomic(style);
            }
        }
    }

    // Descends with push, ascends with pop on the shared path buffer.
    // The outermost non-condition key is the atom's `prop`.
    fn walk<'a>(
        &mut self,
        value: &'a Literal,
        path: &mut SmallVec<[PathSegment<'a>; INLINE_PATH]>,
    ) {
        if let Literal::Object(entries) = value {
            for (key, child) in entries {
                let is_condition = self.conditions.is_condition(key);
                path.push(PathSegment {
                    name: key,
                    is_condition,
                });
                self.walk(child, path);
                path.pop();
            }
            return;
        }

        // A conditional (`cond ? a : b`) could resolve to either branch at
        // runtime, so emit each branch's atoms under the same path.
        if let Literal::Conditional(branches) = value {
            for branch in branches {
                self.walk(branch, path);
            }
            return;
        }

        // Leaf: the accumulated path becomes one atom.
        if let Some(atom) = Self::atom_from_path(path, value) {
            self.atoms.insert(atom);
        }
    }

    fn walk_with<'a, N: NormalizeAtomic>(
        &mut self,
        value: &'a Literal,
        norm: &'a N,
        path: &mut SmallVec<[PathSegment<'a>; INLINE_PATH]>,
    ) {
        match value {
            Literal::Object(entries) => {
                for (key, child) in entries {
                    let resolved = norm.resolve_key(key);
                    let is_condition = self.conditions.is_condition(resolved);
                    path.push(PathSegment {
                        name: resolved,
                        is_condition,
                    });
                    self.walk_with(child, norm, path);
                    path.pop();
                }
            }
            Literal::Array(items) => {
                for (index, item) in items.iter().enumerate() {
                    let Some(cond) = norm.array_condition(index) else {
                        continue;
                    };
                    if matches!(item, Literal::Null) {
                        continue;
                    }
                    path.push(PathSegment {
                        name: cond,
                        is_condition: true,
                    });
                    self.walk_with(item, norm, path);
                    path.pop();
                }
            }
            Literal::Conditional(branches) => {
                // A conditional could resolve to either branch at runtime;
                // emit each branch's atoms under the same path.
                for branch in branches {
                    self.walk_with(branch, norm, path);
                }
            }
            _ => {
                let prop = path.iter().find(|s| !s.is_condition).map(|s| s.name);
                let normalized = match prop {
                    Some(prop) => norm.normalize_leaf(prop, value),
                    None => Cow::Borrowed(value),
                };

                if let Some(atom) = Self::atom_from_path(path, normalized.as_ref()) {
                    self.atoms.insert(atom);
                }
            }
        }
    }

    fn atom_from_path(path: &[PathSegment<'_>], leaf: &Literal) -> Option<Atom> {
        // An `_`-prefixed key that isn't a known condition is an unresolved
        // condition reference (typo like `_hovr`) — never a valid property in
        // Panda — so emit nothing rather than a bogus `_hovr: …` declaration.
        if path
            .iter()
            .any(|s| !s.is_condition && s.name.starts_with('_'))
        {
            return None;
        }

        // `find` walks outer→inner so the *first* non-condition key wins,
        // matching JS semantics for the property name.
        let prop = path.iter().find(|s| !s.is_condition)?.name.into();
        let conditions: SmallVec<[Box<str>; INLINE_CONDS]> = path
            .iter()
            .filter(|s| s.is_condition && s.name != "base")
            .map(|s| s.name.into())
            .collect();

        let leaf = leaf_to_atom_value(leaf)?;
        Some(Atom::new(prop, leaf.value, conditions, leaf.important))
    }
}

#[must_use]
pub fn atom_value_sort_key(value: &AtomValue) -> (u8, &str) {
    match value {
        AtomValue::Bool(false) => (0, "false"),
        AtomValue::Bool(true) => (0, "true"),
        AtomValue::Number(value) => (1, value),
        AtomValue::String(value) => (2, value),
        AtomValue::Null => (3, ""),
    }
}

#[must_use]
pub fn compare_atoms_by_emit_order(a: &Atom, b: &Atom) -> Ordering {
    a.conditions()
        .cmp(b.conditions())
        .then_with(|| a.prop().cmp(b.prop()))
        .then_with(|| atom_value_sort_key(a.value()).cmp(&atom_value_sort_key(b.value())))
}

fn hash_atom_parts(
    prop: &str,
    value: &AtomValue,
    conditions: &SmallVec<[Box<str>; INLINE_CONDS]>,
    important: bool,
) -> u64 {
    let mut hasher = FxHasher::default();
    prop.hash(&mut hasher);
    value.hash(&mut hasher);
    conditions.hash(&mut hasher);
    important.hash(&mut hasher);
    hasher.finish()
}

#[derive(Debug, Clone)]
struct PathSegment<'a> {
    name: &'a str,
    is_condition: bool,
}

struct EncodedLeaf {
    value: AtomValue,
    important: bool,
}

/// Coerce a numeric string to its JS `Number()` value so it dedupes with the bare
/// number and gets px (`"1e3"` → 1000, `".5"` → 0.5). Leading-zero ints stay
/// strings (`"01"`, like node); non-finite parses are rejected.
fn canonical_number(s: &str) -> Option<f64> {
    if s.starts_with('0') && s.as_bytes().get(1).is_some_and(u8::is_ascii_digit) {
        return None;
    }
    s.parse::<f64>().ok().filter(|n| n.is_finite())
}

fn leaf_to_atom_value(value: &Literal) -> Option<EncodedLeaf> {
    match value {
        Literal::String(s) => {
            if is_absolute_url(s) {
                return None;
            }
            let (value, important) = split_important(s);
            // A numeric string == the bare number: encode as `Number` so it
            // dedupes with `1` and gets px (tokens still resolve by string form).
            let value = match canonical_number(&value) {
                Some(n) => AtomValue::Number(number_to_js_string(n).into_boxed_str()),
                None => AtomValue::String(value.into_owned().into_boxed_str()),
            };
            Some(EncodedLeaf { value, important })
        }
        Literal::Number(n) => Some(EncodedLeaf {
            value: AtomValue::Number(number_to_js_string(*n).into_boxed_str()),
            important: false,
        }),
        Literal::Bool(b) => Some(EncodedLeaf {
            value: AtomValue::Bool(*b),
            important: false,
        }),
        Literal::Null => Some(EncodedLeaf {
            value: AtomValue::Null,
            important: false,
        }),
        Literal::Array(items) => {
            let mut out = String::with_capacity(items.len().saturating_mul(8) + 2);
            out.push('[');
            append_joined_literal_repr(&mut out, items, ",");
            out.push(']');
            let (value, important) = split_important(&out);
            Some(EncodedLeaf {
                value: AtomValue::String(value.into_owned().into_boxed_str()),
                important,
            })
        }
        // Conditionals are expanded into their branches by the walkers before
        // reaching a leaf, so they never arrive here.
        Literal::Conditional(_) | Literal::Object(_) => None,
    }
}

#[allow(
    clippy::trivially_copy_pass_by_ref,
    reason = "serde skip_serializing_if predicate signature"
)]
fn is_false(value: &bool) -> bool {
    !*value
}

fn is_empty_conditions(value: &SmallVec<[Box<str>; INLINE_CONDS]>) -> bool {
    value.is_empty()
}

fn is_absolute_url(value: &str) -> bool {
    value.starts_with("http://") || value.starts_with("https://")
}

fn is_raw_condition(key: &str) -> bool {
    key.starts_with('@') || key.contains('&')
}

fn append_joined_literal_repr(out: &mut String, items: &[Literal], sep: &str) {
    for (i, item) in items.iter().enumerate() {
        if i > 0 {
            out.push_str(sep);
        }
        append_literal_repr(out, item);
    }
}

fn append_literal_repr(out: &mut String, value: &Literal) {
    match value {
        Literal::String(s) => out.push_str(s),
        Literal::Number(n) => {
            push_number_to_js_string(out, *n);
        }
        Literal::Bool(true) => out.push_str("true"),
        Literal::Bool(false) => out.push_str("false"),
        Literal::Null => out.push_str("null"),
        Literal::Object(_) => out.push_str("{…}"),
        Literal::Array(_) => out.push_str("[…]"),
        Literal::Conditional(_) => out.push_str("?(…)"),
    }
}

#[cfg(test)]
mod canonical_number_tests {
    use super::canonical_number;

    #[test]
    fn accepts_plain_numbers() {
        assert_eq!(canonical_number("0"), Some(0.0));
        assert_eq!(canonical_number("42"), Some(42.0));
        assert_eq!(canonical_number("1.5"), Some(1.5));
        assert_eq!(canonical_number("-0.25"), Some(-0.25));
    }

    #[test]
    fn accepts_js_number_forms() {
        assert_eq!(canonical_number("1e3"), Some(1000.0));
        assert_eq!(canonical_number(".5"), Some(0.5));
        assert_eq!(canonical_number("+2"), Some(2.0));
    }

    #[test]
    fn rejects_leading_zero_integers() {
        assert_eq!(canonical_number("01"), None);
        assert_eq!(canonical_number("00"), None);
    }

    #[test]
    fn rejects_values_with_units() {
        assert_eq!(canonical_number("1px"), None);
        assert_eq!(canonical_number("1rem"), None);
    }

    #[test]
    fn rejects_non_finite() {
        assert_eq!(canonical_number("Infinity"), None);
        assert_eq!(canonical_number("NaN"), None);
    }

    #[test]
    fn rejects_non_numeric_and_whitespace() {
        assert_eq!(canonical_number("0x10"), None);
        assert_eq!(canonical_number(""), None);
        assert_eq!(canonical_number("-"), None);
        assert_eq!(canonical_number(" 1"), None);
        assert_eq!(canonical_number("1 "), None);
    }
}
