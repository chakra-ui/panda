//! Shared builders and snapshot helpers for the tokens integration suite.

use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use serde_json::json;

pub fn t(path: &str, value: &str, var: &str, category: TokenCategory) -> Token {
    Token::new(path, value, var, category)
}

pub fn snapshot_tokens(dict: &TokenDictionary) -> Vec<serde_json::Value> {
    dict.iter()
        .map(|token| {
            json!({
                "path": token.path.as_ref(),
                "value": token.value.as_ref(),
                "var": token.var.as_ref(),
                "category": token.category.as_str(),
                "condition": token.condition.as_deref(),
                "deprecated": token.deprecated,
                "description": token.description.as_deref(),
            })
        })
        .collect()
}

pub fn snapshot_token_values(
    dict: &TokenDictionary,
) -> std::collections::BTreeMap<String, serde_json::Value> {
    dict.iter()
        .map(|token| {
            let key = if let Some(condition) = token.condition.as_deref() {
                format!("{}@{condition}", token.path)
            } else {
                token.path.to_string()
            };
            (key, json!(token.value.as_ref()))
        })
        .collect()
}
