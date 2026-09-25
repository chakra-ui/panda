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

impl Literal {
    // PERF(port): style objects stay below the point where a hash map wins.
    pub fn upsert_object_entry(entries: &mut Vec<(String, Self)>, key: String, value: Self) {
        if let Some(entry) = entries.iter_mut().find(|(existing, _)| existing == &key) {
            entry.1 = value;
        } else {
            entries.push((key, value));
        }
    }

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
