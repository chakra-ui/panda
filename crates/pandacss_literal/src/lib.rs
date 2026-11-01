//! Host-neutral literal values shared by extraction, recipes, encoding, and utility metadata.

use serde::ser::{SerializeMap, SerializeSeq};
use serde::{Serialize, Serializer};

use pandacss_shared::{is_js_safe_integer, number_to_js_string};

#[derive(Debug, Clone, PartialEq)]
pub enum Literal {
    String(String),
    /// A resolved token call: `value` is emitted CSS and `path` preserves identity.
    Token {
        path: String,
        value: String,
    },
    Number(f64),
    Bool(bool),
    Null,
    /// Source-ordered entries; extraction does not need keyed lookup.
    Object(Vec<(String, Literal)>),
    Array(Vec<Literal>),
    /// Branches from an expression whose deciding side is only known at runtime.
    Conditional(Vec<Literal>),
}

// === Object Entry Operations ===

impl Literal {
    // PERF(port): style objects stay below the point where a hash map wins.
    pub fn upsert_object_entry(entries: &mut Vec<(String, Self)>, key: String, value: Self) {
        if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
            entry.1 = value;
        } else {
            entries.push((key, value));
        }
    }

    /// Accumulates two possible values for the same object key.
    pub fn combine_object_entry(entries: &mut Vec<(String, Self)>, key: String, value: Self) {
        if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
            let previous = std::mem::replace(&mut entry.1, Self::Null);
            entry.1 = previous.combine_alternative(value);
        } else {
            entries.push((key, value));
        }
    }

    fn combine_alternative(self, other: Self) -> Self {
        let mut branches = match self {
            Self::Conditional(existing) => existing,
            single => vec![single],
        };
        match other {
            Self::Conditional(more) => branches.extend(more),
            single => branches.push(single),
        }
        Self::Conditional(branches)
    }
}

/// Merge two optional branches: same value returns once, both different wraps in Conditional, one present returns it.
#[must_use]
pub fn merge_optional_branches(left: Option<Literal>, right: Option<Literal>) -> Option<Literal> {
    match (left, right) {
        (Some(left_val), Some(right_val)) if left_val == right_val => Some(left_val),
        (Some(left_val), Some(right_val)) => Some(Literal::Conditional(vec![left_val, right_val])),
        (Some(only), None) | (None, Some(only)) => Some(only),
        (None, None) => None,
    }
}

// === Structural Queries ===

impl Literal {
    /// True when any value in the tree is decided only at runtime.
    #[must_use]
    pub fn has_conditional(&self) -> bool {
        match self {
            Self::Conditional(_) => true,
            Self::Object(entries) => entries.iter().any(|(_, value)| value.has_conditional()),
            Self::Array(items) => items.iter().any(Self::has_conditional),
            _ => false,
        }
    }

    /// One copy per runtime value of the first `Conditional` in the tree, or `None` when there is none.
    #[must_use]
    pub fn split_first_branch(&self) -> Option<Vec<Self>> {
        match self {
            Self::Conditional(_) => Some(self.runtime_values().into_iter().cloned().collect()),
            Self::Object(entries) => entries.iter().enumerate().find_map(|(index, (_, value))| {
                let variants = value.split_first_branch()?;
                Some(
                    variants
                        .into_iter()
                        .map(|variant| {
                            let mut entries = entries.clone();
                            entries[index].1 = variant;
                            Self::Object(entries)
                        })
                        .collect(),
                )
            }),
            Self::Array(items) => items.iter().enumerate().find_map(|(index, item)| {
                let variants = item.split_first_branch()?;
                Some(
                    variants
                        .into_iter()
                        .map(|variant| {
                            let mut items = items.clone();
                            items[index] = variant;
                            Self::Array(items)
                        })
                        .collect(),
                )
            }),
            _ => None,
        }
    }

    /// True if this is a String or Token (behaves like a string for coercion/equality).
    #[must_use]
    pub fn is_string_like(&self) -> bool {
        matches!(self, Self::String(_) | Self::Token { .. })
    }

    #[must_use]
    pub fn truthiness(&self) -> Option<bool> {
        self.decide(&mut |value| {
            Some(match value {
                Self::Null => false,
                Self::Bool(b) => *b,
                Self::Number(n) => *n != 0.0 && !n.is_nan(),
                Self::String(s) | Self::Token { value: s, .. } => !s.is_empty(),
                Self::Object(_) | Self::Array(_) | Self::Conditional(_) => true,
            })
        })
    }

