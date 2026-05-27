use std::sync::Arc;

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, Encoder};
use pandacss_extractor::Literal;
use pandacss_tokens::TokenDictionary;
use pandacss_utility::{StyleNormalizer, Utility, UtilityOptions};
use serde_json::Value;

use crate::{StylesheetDiagnostic, StylesheetDiagnosticSeverity};

pub fn expand(config: &UserConfig, diagnostics: &mut Vec<StylesheetDiagnostic>) -> Vec<Atom> {
    let Some(css_rules) = config.static_css.get("css").and_then(Value::as_array) else {
        return Vec::new();
    };
    let dictionary = TokenDictionary::from_config(config)
        .ok()
        .flatten()
        .map(Arc::new);
    let utility = Utility::from_config_with_options(
        &config.utilities,
        UtilityOptions {
            separator: config.separator.clone(),
            prefix: config.prefix.class_name().map(str::to_owned),
            tokens: dictionary,
        },
    );
    let mut encoder = Encoder::new();
    let breakpoints = config.theme.breakpoint_names();
    let responsive = config
        .theme
        .breakpoint_names()
        .into_iter()
        .filter(|key| key != "base")
        .collect::<Vec<_>>();

    for rule in css_rules {
        let styles = expand_css_rule(rule, config, &utility, &responsive, diagnostics);
        if styles.is_empty() {
            continue;
        }
        for style in styles {
            let normalized = StyleNormalizer {
                utility: Some(&utility),
                breakpoints: &breakpoints,
                shorthand: true,
            }
            .normalize(&style);
            encoder.process_atomic(normalized.as_ref());
        }
    }

    let mut atoms: Vec<_> = encoder.into_atoms().into_iter().collect();
    atoms.sort_by(|a, b| a.prop().cmp(b.prop()));
    atoms
}

fn expand_css_rule(
    rule: &Value,
    config: &UserConfig,
    utility: &Utility,
    breakpoints: &[String],
    diagnostics: &mut Vec<StylesheetDiagnostic>,
) -> Vec<Literal> {
    let Some(properties) = rule.get("properties").unwrap_or(rule).as_object() else {
        return Vec::new();
    };
    let mut conditions = string_array(rule.get("conditions"));
    if rule
        .get("responsive")
        .and_then(Value::as_bool)
        .unwrap_or(false)
    {
        conditions.extend(breakpoints.iter().cloned());
    }

    let mut styles = Vec::new();
    for (property, values) in properties {
        if matches!(
            property.as_str(),
            "properties" | "conditions" | "responsive" | "recipes" | "patterns"
        ) {
            continue;
        }
        let values = static_values(values);
        let mut expanded = Vec::new();
        for value in values {
            if value == Literal::String("*".to_owned()) {
                let keys = utility.property_keys(property);
                if keys.is_empty() {
                    diagnostics.push(StylesheetDiagnostic {
                        severity: StylesheetDiagnosticSeverity::Warning,
                        message: format!("staticCss wildcard for `{property}` has no values"),
                    });
                }
                expanded.extend(keys.into_iter().map(Literal::String));
            } else {
                expanded.push(value);
            }
        }
        for value in expanded {
            if conditions.is_empty() {
                styles.push(Literal::Object(vec![(property.clone(), value)]));
            } else {
                styles.push(Literal::Object(vec![(
                    property.clone(),
                    conditional_value(config, &conditions, value),
                )]));
            }
        }
    }

    styles
}

fn conditional_value(config: &UserConfig, conditions: &[String], value: Literal) -> Literal {
    let mut entries = vec![("base".to_owned(), value.clone())];
    for condition in conditions {
        let key = if condition.starts_with('_') || config.theme.breakpoints.contains_key(condition)
        {
            condition.clone()
        } else {
            format!("_{condition}")
        };
        entries.push((key, value.clone()));
    }
    Literal::Object(entries)
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect()
        })
        .unwrap_or_default()
}

fn static_values(value: &Value) -> Vec<Literal> {
    match value {
        Value::Array(items) => items.iter().filter_map(value_to_literal).collect(),
        _ => value_to_literal(value).into_iter().collect(),
    }
}

fn value_to_literal(value: &Value) -> Option<Literal> {
    match value {
        Value::String(value) => Some(Literal::String(value.clone())),
        Value::Number(value) => value.as_f64().map(Literal::Number),
        Value::Bool(value) => Some(Literal::Bool(*value)),
        Value::Null => Some(Literal::Null),
        Value::Array(items) => Some(Literal::Array(
            items.iter().filter_map(value_to_literal).collect(),
        )),
        Value::Object(entries) => Some(Literal::Object(
            entries
                .iter()
                .filter_map(|(key, value)| Some((key.clone(), value_to_literal(value)?)))
                .collect(),
        )),
    }
}
