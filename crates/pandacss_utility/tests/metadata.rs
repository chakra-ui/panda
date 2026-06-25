use std::sync::Arc;

use insta::assert_debug_snapshot;
use pandacss_extractor::Literal;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

#[test]
fn string_shorthand_maps_to_property() {
    let utility = Utility::from_config(&utility_config(json!({
        "padding": { "shorthand": "p" }
    })));

    assert_eq!(utility.resolve_shorthand("p"), "padding");
    assert_eq!(utility.resolve_shorthand("padding"), "padding");
    assert!(utility.is_known("p"));
    assert!(utility.is_known("padding"));
}

#[test]
fn array_shorthands_map_to_same_property() {
    let utility = Utility::from_config(&utility_config(json!({
        "margin": { "shorthand": ["m", "mg"] }
    })));

    assert_eq!(utility.resolve_shorthand("m"), "margin");
    assert_eq!(utility.resolve_shorthand("mg"), "margin");
}

#[test]
fn shorthands_can_be_disabled() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "margin": { "shorthand": ["m", "mg"] }
        })),
        UtilityOptions {
            shorthands: false,
            ..UtilityOptions::default()
        },
    );

    assert_eq!(utility.resolve_shorthand("m"), "m");
    assert_eq!(utility.canonical_property("m"), "margin");
    assert!(utility.is_known("margin"));
    assert!(!utility.is_known("m"));
}

#[test]
fn callback_transform_refs_are_exposed() {
    let utility = Utility::from_config(&utility_config(json!({
        "size": {
            "shorthand": "sz",
            "transform": {
                "kind": "js-callback",
                "id": "utilities.size.transform"
            }
        }
    })));

    assert_eq!(
        utility.callback_transform_id("size"),
        Some("utilities.size.transform"),
    );
    assert_eq!(
        utility.callback_transform_id("sz"),
        Some("utilities.size.transform"),
    );
}

#[test]
fn utility_values_keep_value_map_keys() {
    let utility = Utility::from_config(&utility_config(json!({
        "spacing": {
            "shorthand": "s",
            "values": {
                "sm": "4px",
                "md": "8px"
            }
        }
    })));
    let style = Literal::Object(vec![
        ("spacing".into(), Literal::String("sm".into())),
        ("s".into(), Literal::String("md".into())),
    ]);

    assert_eq!(
        utility.normalize_style_object(&style),
        Literal::Object(vec![("spacing".into(), Literal::String("md".into()))]),
    );
}

#[test]
fn utility_values_normalize_nested_conditions_keep_value_map_keys() {
    let utility = Utility::from_config(&utility_config(json!({
        "spacing": {
            "values": {
                "sm": "4px"
            }
        }
    })));
    let style = Literal::Object(vec![(
        "_hover".into(),
        Literal::Object(vec![("spacing".into(), Literal::String("sm".into()))]),
    )]);

    assert_eq!(
        utility.normalize_style_object(&style),
        Literal::Object(vec![(
            "_hover".into(),
            Literal::Object(vec![("spacing".into(), Literal::String("sm".into()))]),
        )]),
    );
}

#[test]
fn malformed_entries_are_ignored() {
    let utility = Utility::from_config(&utility_config(json!({})));

    assert!(utility.is_empty());
    assert_eq!(utility.resolve_shorthand("p"), "p");
}

#[test]
fn normalizes_nested_style_object_keys() {
    let utility = Utility::from_config(&utility_config(json!({
        "padding": { "shorthand": "p" },
        "margin": { "shorthand": ["m"] }
    })));
    let style = Literal::Object(vec![(
        "_hover".into(),
        Literal::Object(vec![
            ("p".into(), Literal::String("4".into())),
            ("m".into(), Literal::String("2".into())),
        ]),
    )]);

    assert_eq!(
        utility.normalize_style_object(&style),
        Literal::Object(vec![(
            "_hover".into(),
            Literal::Object(vec![
                ("padding".into(), Literal::String("4".into())),
                ("margin".into(), Literal::String("2".into())),
            ]),
        )]),
    );
}

#[test]
fn property_keys_prefers_explicit_values_over_token_category() {
    let mut negative = Token::new(
        "spacing.-1",
        "calc(var(--spacing-1) * -1)",
        "",
        TokenCategory::Spacing,
    );
    negative.set_extension("isNegative", "true");

    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "spacing.1",
            "0.25rem",
            "var(--spacing-1)",
            TokenCategory::Spacing,
        ))
        .insert(Token::new(
            "spacing.2",
            "0.5rem",
            "var(--spacing-2)",
            TokenCategory::Spacing,
        ))
        .insert(negative)
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "gap": {
                "shorthand": "g",
                "values": {
                    "sm": "1rem",
                    "lg": "2rem"
                }
            },
            "padding": {
                "shorthand": "p",
                "values": "spacing"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    assert_debug_snapshot!(
        (
            utility.property_keys("gap"),
            utility.property_keys("g"),
            utility.property_keys("padding"),
            utility.property_keys("p"),
            utility.property_keys("unknown"),
        ),
        @r#"
    (
        [
            "lg",
            "sm",
        ],
        [
            "lg",
            "sm",
        ],
        [
            "-1",
            "1",
            "2",
        ],
        [
            "-1",
            "1",
            "2",
        ],
        [],
    )
    "#,
    );
}

#[test]
fn token_category_values_need_a_dictionary() {
    let utility = Utility::from_config(&utility_config(json!({
        "margin": {
            "className": "m",
            "values": "spacing"
        }
    })));

    assert_eq!(utility.token_category("margin"), Some("spacing"));
    assert_eq!(utility.property_keys("margin"), Vec::<String>::new());
    assert_debug_snapshot!(
        utility
            .transform("margin", &Literal::String("4".into()))
            .expect("transform"),
        @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "m_4",
        styles: Object(
            [
                (
                    "margin",
                    String(
                        "4",
                    ),
                ),
            ],
        ),
    }
    "#,
    );
}
