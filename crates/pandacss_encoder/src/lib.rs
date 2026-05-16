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

use rustc_hash::FxHashSet;
use serde::Serialize;
use smallvec::SmallVec;

use pandacss_extractor::Literal;
use pandacss_recipes::{Recipe, SlotRecipe};

// PERF(port): inline budget for `Atom::conditions`. Picked from real
// Panda usage where atoms typically have 0-2 conditions; 3+ spills.
const INLINE_CONDS: usize = 2;
// PERF(port): inline budget for path traversal. Most style objects nest
// ≤8 deep; deeper spills.
const INLINE_PATH: usize = 8;

/// One atomic style declaration: `(prop, value, conditions)`.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
pub struct Atom {
    pub prop: Box<str>,
    pub value: AtomValue,
    /// Outer-to-inner condition chain. Empty for unconditional atoms.
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
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

/// Decides which object keys are *conditions* vs CSS properties. Pass a
/// custom impl when the user's Panda config defines extra named conditions.
pub trait ConditionMatcher {
    fn is_condition(&self, key: &str) -> bool;
}

/// `_*` prefix plus built-in breakpoint names.
#[derive(Debug, Clone, Copy, Default)]
pub struct DefaultConditions;

impl ConditionMatcher for DefaultConditions {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        if key.starts_with('_') {
            return true;
        }
        matches!(key, "base" | "sm" | "md" | "lg" | "xl" | "2xl")
    }
}

pub struct Encoder<C: ConditionMatcher = DefaultConditions> {
    conditions: C,
    atoms: FxHashSet<Atom>,
    // One allocation per walk root, not per descent. Pushed/popped during
    // recursion in `walk`.
    path: SmallVec<[PathSegment; INLINE_PATH]>,
}

impl Encoder<DefaultConditions> {
    #[must_use]
    pub fn new() -> Self {
        Self::with_conditions(DefaultConditions)
    }
}

impl Default for Encoder<DefaultConditions> {
    fn default() -> Self {
        Self::new()
    }
}

impl<C: ConditionMatcher> Encoder<C> {
    pub fn with_conditions(conditions: C) -> Self {
        Self {
            conditions,
            atoms: FxHashSet::default(),
            path: SmallVec::new(),
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
        debug_assert!(
            self.path.is_empty(),
            "path buffer must be empty between walks"
        );
        self.walk(style);
    }

    pub fn process_atomic_recipe(&mut self, recipe: &Recipe) {
        for style in recipe.atomic_styles() {
            self.process_atomic(style);
        }
    }

    pub fn process_atomic_slot_recipe(&mut self, recipe: &SlotRecipe) {
        for (_slot, styles) in recipe.atomic_styles_per_slot() {
            for style in styles {
                self.process_atomic(style);
            }
        }
    }

    // Descends with push, ascends with pop on the shared path buffer.
    // The outermost non-condition key is the atom's `prop`.
    fn walk(&mut self, value: &Literal) {
        if let Literal::Object(entries) = value {
            for (key, child) in entries {
                let is_condition = self.conditions.is_condition(key);
                self.path.push(PathSegment {
                    name: key.clone().into_boxed_str(),
                    is_condition,
                });
                self.walk(child);
                self.path.pop();
            }
            return;
        }
        if let Some(atom) = self.atom_from_path(value) {
            self.atoms.insert(atom);
        }
    }

    fn atom_from_path(&self, leaf: &Literal) -> Option<Atom> {
        // `find` walks outer→inner so the *first* non-condition key wins,
        // matching JS semantics for the property name.
        let prop = self.path.iter().find(|s| !s.is_condition)?.name.clone();
        let conditions: SmallVec<[Box<str>; INLINE_CONDS]> = self
            .path
            .iter()
            .filter(|s| s.is_condition && &*s.name != "base")
            .map(|s| s.name.clone())
            .collect();
        let value = leaf_to_atom_value(leaf)?;
        Some(Atom {
            prop,
            value,
            conditions,
        })
    }
}

#[derive(Debug, Clone)]
struct PathSegment {
    name: Box<str>,
    is_condition: bool,
}

fn leaf_to_atom_value(value: &Literal) -> Option<AtomValue> {
    match value {
        Literal::String(s) => Some(AtomValue::String(s.clone().into_boxed_str())),
        Literal::Number(n) => Some(AtomValue::Number(number_to_js_string(*n).into_boxed_str())),
        Literal::Bool(b) => Some(AtomValue::Bool(*b)),
        Literal::Null => Some(AtomValue::Null),
        Literal::Array(items) => {
            let joined = format_joined(items, ",");
            Some(AtomValue::String(format!("[{joined}]").into_boxed_str()))
        }
        Literal::Conditional(branches) => {
            let joined = format_joined(branches, "|");
            Some(AtomValue::String(format!("?({joined})").into_boxed_str()))
        }
        Literal::Object(_) => None,
    }
}

fn format_joined(items: &[Literal], sep: &str) -> String {
    let mut out = String::new();
    for (i, item) in items.iter().enumerate() {
        if i > 0 {
            out.push_str(sep);
        }
        append_literal_repr(&mut out, item);
    }
    out
}

fn append_literal_repr(out: &mut String, value: &Literal) {
    use std::fmt::Write as _;
    match value {
        Literal::String(s) => out.push_str(s),
        Literal::Number(n) => {
            let _ = write!(out, "{}", number_to_js_string(*n));
        }
        Literal::Bool(true) => out.push_str("true"),
        Literal::Bool(false) => out.push_str("false"),
        Literal::Null => out.push_str("null"),
        Literal::Object(_) => out.push_str("{…}"),
        Literal::Array(_) => out.push_str("[…]"),
        Literal::Conditional(_) => out.push_str("?(…)"),
    }
}

fn number_to_js_string(value: f64) -> String {
    // 2^53 is the f64 max-safe-integer boundary; above it the equality
    // check drifts, so the conversion shortcut stops being safe.
    const MAX_SAFE_INT: f64 = 9_007_199_254_740_992.0;
    if value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INT {
        #[allow(clippy::cast_possible_truncation, reason = "bounds-checked above")]
        return (value as i64).to_string();
    }
    value.to_string()
}
