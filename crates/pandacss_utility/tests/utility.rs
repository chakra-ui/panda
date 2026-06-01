use std::collections::BTreeMap;
use std::sync::Arc;

use insta::assert_debug_snapshot;
use pandacss_config::UtilityConfig;
use pandacss_extractor::Literal;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::{Value, json};

fn utility_config(value: Value) -> BTreeMap<String, UtilityConfig> {
    serde_json::from_value(value).expect("utility config")
}

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
fn utility_values_normalize_aliases_to_raw_values() {
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
        Literal::Object(vec![("spacing".into(), Literal::String("8px".into()))]),
    );
}

#[test]
fn utility_values_normalize_nested_conditions() {
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
            Literal::Object(vec![("spacing".into(), Literal::String("4px".into()))]),
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
fn transform_uses_separator_prefix_and_class_name() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "spacing": {
                "shorthand": "s",
                "className": "sp",
                "values": {
                    "sm": "4px"
                }
            }
        })),
        UtilityOptions {
            separator: Some("__".into()),
            prefix: Some("panda".into()),
            tokens: None,
        },
    );

    let result = utility
        .transform("s", &Literal::String("sm".into()))
        .expect("transform");

    assert_debug_snapshot!((utility.format_class_name(&result.class_name), result), @r#"
    (
        "panda-sp__sm",
        UtilityTransformResult {
            layer: None,
            class_name: "sp__sm",
            styles: Object(
                [
                    (
                        "spacing",
                        String(
                            "4px",
                        ),
                    ),
                ],
            ),
        },
    )
    "#);
}

#[test]
fn transform_falls_back_to_hyphenated_property_class_name() {
    let utility = Utility::from_config(&utility_config(json!({})));

    let result = utility
        .transform("backgroundColor", &Literal::String("red".into()))
        .expect("transform");

    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "background-color_red",
        styles: Object(
            [
                (
                    "backgroundColor",
                    String(
                        "red",
                    ),
                ),
            ],
        ),
    }
    "#);
}

#[test]
fn transform_uses_configured_class_name_for_preset_utility() {
    let utility = Utility::from_config(&utility_config(json!({
        "backgroundColor": {
            "shorthand": "bgColor",
            "className": "bg-c",
            "values": "colors"
        }
    })));

    let result = utility
        .transform("bgColor", &Literal::String("red".into()))
        .expect("transform");

    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "bg-c_red",
        styles: Object(
            [
                (
                    "backgroundColor",
                    String(
                        "red",
                    ),
                ),
            ],
        ),
    }
    "#);
}

#[test]
fn transform_supports_token_category_values() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "spacing.sm",
            "4px",
            "var(--spacing-sm)",
            TokenCategory::Spacing,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "spacing": {
                "values": "spacing"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let result = utility
        .transform("spacing", &Literal::String("sm".into()))
        .expect("transform");

    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "spacing_sm",
        styles: Object(
            [
                (
                    "spacing",
                    String(
                        "4px",
                    ),
                ),
            ],
        ),
    }
    "#);
}

#[test]
fn transform_expands_token_references_in_values() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#f00",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({})),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let result = utility
        .transform("color", &Literal::String("token(colors.red.500)".into()))
        .expect("transform");

    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "color_token(colors.red.500)",
        styles: Object(
            [
                (
                    "color",
                    String(
                        "var(--colors-red-500)",
                    ),
                ),
            ],
        ),
    }
    "#);
}

#[test]
fn transform_preserves_layer() {
    let utility = Utility::from_config(&utility_config(json!({
        "textStyle": {
            "layer": "recipes",
            "values": ["body"]
        }
    })));

    let result = utility
        .transform("textStyle", &Literal::String("body".into()))
        .expect("transform");

    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: Some(
            "recipes",
        ),
        class_name: "text-style_body",
        styles: Object(
            [
                (
                    "textStyle",
                    String(
                        "body",
                    ),
                ),
            ],
        ),
    }
    "#);
}
