//! Expand the `staticCss.css` config into atoms — the always-emit rules a
//! project wants regardless of what the extractor finds. Wildcards (`"*"`)
//! fan out to every value a utility knows; `conditions`/`responsive` wrap each
//! value so it emits under the requested states.

use crate::static_css_diagnostics as diagnostics;

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, ConditionSet, Encoder};
use pandacss_extractor::Literal;
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::{StyleNormalizer, Utility};
use serde_json::Value;

/// Encode every `staticCss.css` rule into a sorted atom set.
pub fn expand(
    config: &UserConfig,
    utility: &Utility,
    token_dictionary: Option<&TokenDictionary>,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<Atom> {
    diagnostics::diagnose_recipes(config, diagnostics);
    let Some(css_rules) = config.static_css.get("css").and_then(Value::as_array) else {
        return Vec::new();
    };
    let mut encoder = Encoder::with_conditions(ConditionSet::from_names(
        config.condition_names().iter().map(String::as_str),
    ));
    let breakpoints = config.theme.breakpoint_names();
    let responsive = config
        .theme
        .breakpoint_names()
        .into_iter()
        .filter(|key| key != "base")
        .collect::<Vec<_>>();

    for rule in css_rules {
        let styles = expand_css_rule(
            rule,
            config,
            utility,
            token_dictionary,
            &responsive,
            diagnostics,
        );
        if styles.is_empty() {
            continue;
        }
        for style in styles {
            let normalized =
                StyleNormalizer::internal(Some(utility), &breakpoints).normalize(&style);
            encoder.process_atomic(normalized.as_ref());
        }
    }

    let mut atoms: Vec<_> = encoder.into_atoms().into_iter().collect();
    atoms.sort_by(|a, b| a.prop().cmp(b.prop()));
    atoms
}

pub(crate) fn has_static_css(config: &UserConfig) -> bool {
    !config.static_css.is_null()
        || config
            .theme
            .recipes
            .values()
            .chain(config.theme.slot_recipes.values())
            .any(|recipe| !recipe.static_css.is_null())
}

pub(crate) fn has_static_recipes(config: &UserConfig) -> bool {
    config.static_css.get("recipes").is_some()
        || config
            .theme
            .recipes
            .values()
            .chain(config.theme.slot_recipes.values())
            .any(|recipe| !recipe.static_css.is_null())
}

fn expand_css_rule(
    rule: &Value,
    config: &UserConfig,
    utility: &Utility,
    token_dictionary: Option<&TokenDictionary>,
    breakpoints: &[String],
    diagnostics: &mut Vec<Diagnostic>,
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
        diagnostics::diagnose_property(property, utility, diagnostics);
        let values = static_values(values);
        let mut expanded = Vec::new();
        for value in values {
            diagnostics::diagnose_token_refs(property, &value, token_dictionary, diagnostics);
            // `"*"` means "every value this utility defines" (enum keys or
            // token-category keys); anything else is a literal value.
            if value == Literal::String("*".to_owned()) {
                let keys = utility.property_keys(property);
                if keys.is_empty() {
                    diagnostics.push(Diagnostic::warning(
                        diagnostic_codes::STATIC_CSS_WILDCARD_EMPTY,
                        format!("staticCss wildcard for `{property}` has no values"),
                    ));
                }
                if diagnostics::is_large_wildcard(keys.len()) {
                    diagnostics.push(Diagnostic::info(
                        diagnostic_codes::STATIC_CSS_WILDCARD_LARGE,
                        format!(
                            "staticCss wildcard for `{property}` expands to {} values",
                            keys.len()
                        ),
                    ));
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
                    conditional_value(config, &conditions, &value),
                )]));
            }
        }
    }

    styles
}

/// Wrap a value as `{ base: value, <cond>: value, … }` so it emits both
/// unconditionally and under each condition. Bare names are prefixed with `_`
/// unless they're configured condition keys.
fn conditional_value(config: &UserConfig, conditions: &[String], value: &Literal) -> Literal {
    let mut entries = vec![("base".to_owned(), value.clone())];
    for condition in conditions {
        let key = if config.is_condition_key(condition) {
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
