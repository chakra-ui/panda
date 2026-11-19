use pandacss_config::UserConfig;
use pandacss_encoder::ConditionMatcher;
use pandacss_literal::Literal;
use pandacss_shared::{Diagnostic, diagnostic_codes};
use serde_json::Value;

use pandacss_recipes::{Recipe, SlotRecipe};

use crate::ProjectConditionMatcher;
use crate::system::ConfigRecipe;

/// Collects `_`-prefixed keys that aren't defined conditions, once each, in the order they appear.
pub fn collect_unknown_conditions(
    value: &Literal,
    conditions: &ProjectConditionMatcher,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                push_unknown(key, conditions, out);
                collect_unknown_conditions(child, conditions, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_unknown_conditions(item, conditions, out);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
    }
}

fn collect_unknown_json_conditions(
    value: &Value,
    conditions: &ProjectConditionMatcher,
    out: &mut Vec<String>,
) {
    match value {
        Value::Object(entries) => {
            for (key, child) in entries {
                push_unknown(key, conditions, out);
                collect_unknown_json_conditions(child, conditions, out);
            }
        }
        Value::Array(items) => {
            for item in items {
                collect_unknown_json_conditions(item, conditions, out);
            }
        }
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_) => {}
    }
}

fn push_unknown(key: &str, conditions: &ProjectConditionMatcher, out: &mut Vec<String>) {
    if key.starts_with('_') && !conditions.is_condition(key) && !out.iter().any(|seen| seen == key)
    {
        out.push(key.to_owned());
    }
}

/// `unknown condition `_hovr`, did you mean `_hover`?`
#[must_use]
pub fn unknown_condition_message(key: &str, conditions: &ProjectConditionMatcher) -> String {
    let suggestion = pandacss_shared::closest_match(
        key,
        conditions.names().filter(|name| name.starts_with('_')),
    )
    .map(|name| format!(", did you mean `{name}`?"))
    .unwrap_or_default();
    format!("unknown condition `{key}`{suggestion}")
}

/// One warning per unknown condition in each config section that holds style objects.
pub(crate) fn config_unknown_condition_diagnostics(
    config: &UserConfig,
    conditions: &ProjectConditionMatcher,
    recipes: &[ConfigRecipe<Recipe>],
    slot_recipes: &[ConfigRecipe<SlotRecipe>],
) -> Vec<Diagnostic> {
    let mut out = Vec::new();
    let mut push = |source: &str, keys: Vec<String>| {
        for key in keys {
            out.push(Diagnostic::warning(
                diagnostic_codes::UNKNOWN_CONDITION,
                format!("{source}: {}", unknown_condition_message(&key, conditions)),
            ));
        }
    };

    if let Value::Object(rules) = &config.global_css {
        for (selector, styles) in rules {
            let mut keys = Vec::new();
            push_unknown(selector, conditions, &mut keys);
            collect_unknown_json_conditions(styles, conditions, &mut keys);
            push(&format!("globalCss[\"{selector}\"]"), keys);
        }
    }

    let theme = &config.theme;
    for (section, styles) in [
        ("textStyles", &theme.text_styles),
        ("layerStyles", &theme.layer_styles),
        ("animationStyles", &theme.animation_styles),
    ] {
        if let Value::Object(entries) = styles {
            for (name, entry) in entries {
                let mut keys = Vec::new();
                collect_unknown_json_conditions(entry, conditions, &mut keys);
                push(&format!("theme.{section}.{name}"), keys);
            }
        }
    }

    for (source, _, recipe) in recipes {
        let mut keys = Vec::new();
        for style in recipe.atomic_styles() {
            collect_unknown_conditions(style, conditions, &mut keys);
        }
        push(source, keys);
    }
    for (source, _, recipe) in slot_recipes {
        let mut keys = Vec::new();
        for (_, styles) in recipe.atomic_styles_per_slot() {
            for style in styles {
                collect_unknown_conditions(style, conditions, &mut keys);
            }
        }
        push(source, keys);
    }

    out
}
