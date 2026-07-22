//! `viewTransition()` bag-class hash — must match the codegen runtime.

use serde_json::{Map, Value};

use crate::hash::to_hash;
use crate::strings::number_to_js_string;

const SLOT_KEYS: [&str; 4] = ["group", "imagePair", "old", "new"];

#[derive(Debug, Clone, PartialEq)]
pub struct ViewTransitionStyle {
    pub class_name: String,
    pub group: Option<Value>,
    pub image_pair: Option<Value>,
    pub old: Option<Value>,
    pub new: Option<Value>,
}

impl ViewTransitionStyle {
    #[must_use]
    pub fn from_options(options: &Value, prefix: &str) -> Self {
        let class_name = view_transition_class_name(options, prefix);
        let Value::Object(map) = options else {
            return Self {
                class_name,
                group: None,
                image_pair: None,
                old: None,
                new: None,
            };
        };
        Self {
            class_name,
            group: map.get("group").cloned(),
            image_pair: map.get("imagePair").cloned(),
            old: map.get("old").cloned(),
            new: map.get("new").cloned(),
        }
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.group.is_none()
            && self.image_pair.is_none()
            && self.old.is_none()
            && self.new.is_none()
    }

    /// CSS pseudo suffix is kebab-case (`image-pair`, not `imagePair`).
    #[must_use]
    pub fn slot_bodies(&self) -> [(&'static str, Option<&Value>); 4] {
        [
            ("group", self.group.as_ref()),
            ("image-pair", self.image_pair.as_ref()),
            ("old", self.old.as_ref()),
            ("new", self.new.as_ref()),
        ]
    }
}

#[must_use]
pub fn stable_stringify(value: &Value) -> String {
    let mut out = String::new();
    push_stable_stringify(&mut out, value);
    out
}

fn push_stable_stringify(out: &mut String, value: &Value) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(true) => out.push_str("true"),
        Value::Bool(false) => out.push_str("false"),
        Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                out.push_str(&number_to_js_string(f));
            } else {
                out.push_str(&n.to_string());
            }
        }
        Value::String(s) => {
            out.push_str(&serde_json::to_string(s).unwrap_or_else(|_| "\"\"".into()));
        }
        Value::Array(items) => {
            out.push('[');
            for (i, item) in items.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                push_stable_stringify(out, item);
            }
            out.push(']');
        }
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            out.push('{');
            for (i, key) in keys.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                out.push_str(&serde_json::to_string(key).unwrap_or_else(|_| "\"\"".into()));
                out.push(':');
                push_stable_stringify(out, &map[*key]);
            }
            out.push('}');
        }
    }
}

#[must_use]
pub fn stable_stringify_view_transition(options: &Value) -> String {
    let filtered = filter_view_transition_slots(options);
    stable_stringify(&filtered)
}

#[must_use]
pub fn filter_view_transition_slots(options: &Value) -> Value {
    let Value::Object(map) = options else {
        return Value::Object(Map::new());
    };
    let mut filtered = Map::new();
    for key in SLOT_KEYS {
        if let Some(value) = map.get(key) {
            filtered.insert(key.to_owned(), value.clone());
        }
    }
    Value::Object(filtered)
}

#[must_use]
pub fn view_transition_base_class(options: &Value) -> String {
    let serialized = stable_stringify_view_transition(options);
    format!("vt_{}", to_hash(&serialized))
}

#[must_use]
pub fn view_transition_class_name(options: &Value, prefix: &str) -> String {
    let base = view_transition_base_class(options);
    if prefix.is_empty() {
        base
    } else {
        format!("{prefix}-{base}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn stable_stringify_sorts_object_keys() {
        let value = json!({ "b": 1, "a": { "z": true, "y": false } });
        assert_eq!(
            stable_stringify(&value),
            r#"{"a":{"y":false,"z":true},"b":1}"#
        );
    }

    #[test]
    fn view_transition_hash_ignores_unknown_keys() {
        let with_extra = json!({
            "group": { "animationDuration": "0.4s" },
            "ignored": true,
        });
        let without = json!({
            "group": { "animationDuration": "0.4s" },
        });
        assert_eq!(
            view_transition_base_class(&with_extra),
            view_transition_base_class(&without)
        );
        assert!(view_transition_base_class(&without).starts_with("vt_"));
    }

    #[test]
    fn prefix_joins_with_hyphen() {
        let options = json!({ "old": { "animationName": "fade" } });
        assert_eq!(
            view_transition_class_name(&options, "p"),
            format!("p-{}", view_transition_base_class(&options))
        );
    }
}
