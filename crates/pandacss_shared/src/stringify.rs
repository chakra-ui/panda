//! Deterministic JSON serialization shared by the content-addressed factory
//! hashes (`viewTransition`, `positionTry`, `keyframes`). Sorts object keys and
//! formats numbers like JS so Rust emit and the codegen runtime hash byte-identically.

use serde_json::Value;

use crate::strings::number_to_js_string;

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
