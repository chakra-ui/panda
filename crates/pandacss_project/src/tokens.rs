use std::collections::BTreeMap;

use pandacss_config::{Config, Theme, ThemeVariantsMap};
use pandacss_shared::{capitalize, number_to_js_string};
use pandacss_tokens::{Token, TokenCategory, TokenDictionary, TokenDictionaryBuilder};
use serde_json::Value;

pub(crate) fn create_token_dictionary(config: &Config) -> Option<TokenDictionary> {
    create_token_dictionary_from_theme(&config.theme, &config.themes)
}

fn create_token_dictionary_from_theme(
    theme: &Theme,
    themes: &ThemeVariantsMap,
) -> Option<TokenDictionary> {
    let mut builder = TokenDictionary::builder();
    let mut count = 0usize;

    collect_tokens(&mut builder, &theme.tokens, None, &mut count);
    collect_breakpoint_tokens(&mut builder, &theme.breakpoints, &mut count);
    collect_semantic_tokens(&mut builder, &theme.semantic_tokens, None, &mut count);

    for (name, variant) in themes {
        let condition = format!("_theme{}", capitalize(name));
        collect_tokens(&mut builder, &variant.tokens, Some(&condition), &mut count);
        collect_semantic_tokens(
            &mut builder,
            &variant.semantic_tokens,
            Some(&condition),
            &mut count,
        );
    }

    (count > 0).then(|| builder.build())
}

fn collect_breakpoint_tokens(
    builder: &mut TokenDictionaryBuilder,
    breakpoints: &BTreeMap<String, String>,
    count: &mut usize,
) {
    for (name, value) in breakpoints {
        push_token(builder, &format!("breakpoints.{name}"), value, None, count);
        push_token(
            builder,
            &format!("sizes.breakpoint-{name}"),
            value,
            None,
            count,
        );
    }
}

fn collect_tokens(
    builder: &mut TokenDictionaryBuilder,
    value: &Value,
    condition: Option<&str>,
    count: &mut usize,
) {
    walk_token_tree(value, &mut Vec::new(), &mut |path, token| {
        let Some(value) = token.get("value").and_then(token_value_to_string) else {
            return;
        };
        push_token(builder, &path.join("."), &value, condition, count);
    });
}

fn collect_semantic_tokens(
    builder: &mut TokenDictionaryBuilder,
    value: &Value,
    forced_condition: Option<&str>,
    count: &mut usize,
) {
    walk_token_tree(value, &mut Vec::new(), &mut |path, token| {
        let Some(value) = token.get("value") else {
            return;
        };
        let path = path.join(".");
        if let Some(condition) = forced_condition {
            if let Some(value) = token_value_to_string(value) {
                push_token(builder, &path, &value, Some(condition), count);
            }
            return;
        }

        match value {
            Value::Object(conditions) => {
                for (condition, value) in conditions {
                    let Some(value) = token_value_to_string(value) else {
                        continue;
                    };
                    let condition = (condition != "base").then_some(condition.as_str());
                    push_token(builder, &path, &value, condition, count);
                }
            }
            _ => {
                if let Some(value) = token_value_to_string(value) {
                    push_token(builder, &path, &value, None, count);
                }
            }
        }
    });
}

fn walk_token_tree<'a>(
    value: &'a Value,
    path: &mut Vec<&'a str>,
    visit: &mut impl FnMut(&[&'a str], &'a serde_json::Map<String, Value>),
) {
    let Value::Object(object) = value else {
        return;
    };
    if object.contains_key("value") {
        visit(path, object);
        return;
    }
    for (key, value) in object {
        path.push(key);
        walk_token_tree(value, path, visit);
        path.pop();
    }
}

fn push_token(
    builder: &mut TokenDictionaryBuilder,
    path: &str,
    value: &str,
    condition: Option<&str>,
    count: &mut usize,
) {
    let category = path.split_once('.').map_or_else(
        || TokenCategory::Other(path.to_owned()),
        |(category, _)| TokenCategory::from_path_segment(category),
    );
    let mut token = Token::new(path, value, css_var(path), category);
    if let Some(condition) = condition {
        token = token.with_condition(condition);
    }
    builder.push(token);
    *count += 1;
}

fn token_value_to_string(value: &Value) -> Option<String> {
    match value {
        Value::String(value) => Some(value.clone()),
        Value::Number(value) => Some(number_to_js_string(value.as_f64().unwrap_or(f64::NAN))),
        Value::Bool(value) => Some(value.to_string()),
        _ => None,
    }
}

fn css_var(path: &str) -> String {
    format!("var(--{})", path.replace('.', "-"))
}
