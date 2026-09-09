//! `positionTry()` dashed-ident hash — must match the codegen runtime.
//!
//! Unlike [`crate::view_transition`], a position-try block is a flat
//! descriptor object (like `@font-face`), so the whole object is hashed and
//! the factory returns a dashed-ident value, not a class.

use serde_json::{Map, Value};

use crate::hash::to_hash;
use crate::stringify::stable_stringify;

#[derive(Debug, Clone, PartialEq)]
pub struct PositionTryStyle {
    /// Dashed-ident used both as the `@position-try` name and the value the
    /// factory returns (`--pt_slide`, `--pt_{hash}`, optional `{prefix}-`).
    pub ident: String,
    /// Flat declaration block emitted inside `@position-try {ident} { … }`.
    pub descriptors: Value,
}

impl PositionTryStyle {
    /// Ad-hoc bag: ident is `--pt_{hash}` over the whole descriptor object.
    #[must_use]
    pub fn from_options(options: &Value, prefix: &str) -> Self {
        Self {
            ident: position_try_ident(options, prefix),
            descriptors: normalize_descriptors(options),
        }
    }

    /// Theme / preset bag keyed by name (`bottom` → `--pt_bottom`).
    #[must_use]
    pub fn from_named_options(name: &str, options: &Value, prefix: &str) -> Self {
        Self {
            ident: position_try_named_ident(name, prefix),
            descriptors: normalize_descriptors(options),
        }
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        match &self.descriptors {
            Value::Object(map) => map.is_empty(),
            _ => true,
        }
    }
}

fn normalize_descriptors(options: &Value) -> Value {
    match options {
        Value::Object(_) => options.clone(),
        _ => Value::Object(Map::new()),
    }
}

fn with_prefix(base: &str, prefix: &str) -> String {
    if prefix.is_empty() {
        format!("--{base}")
    } else {
        format!("--{prefix}-{base}")
    }
}

#[must_use]
pub fn position_try_base_ident(options: &Value) -> String {
    format!("pt_{}", to_hash(&stable_stringify(options)))
}

#[must_use]
pub fn position_try_ident(options: &Value, prefix: &str) -> String {
    with_prefix(&position_try_base_ident(options), prefix)
}

/// Stable dashed-ident for a theme bag: `--pt_{name}`, plus optional `{prefix}-`.
#[must_use]
pub fn position_try_named_ident(name: &str, prefix: &str) -> String {
    with_prefix(&format!("pt_{name}"), prefix)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn object_ident_hashes_the_whole_block() {
        let options = json!({ "top": "anchor(bottom)", "insetInlineStart": "anchor(start)" });
        let ident = position_try_ident(&options, "");
        assert!(ident.starts_with("--pt_"));
        // Key order does not change the hash.
        let reordered = json!({ "insetInlineStart": "anchor(start)", "top": "anchor(bottom)" });
        assert_eq!(ident, position_try_ident(&reordered, ""));
    }

    #[test]
    fn named_ident_uses_the_theme_key() {
        assert_eq!(position_try_named_ident("bottom", ""), "--pt_bottom");
        assert_eq!(position_try_named_ident("bottom", "p"), "--p-pt_bottom");
    }

    #[test]
    fn object_prefix_joins_before_pt() {
        let options = json!({ "top": "anchor(bottom)" });
        let base = position_try_base_ident(&options);
        assert_eq!(position_try_ident(&options, "p"), format!("--p-{base}"));
    }

    #[test]
    fn empty_block_is_reported_empty() {
        assert!(PositionTryStyle::from_options(&json!({}), "").is_empty());
        assert!(
            !PositionTryStyle::from_options(&json!({ "top": "anchor(bottom)" }), "").is_empty()
        );
    }
}
