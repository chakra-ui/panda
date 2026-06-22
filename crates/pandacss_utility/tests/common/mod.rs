use std::collections::BTreeMap;
use std::sync::Arc;

use pandacss_config::UtilityConfig;
use pandacss_extractor::Literal;
use pandacss_tokens::TokenDictionary;
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::Value;

#[allow(dead_code)]
pub fn utility_config(value: Value) -> BTreeMap<String, UtilityConfig> {
    serde_json::from_value(value).expect("utility config")
}

/// A `background`/`bg` utility bound to the `colors` category against an empty
/// token dictionary. Exercises the color-opacity (`color/alpha`) split through
/// the public `transform` color-mix path with no token entries to resolve.
#[allow(dead_code)]
pub fn color_opacity_utility() -> Utility {
    Utility::from_config_with_options(
        &utility_config(serde_json::json!({
            "background": { "shorthand": "bg", "className": "bg", "values": "colors" }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(TokenDictionary::builder().build())),
            ..UtilityOptions::default()
        },
    )
}

/// Transform a single `bg` value and return the resulting CSS string value.
/// Panics when the utility produces no result or a non-string style.
#[allow(dead_code)]
pub fn bg_value(utility: &Utility, value: &str) -> String {
    let result = utility
        .transform("bg", &Literal::String(value.into()))
        .expect("transform result");
    match result.styles {
        Literal::Object(entries) => match &entries[0].1 {
            Literal::String(value) => value.clone(),
            other => panic!("expected string value, got {other:?}"),
        },
        other => panic!("expected object styles, got {other:?}"),
    }
}
