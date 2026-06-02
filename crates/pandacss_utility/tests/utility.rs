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
fn property_keys_prefers_explicit_values_over_token_category() {
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
            "spacing.1",
            "spacing.2",
        ],
        [
            "spacing.1",
            "spacing.2",
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

#[test]
fn transform_supports_responsive_visibility_value_maps() {
    let utility = Utility::from_config(&utility_config(json!({
        "hideFrom": {
            "className": "hide",
            "values": {
                "sm": {
                    "@breakpoint sm": {
                        "display": "none"
                    }
                },
                "lg": {
                    "@breakpoint lg": {
                        "display": "none"
                    }
                }
            }
        },
        "hideBelow": {
            "className": "show",
            "values": {
                "sm": {
                    "@breakpoint smDown": {
                        "display": "none"
                    }
                },
                "lg": {
                    "@breakpoint lgDown": {
                        "display": "none"
                    }
                }
            }
        }
    })));

    let hide_from = utility
        .transform("hideFrom", &Literal::String("sm".into()))
        .expect("hideFrom transform");
    let hide_below = utility
        .transform("hideBelow", &Literal::String("lg".into()))
        .expect("hideBelow transform");

    assert_debug_snapshot!((hide_from, hide_below), @r#"
    (
        UtilityTransformResult {
            layer: None,
            class_name: "hide_sm",
            styles: Object(
                [
                    (
                        "@breakpoint sm",
                        Object(
                            [
                                (
                                    "display",
                                    String(
                                        "none",
                                    ),
                                ),
                            ],
                        ),
                    ),
                ],
            ),
        },
        UtilityTransformResult {
            layer: None,
            class_name: "show_lg",
            styles: Object(
                [
                    (
                        "@breakpoint lgDown",
                        Object(
                            [
                                (
                                    "display",
                                    String(
                                        "none",
                                    ),
                                ),
                            ],
                        ),
                    ),
                ],
            ),
        },
    )
    "#);
}

#[test]
fn transform_supports_gradient_value_maps_and_token_refs() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "gradients.primary",
            "linear-gradient(to right, #ff0000, #0000ff)",
            "var(--gradients-primary)",
            TokenCategory::Gradients,
        ))
        .insert(Token::new(
            "colors.red.200",
            "#fecaca",
            "var(--colors-red-200)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "colors.blue.300",
            "#93c5fd",
            "var(--colors-blue-300)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "backgroundGradient": {
                "shorthand": "bgGradient",
                "className": "bg-grad",
                "values": {
                    "primary": {
                        "backgroundImage": "{gradients.primary}"
                    },
                    "to-r": {
                        "--gradient-stops": "var(--gradient-via-stops, var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position))",
                        "--gradient-position": "to right",
                        "backgroundImage": "linear-gradient(var(--gradient-stops))"
                    },
                    "linear-gradient(var(--colors-red-200), var(--colors-blue-300))": {
                        "backgroundImage": "linear-gradient({colors.red.200}, {colors.blue.300})"
                    }
                }
            },
            "textGradient": {
                "className": "txt-grad",
                "values": {
                    "linear-gradient(var(--colors-red-200), var(--colors-blue-300))": {
                        "backgroundImage": "linear-gradient({colors.red.200}, {colors.blue.300})",
                        "-webkitBackgroundClip": "text",
                        "color": "transparent"
                    }
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let token = utility
        .transform("bgGradient", &Literal::String("primary".into()))
        .expect("token gradient");
    let shortcut = utility
        .transform("bgGradient", &Literal::String("to-r".into()))
        .expect("direction gradient");
    let text = utility
        .transform(
            "textGradient",
            &Literal::String("linear-gradient({colors.red.200}, {colors.blue.300})".into()),
        )
        .expect("text gradient");

    assert_debug_snapshot!((token, shortcut, text), @r#"
    (
        UtilityTransformResult {
            layer: None,
            class_name: "bg-grad_primary",
            styles: Object(
                [
                    (
                        "backgroundImage",
                        String(
                            "var(--gradients-primary)",
                        ),
                    ),
                ],
            ),
        },
        UtilityTransformResult {
            layer: None,
            class_name: "bg-grad_to-r",
            styles: Object(
                [
                    (
                        "--gradient-stops",
                        String(
                            "var(--gradient-via-stops, var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position))",
                        ),
                    ),
                    (
                        "--gradient-position",
                        String(
                            "to right",
                        ),
                    ),
                    (
                        "backgroundImage",
                        String(
                            "linear-gradient(var(--gradient-stops))",
                        ),
                    ),
                ],
            ),
        },
        UtilityTransformResult {
            layer: None,
            class_name: "txt-grad_linear-gradient({colors.red.200},_{colors.blue.300})",
            styles: Object(
                [
                    (
                        "backgroundImage",
                        String(
                            "linear-gradient(var(--colors-red-200), var(--colors-blue-300))",
                        ),
                    ),
                    (
                        "-webkitBackgroundClip",
                        String(
                            "text",
                        ),
                    ),
                    (
                        "color",
                        String(
                            "transparent",
                        ),
                    ),
                ],
            ),
        },
    )
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
