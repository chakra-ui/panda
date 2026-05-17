use regex::Regex;
use serde_json::Value;

/// Compile a JavaScript-style regex source and flags pair into Rust `regex`.
///
/// Supported semantic flags are `i`, `m`, and `s`. JS-only stateful/unicode
/// flags (`g`, `u`, `y`, `d`) are accepted and ignored because they don't
/// change simple `test()`-style matching for JSX component names here.
#[must_use]
pub fn compile_js_regex(source: &str, flags: &str) -> Option<Regex> {
    let mut options = String::new();
    for flag in flags.chars() {
        match flag {
            'i' | 'm' | 's' => options.push(flag),
            'g' | 'u' | 'y' | 'd' => {}
            _ => return None,
        }
    }
    if options.is_empty() {
        Regex::new(source).ok()
    } else {
        Regex::new(&format!("(?{options}:{source})")).ok()
    }
}

/// Decode the JSON-safe representation emitted by the JS config serializer.
#[must_use]
pub fn regex_from_serialized_value(value: &Value) -> Option<Regex> {
    let object = value.as_object()?;
    if object.get("kind").and_then(Value::as_str) != Some("regex") {
        return None;
    }
    let source = object.get("source").and_then(Value::as_str)?;
    let flags = object.get("flags").and_then(Value::as_str).unwrap_or("");
    compile_js_regex(source, flags)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn compiles_js_regex_flags() {
        let regex = compile_js_regex("^panda", "i").unwrap();

        assert!(regex.is_match("PandaBox"));
    }

    #[test]
    fn compiles_serialized_regex_values() {
        let regex = regex_from_serialized_value(&json!({
            "kind": "regex",
            "source": "^panda",
            "flags": "i"
        }))
        .unwrap();

        assert!(regex.is_match("PandaBox"));
    }
}
