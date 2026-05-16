//! Atomic style encoder for the Panda Rust engine.
//!
//! Takes a typed style object ([`extractor::Literal::Object`]) or a
//! recipe model ([`recipes::Recipe`] / [`recipes::SlotRecipe`]) and
//! decomposes it into a flat set of [`Atom`] records — one per
//! `(prop, value, condition_chain)` triple. The emitter turns those
//! atoms into CSS rules; the encoder doesn't care about CSS syntax.
//!
//! ## Performance shape
//!
//! The walker is the hot path. Three deliberate optimizations:
//!
//! - **Single path buffer.** Recursion pushes and pops segments onto
//!   one `SmallVec<[PathSegment; 8]>` instead of cloning the path on
//!   every descent. O(depth) total allocation rather than O(depth²).
//! - **`SmallVec` for atom conditions.** Most atoms have 0-2
//!   conditions, which fit inline (no heap allocation). Atoms with
//!   3+ conditions spill normally.
//! - **`Box<str>` for `Atom` strings.** Saves 8 bytes per string vs
//!   `String` (no capacity field) and is fine because atoms are
//!   immutable once recorded.
//!
//! Deduplication is via `FxHashSet<Atom>` — non-cryptographic hash for
//! internal trusted data.

use rustc_hash::FxHashSet;
use serde::Serialize;
use smallvec::SmallVec;

use extractor::Literal;
use recipes::{Recipe, SlotRecipe};

/// Inline budget for `Atom::conditions`. Picked from real Panda style
/// usage where atoms typically have 0-2 conditions
/// (`{ _hover: { md: … } }`); 3+ falls back to heap.
const INLINE_CONDS: usize = 2;
/// Inline budget for path traversal during `walk`. Most style objects
/// nest ≤8 deep; deeper spills.
const INLINE_PATH: usize = 8;

/// One atomic style declaration: `(prop, value, conditions)`.
///
/// String fields use `Box<str>` because atoms are write-once: we save
/// 8 bytes per string vs `String` and lose nothing.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
pub struct Atom {
    pub prop: Box<str>,
    pub value: AtomValue,
    /// Outer-to-inner condition chain. Empty for unconditional atoms;
    /// `SmallVec` so the 0-2-condition common case avoids heap.
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
}

/// Leaf values an atom can carry. Restricted to JSON-primitive shapes
/// because nested objects expand into more atoms (one per leaf).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(untagged)]
pub enum AtomValue {
    String(Box<str>),
    /// Numbers stored as their JS string form to keep `Hash` simple
    /// (f64 isn't `Eq`). Round-trips through `to_string()` exactly.
    Number(Box<str>),
    Bool(bool),
    Null,
}

/// Trait for deciding which object keys are *conditions*. The default
/// (`DefaultConditions`) recognizes `_*` keys and standard breakpoint
/// names; pass a custom impl when the user has extra named conditions
/// in their Panda config.
pub trait ConditionMatcher {
    fn is_condition(&self, key: &str) -> bool;
}

/// Default condition recognizer — `_*` plus the built-in breakpoint
/// names (`base`, `sm`, `md`, `lg`, `xl`, `2xl`).
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

/// Stateful encoder. Construct with [`Encoder::new`] (defaults) or
/// [`Encoder::with_conditions`] (custom matcher). Call `process_*`
/// methods to feed it style objects / recipes; read [`Self::atoms`]
/// when done.
pub struct Encoder<C: ConditionMatcher = DefaultConditions> {
    conditions: C,
    atoms: FxHashSet<Atom>,
    /// Reused traversal buffer — one allocation per walk root, not
    /// per descent. Pushed / popped during recursion.
    path: SmallVec<[PathSegment; INLINE_PATH]>,
}

impl Encoder<DefaultConditions> {
    /// Encoder with the built-in `DefaultConditions` matcher.
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

    /// Deduplicated set of atoms produced so far. Iteration order
    /// isn't stable across runs — sort by `(prop, conditions, value)`
    /// if you need determinism.
    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms
    }

    /// Consume the encoder and return its atom set. Cheaper than
    /// `atoms().clone()` because nothing has to be re-hashed; the inner
    /// set just moves out.
    #[must_use]
    pub fn into_atoms(self) -> FxHashSet<Atom> {
        self.atoms
    }

    /// `true` when no atoms have been recorded.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.atoms.is_empty()
    }

    /// Pre-reserve capacity in the atom set. Useful when the caller
    /// knows roughly how many atoms a batch will produce — saves
    /// rehash work on large extractions.
    pub fn reserve(&mut self, additional: usize) {
        self.atoms.reserve(additional);
    }

    /// Walk a style object (the argument to `css({ … })`) and emit one
    /// atom per leaf value. Mirrors `processAtomic` in the JS encoder.
    pub fn process_atomic(&mut self, style: &Literal) {
        debug_assert!(
            self.path.is_empty(),
            "path buffer must be empty between walks"
        );
        self.walk(style);
    }

    /// Decompose a [`Recipe`] into atoms via lazy iteration over
    /// `base`, every variant option's style, and every
    /// `compoundVariant.css`. No intermediate `Vec` allocation.
    pub fn process_atomic_recipe(&mut self, recipe: &Recipe) {
        for style in recipe.atomic_styles() {
            self.process_atomic(style);
        }
    }

    /// Decompose a [`SlotRecipe`] across all of its slots.
    pub fn process_atomic_slot_recipe(&mut self, recipe: &SlotRecipe) {
        for (_slot, styles) in recipe.atomic_styles_per_slot() {
            for style in styles {
                self.process_atomic(style);
            }
        }
    }

    /// Iterative-style recursion: walk descends with push, ascends
    /// with pop on the shared path buffer. The first non-condition
    /// key on the path is the atom's `prop`.
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
        // Leaf — capture an atom keyed by the running path.
        if let Some(atom) = self.atom_from_path(value) {
            self.atoms.insert(atom);
        }
    }

    fn atom_from_path(&self, leaf: &Literal) -> Option<Atom> {
        // Deepest non-condition segment is the prop. `find` walks
        // outer→inner, which matches JS semantics where the *first*
        // style key encountered is the property name.
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
    // 2^53 is exactly representable in f64 (the max-safe-integer
    // boundary). Above that, comparison drifts — keep the constant
    // as the literal f64.
    const MAX_SAFE_INT: f64 = 9_007_199_254_740_992.0;
    if value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INT {
        #[allow(clippy::cast_possible_truncation, reason = "bounds-checked above")]
        return (value as i64).to_string();
    }
    value.to_string()
}
