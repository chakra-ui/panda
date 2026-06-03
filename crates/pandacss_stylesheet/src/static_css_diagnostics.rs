use pandacss_config::{RecipeConfig, UserConfig};
use pandacss_extractor::Literal;
use pandacss_shared::css_properties::is_css_property;
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;
use serde_json::Value;

const LARGE_WILDCARD_THRESHOLD: usize = 250;

pub(super) fn diagnose_property(
    property: &str,
    utility: &Utility,
    diagnostics: &mut Vec<Diagnostic>,
) {
    if property.starts_with("--") || utility.is_known(property) || is_css_property(property) {
        return;
    }
    diagnostics.push(Diagnostic::warning(
        diagnostic_codes::STATIC_CSS_PROPERTY_UNKNOWN,
        format!("staticCss.css references unknown property `{property}`"),
    ));
}

pub(super) fn diagnose_token_refs(
    property: &str,
    value: &Literal,
    dictionary: Option<&TokenDictionary>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    if !property.starts_with("--") {
        return;
    }
    let Literal::String(value) = value else {
        return;
    };
    for reference in token_like_references(value) {
        // Opacity modifiers are not part of the token path. `{colors.red.300/40}`
        // should validate against `colors.red.300`.
        let path = reference
            .split_once('/')
            .map_or(reference, |(path, _)| path);
        if dictionary.is_some_and(|dictionary| dictionary.token(path).is_some()) {
            continue;
        }
        diagnostics.push(Diagnostic::warning(
            diagnostic_codes::STATIC_CSS_TOKEN_REFERENCE_UNKNOWN,
            format!("staticCss.css `{property}` references unknown token `{path}`"),
        ));
    }
}

pub(super) fn diagnose_recipes(config: &UserConfig, diagnostics: &mut Vec<Diagnostic>) {
    let Some(Value::Object(recipes)) = config.static_css.get("recipes") else {
        return;
    };
    for (recipe_name, rules) in recipes {
        let Some(recipe) = config
            .theme
            .recipes
            .get(recipe_name)
            .or_else(|| config.theme.slot_recipes.get(recipe_name))
        else {
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::STATIC_CSS_RECIPE_UNKNOWN,
                format!("staticCss.recipes references unknown recipe `{recipe_name}`"),
            ));
            continue;
        };
        for rule in static_recipe_rule_values(rules) {
            diagnose_recipe_rule(recipe_name, recipe, rule, diagnostics);
        }
    }
}

pub(super) fn is_large_wildcard(count: usize) -> bool {
    count > LARGE_WILDCARD_THRESHOLD
}

fn diagnose_recipe_rule(
    recipe_name: &str,
    recipe: &RecipeConfig,
    rule: &Value,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let Some(entries) = rule.as_object() else {
        return;
    };
    for (variant, selected) in entries {
        if matches!(variant.as_str(), "conditions" | "responsive") {
            continue;
        }
        let Some(options) = recipe.variants.get(variant) else {
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::STATIC_CSS_RECIPE_VARIANT_UNKNOWN,
                format!("staticCss.recipes.`{recipe_name}` references unknown variant `{variant}`"),
            ));
            continue;
        };
        for value in static_recipe_selected_values(selected) {
            if value == "*" || options.contains_key(value) {
                continue;
            }
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::STATIC_CSS_RECIPE_VARIANT_VALUE_UNKNOWN,
                format!(
                    "staticCss.recipes.`{recipe_name}` variant `{variant}` references unknown value `{value}`"
                ),
            ));
        }
    }
}

fn token_like_references(value: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut rest = value;
    while let Some(start) = rest.find('{') {
        rest = &rest[start + 1..];
        let Some(end) = rest.find('}') else {
            break;
        };
        let reference = rest[..end].trim();
        if is_token_like(reference) {
            out.push(reference);
        }
        rest = &rest[end + 1..];
    }

    // Custom props also accept direct token-path shorthand:
    // `{ "--accent": "colors.red.300" }`.
    let trimmed = value.trim();
    if out.is_empty() && is_token_like(trimmed) {
        out.push(trimmed);
    }
    out
}

fn is_token_like(value: &str) -> bool {
    !value.is_empty()
        && value.contains('.')
        && !value.chars().any(char::is_whitespace)
        && value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '.' | '-' | '_' | '/'))
}

fn static_recipe_rule_values(value: &Value) -> Vec<&Value> {
    match value {
        Value::Array(items) => items.iter().collect(),
        other => vec![other],
    }
}

fn static_recipe_selected_values(value: &Value) -> Vec<&str> {
    match value {
        Value::String(value) => vec![value.as_str()],
        Value::Array(items) => items.iter().filter_map(Value::as_str).collect(),
        Value::Object(entries) => entries
            .iter()
            .filter(|(key, _)| !matches!(key.as_str(), "base" | "conditions" | "responsive"))
            .flat_map(|(_, value)| static_recipe_selected_values(value))
            .collect(),
        _ => Vec::new(),
    }
}
