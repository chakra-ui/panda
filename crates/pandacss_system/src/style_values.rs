use pandacss_config::UserConfig;
use pandacss_encoder::AtomValue;
use pandacss_literal::Literal;
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_utility::Utility;

/// Style-object key for a condition name: the condition itself when it's a
/// registered condition key, otherwise `_`-prefixed shorthand (`_hover`).
/// Shared by static-CSS expansion for recipes and for patterns.
#[must_use]
pub fn condition_style_key(config: &UserConfig, condition: &str) -> String {
    if config.is_condition_key(condition) {
        condition.to_owned()
    } else {
        format!("_{condition}")
    }
}

/// `mergeProps` — deep merge left to right, no normalization.
#[must_use]
pub fn merge_style_props(objects: &[&Literal]) -> Literal {
    let mut merged = Vec::new();
    for object in objects {
        if let Literal::Object(entries) = object {
            for (key, value) in entries {
                merge_style_entry(&mut merged, key.clone(), value.clone());
            }
        }
    }
    Literal::Object(merged)
}

/// One `mergeProps` step: nested objects merge, everything else is replaced.
/// Arrays count as values, matching the runtime `isObject`.
pub fn merge_style_entry(entries: &mut Vec<(String, Literal)>, key: String, value: Literal) {
    if let Some((_, existing)) = entries.iter_mut().find(|(name, _)| name == &key)
        && let (Literal::Object(target), Literal::Object(incoming)) = (&mut *existing, &value)
    {
        for (nested_key, nested_value) in incoming.clone() {
            merge_style_entry(target, nested_key, nested_value);
        }
        return;
    }
    Literal::upsert_object_entry(entries, key, value);
}

#[must_use]
pub fn literal_entries(value: &Literal) -> Option<&[(String, Literal)]> {
    match value {
        Literal::Object(entries) => Some(entries.as_slice()),
        _ => None,
    }
}

#[must_use]
pub fn is_empty_style_object(styles: &Literal) -> bool {
    matches!(styles, Literal::Object(entries) if entries.is_empty())
}

/// The `values`-resolved value to feed the transform (`spacing.4` ->
/// `var(--spacing-4)`), or the original verbatim if no category matches.
#[must_use]
pub fn resolved_atom_value(utility: Option<&Utility>, prop: &str, value: &AtomValue) -> AtomValue {
    let raw = match value {
        AtomValue::String(raw) | AtomValue::Number(raw) | AtomValue::Token { value: raw, .. } => {
            raw
        }
        AtomValue::Bool(_) | AtomValue::Null => return value.clone(),
    };
    let Some(utility) = utility else {
        return value.clone();
    };
    let resolved = utility.resolve_values_value(prop, raw);
    if resolved.as_str() == raw.as_ref() {
        value.clone()
    } else {
        AtomValue::String(resolved.into())
    }
}

#[must_use]
pub fn with_callback_target(
    mut diagnostic: Diagnostic,
    kind: &str,
    name: &str,
    value: Option<&str>,
) -> Diagnostic {
    if diagnostic.code != diagnostic_codes::TRANSFORM_CALLBACK_FAILED {
        return diagnostic;
    }
    let target = value.map_or_else(
        || format!("{kind} `{name}`"),
        |value| format!("{kind} `{name}` with value `{value}`"),
    );
    diagnostic.message = format!("{} ({target})", diagnostic.message);
    diagnostic
}

#[must_use]
pub fn atom_value_summary(value: &AtomValue) -> String {
    match value {
        AtomValue::String(value) | AtomValue::Number(value) | AtomValue::Token { value, .. } => {
            value.to_string()
        }
        AtomValue::Bool(value) => value.to_string(),
        AtomValue::Null => "null".to_owned(),
    }
}