    #[must_use]
    pub fn nullishness(&self) -> Option<bool> {
        self.decide(&mut |value| Some(matches!(value, Self::Null)))
    }

    /// Every value this could be at runtime, with nested `Conditional`s flattened.
    #[must_use]
    pub fn runtime_values(&self) -> Vec<&Self> {
        match self {
            Self::Conditional(branches) => branches.iter().flat_map(Self::runtime_values).collect(),
            value => vec![value],
        }
    }

    /// The runtime values `a || b` (`Or`) or `a ?? b` (`Coalesce`) can return from `a`.
    #[must_use]
    pub fn values_kept_by_default(&self, nullish_only: bool) -> Vec<&Self> {
        self.runtime_values()
            .into_iter()
            .filter(|value| {
                if nullish_only {
                    value.nullishness() != Some(true)
                } else {
                    value.truthiness() != Some(false)
                }
            })
            .collect()
    }

    /// `f` for every runtime value; a `Conditional` is decided only when its branches agree.
    pub fn decide(&self, f: &mut impl FnMut(&Self) -> Option<bool>) -> Option<bool> {
        let Self::Conditional(branches) = self else {
            return f(self);
        };
        let mut decided = None;
        for branch in branches {
            let value = branch.decide(f)?;
            if decided.is_some_and(|previous| previous != value) {
                return None;
            }
            decided = Some(value);
        }
        decided
    }

    /// Look up a member by key in an Object or Array.
    /// Objects use key lookup; arrays parse the key as a numeric index.
    #[must_use]
    pub fn get_member(&self, key: &str) -> Option<Self> {
        match self {
            Self::Object(entries) => entries
                .iter()
                .find(|(k, _)| k == key)
                .map(|(_, v)| v.clone()),
            Self::Array(items) => {
                let idx = key.parse::<usize>().ok()?;
                items.get(idx).cloned()
            }
            _ => None,
        }
    }

    /// Coerce to a number per JS semantics; objects/arrays/conditionals return None (would be NaN).
    #[must_use]
    pub fn to_number(&self) -> Option<f64> {
        match self {
            Self::Number(n) => Some(*n),
            Self::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
            Self::Null => Some(0.0),
            Self::String(s) | Self::Token { value: s, .. } => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    Some(0.0)
                } else {
                    trimmed.parse::<f64>().ok()
                }
            }
            Self::Object(_) | Self::Array(_) | Self::Conditional(_) => None,
        }
    }

    /// Convert to a property key string (for object member access); numbers stringify, bools/null return None.
    #[must_use]
    pub fn to_property_key(&self) -> Option<String> {
        match self {
            Self::String(s) | Self::Token { value: s, .. } => Some(s.clone()),
            Self::Number(n) => Some(number_to_js_string(*n)),
            Self::Bool(_)
            | Self::Null
            | Self::Object(_)
            | Self::Array(_)
            | Self::Conditional(_) => None,
        }
    }
}

// === JSON Conversion ===

impl Literal {
    /// Converts JSON while dropping nested children that cannot be represented.
    #[must_use]
    pub fn from_json(value: &serde_json::Value) -> Option<Self> {
        match value {
            serde_json::Value::String(value) => Some(Self::String(value.clone())),
            serde_json::Value::Number(value) => value.as_f64().map(Self::Number),
            serde_json::Value::Bool(value) => Some(Self::Bool(*value)),
            serde_json::Value::Null => Some(Self::Null),
            serde_json::Value::Array(items) => Some(Self::Array(
                items.iter().filter_map(Self::from_json).collect(),
            )),
            serde_json::Value::Object(entries) => Some(Self::Object(
                entries
                    .iter()
                    .filter_map(|(key, value)| Some((key.clone(), Self::from_json(value)?)))
                    .collect(),
            )),
        }
    }

    /// Converts JSON while rejecting the entire value when a child cannot be represented.
    #[must_use]
    pub fn from_json_strict(value: &serde_json::Value) -> Option<Self> {
        match value {
            serde_json::Value::String(value) => Some(Self::String(value.clone())),
            serde_json::Value::Number(value) => value.as_f64().map(Self::Number),
            serde_json::Value::Bool(value) => Some(Self::Bool(*value)),
            serde_json::Value::Null => Some(Self::Null),
            serde_json::Value::Array(items) => items
                .iter()
                .map(Self::from_json_strict)
                .collect::<Option<Vec<_>>>()
                .map(Self::Array),
            serde_json::Value::Object(entries) => entries
                .iter()
                .map(|(key, value)| Self::from_json_strict(value).map(|value| (key.clone(), value)))
                .collect::<Option<Vec<_>>>()
                .map(Self::Object),
        }
    }
}

