//! Pure host-facing value projections shared by native and WASM adapters.

use pandacss_encoder::{Atom, AtomValue};
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

/// Atoms in the stable `(prop, conditions, value)` order hosts expose, so
/// results don't depend on hash-set iteration order.
pub fn sorted_atoms<'a>(atoms: impl IntoIterator<Item = &'a Atom>) -> Vec<&'a Atom> {
    let mut sorted: Vec<&Atom> = atoms.into_iter().collect();
    sorted.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| {
                let a_conds: Vec<&str> = a.conditions().iter().map(AsRef::as_ref).collect();
                let b_conds: Vec<&str> = b.conditions().iter().map(AsRef::as_ref).collect();
                a_conds.cmp(&b_conds)
            })
            .then_with(|| value_sort_key(a.value()).cmp(&value_sort_key(b.value())))
    });
    sorted
}

fn value_sort_key(value: &AtomValue) -> String {
    match value {
        AtomValue::String(s) | AtomValue::Token { value: s, .. } => format!("s:{s}"),
        AtomValue::Number(s) => format!("n:{s}"),
        AtomValue::Bool(b) => format!("b:{b}"),
        AtomValue::Null => "z:".to_owned(),
    }
}

/// A token suggestion in the JSON shape hosts return to lint and IDE tooling.
#[must_use]
pub fn token_suggestion_json(suggestion: &pandacss_tokens::TokenSuggestion) -> Value {
    serde_json::json!({
        "token": suggestion.token,
        "semantic": suggestion.semantic,
        "conditional": suggestion.conditional,
    })
}
