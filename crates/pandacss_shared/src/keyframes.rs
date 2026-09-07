//! `keyframes()` animation-name hash — must match the codegen runtime.
//!
//! Inline keyframes hash the whole stops object to a stable name and merge
//! into `theme.keyframes` at emit. There is no named form (bare-name
//! `animationName: 'spin'` already resolves theme keyframes).

use serde_json::{Map, Value};

use crate::hash::to_hash;
use crate::stringify::stable_stringify;

/// An inline `keyframes({…})` block: hashed animation name plus the stops it
/// emits inside `@keyframes {name} { … }`. Merged with `theme.keyframes` at emit.
#[derive(Debug, Clone, PartialEq)]
pub struct InlineKeyframe {
    pub name: String,
    pub stops: Value,
}

impl InlineKeyframe {
    #[must_use]
    pub fn from_options(options: &Value, prefix: &str) -> Self {
        Self {
            name: keyframes_name(options, prefix),
            stops: normalize_stops(options),
        }
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        match &self.stops {
            Value::Object(map) => map.is_empty(),
            _ => true,
        }
    }
}

fn normalize_stops(options: &Value) -> Value {
    match options {
        Value::Object(_) => options.clone(),
        _ => Value::Object(Map::new()),
    }
}

fn with_prefix(base: &str, prefix: &str) -> String {
    if prefix.is_empty() {
        base.to_owned()
    } else {
        format!("{prefix}-{base}")
    }
}

#[must_use]
pub fn keyframes_base_name(stops: &Value) -> String {
    format!("kf_{}", to_hash(&stable_stringify(stops)))
}

/// Stable animation name for an inline `keyframes({…})` bag, plus optional `{prefix}-`.
#[must_use]
pub fn keyframes_name(stops: &Value, prefix: &str) -> String {
    with_prefix(&keyframes_base_name(stops), prefix)
}