// === Format Conversion ===

impl Literal {
    /// Returns the text contributed to one CSS declaration.
    #[must_use]
    pub fn to_css_value_text(&self) -> Option<String> {
        match self {
            Self::String(text) | Self::Token { value: text, .. } => Some(text.clone()),
            Self::Number(number) => Some(number_to_js_string(*number)),
            Self::Bool(_)
            | Self::Null
            | Self::Object(_)
            | Self::Array(_)
            | Self::Conditional(_) => None,
        }
    }

    /// Coerce to a condition string: strings/tokens pass through, numbers/bools stringify, others return None.
    #[must_use]
    pub fn to_condition_string(&self) -> Option<String> {
        match self {
            Self::String(value) | Self::Token { value, .. } => Some(value.clone()),
            Self::Number(value) => Some(number_to_js_string(*value)),
            Self::Bool(true) => Some("true".to_owned()),
            Self::Bool(false) => Some("false".to_owned()),
            Self::Null | Self::Object(_) | Self::Array(_) | Self::Conditional(_) => None,
        }
    }

    /// Coerce to a string per JS `ToString` semantics; objects/arrays/conditionals return None.
    #[must_use]
    pub fn to_loose_string(&self) -> Option<String> {
        match self {
            Self::String(s) | Self::Token { value: s, .. } => Some(s.clone()),
            Self::Number(n) => Some(number_to_js_string(*n)),
            Self::Bool(b) => Some(if *b { "true".into() } else { "false".into() }),
            Self::Null => Some("null".into()),
            Self::Object(_) | Self::Array(_) | Self::Conditional(_) => None,
        }
    }

    #[must_use]
    pub fn to_json(&self) -> serde_json::Value {
        match self {
            Self::String(value) | Self::Token { value, .. } => {
                serde_json::Value::String(value.clone())
            }
            Self::Number(value) => json_number(*value).unwrap_or(serde_json::Value::Null),
            Self::Bool(value) => serde_json::Value::Bool(*value),
            Self::Null => serde_json::Value::Null,
            Self::Object(entries) => serde_json::Value::Object(
                entries
                    .iter()
                    .map(|(key, value)| (key.clone(), value.to_json()))
                    .collect(),
            ),
            Self::Array(items) => {
                serde_json::Value::Array(items.iter().map(Self::to_json).collect())
            }
            Self::Conditional(branches) => serde_json::json!({
                "kind": "conditional",
                "branches": branches.iter().map(Self::to_json).collect::<Vec<_>>()
            }),
        }
    }
}

// === Serialization ===

impl Serialize for Literal {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::String(value) | Self::Token { value, .. } => serializer.serialize_str(value),
            Self::Number(value) => serialize_number(*value, serializer),
            Self::Bool(value) => serializer.serialize_bool(*value),
            Self::Null => serializer.serialize_unit(),
            Self::Object(entries) => {
                let mut map = serializer.serialize_map(Some(entries.len()))?;
                for (key, value) in entries {
                    map.serialize_entry(key, value)?;
                }
                map.end()
            }
            Self::Array(items) => {
                let mut sequence = serializer.serialize_seq(Some(items.len()))?;
                for item in items {
                    sequence.serialize_element(item)?;
                }
                sequence.end()
            }
            Self::Conditional(branches) => {
                let mut map = serializer.serialize_map(Some(2))?;
                map.serialize_entry("kind", "conditional")?;
                map.serialize_entry("branches", branches)?;
                map.end()
            }
        }
    }
}

// === Helper Functions ===

#[allow(
    clippy::cast_possible_truncation,
    reason = "bounds checked against Number.MAX_SAFE_INTEGER"
)]
fn serialize_number<S: Serializer>(value: f64, serializer: S) -> Result<S::Ok, S::Error> {
    if is_js_safe_integer(value) {
        serializer.serialize_i64(value as i64)
    } else {
        serializer.serialize_f64(value)
    }
}

#[allow(
    clippy::cast_possible_truncation,
    reason = "bounds checked against Number.MAX_SAFE_INTEGER"
)]
fn json_number(value: f64) -> Option<serde_json::Value> {
    if is_js_safe_integer(value) {
        Some(serde_json::Value::Number(serde_json::Number::from(
            value as i64,
        )))
    } else {
        serde_json::Number::from_f64(value).map(serde_json::Value::Number)
    }
}
