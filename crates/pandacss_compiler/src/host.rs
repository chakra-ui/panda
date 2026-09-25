//! Pure host-facing value projections shared by native and WASM adapters.

use pandacss_encoder::AtomValue;
use pandacss_project::UtilityValueSource;
use pandacss_shared::Diagnostic;
use serde_json::Value;

/// Converts an atom value to the JSON shape exposed by compiler hosts.
#[must_use]
pub fn atom_value_json(value: &AtomValue) -> Value {
    match value {
        AtomValue::String(value) | AtomValue::Token { value, .. } => {
            Value::String(value.to_string())
        }
        AtomValue::Number(value) => number_json(value),
        AtomValue::Bool(value) => Value::Bool(*value),
        AtomValue::Null => Value::Null,
    }
}

/// Converts utility resolution metadata to its host-facing tagged JSON shape.
#[must_use]
pub fn utility_value_source_json(source: UtilityValueSource) -> Value {
    match source {
        UtilityValueSource::ValueMap { key, aliases } => {
            serde_json::json!({ "type": "value-map", "key": key, "aliases": aliases })
        }
        UtilityValueSource::Literal { aliases } => {
            serde_json::json!({ "type": "literal", "aliases": aliases })
        }
        UtilityValueSource::TokenReference => serde_json::json!({ "type": "token-reference" }),
        UtilityValueSource::Arbitrary => serde_json::json!({ "type": "arbitrary" }),
    }
}

/// Formats config diagnostics consistently across compiler adapters.
#[must_use]
pub fn format_config_diagnostics(diagnostics: &[Diagnostic]) -> String {
    let mut message = String::from("Invalid config:");
    for diagnostic in diagnostics {
        message.push_str("\n- [");
        message.push_str(&diagnostic.code);
        message.push_str("] ");
        message.push_str(&diagnostic.message);
    }
    message
}

fn number_json(value: &str) -> Value {
    if let Ok(value) = value.parse::<i64>() {
        return Value::from(value);
    }
    if let Ok(value) = value.parse::<f64>()
        && let Some(value) = serde_json::Number::from_f64(value)
    {
        return Value::Number(value);
    }
    Value::String(value.to_owned())
}
