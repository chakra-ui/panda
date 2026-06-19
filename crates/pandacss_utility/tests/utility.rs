use std::collections::BTreeMap;
use std::sync::Arc;

use insta::{assert_debug_snapshot, assert_snapshot};
use pandacss_config::{UserConfig, UtilityConfig};
use pandacss_extractor::Literal;
use pandacss_shared::to_hash;
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
            shorthands: true,
            hash_class_names: false,
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
    let mut negative = Token::new(
        "spacing.-sm",
        "calc(var(--spacing-sm) * -1)",
        "",
        TokenCategory::Spacing,
    );
    negative.set_extension("isNegative", "true");

    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "spacing.sm",
            "4px",
            "var(--spacing-sm)",
            TokenCategory::Spacing,
        ))
        .insert(negative)
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
    let negative = utility
        .transform("spacing", &Literal::String("-sm".into()))
        .expect("negative transform");

    assert_debug_snapshot!((result, negative), @r#"
    (
        UtilityTransformResult {
            layer: None,
            class_name: "spacing_sm",
            styles: Object(
                [
                    (
                        "spacing",
                        String(
                            "var(--spacing-sm)",
                        ),
                    ),
                ],
            ),
        },
        UtilityTransformResult {
            layer: None,
            class_name: "spacing_-sm",
            styles: Object(
                [
                    (
                        "spacing",
                        String(
                            "calc(var(--spacing-sm) * -1)",
                        ),
                    ),
                ],
            ),
        },
    )
    "#);
}

#[test]
fn transform_escapes_unresolved_token_category_values() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.300",
            "#fca5a5",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "color": {
                "className": "c",
                "values": "colors"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let resolved = utility
        .transform("color", &Literal::String("red.300".into()))
        .expect("resolved category token");
    let unresolved = utility
        .transform("color", &Literal::String("ghost.white".into()))
        .expect("unresolved category token");
    let unresolved_opacity = utility
        .transform("color", &Literal::String("ghost.white/40".into()))
        .expect("unresolved category token with opacity");
    let raw_decimal = utility
        .transform("color", &Literal::String("oklch(0.5 0.1 200)".into()))
        .expect("valid raw color function");

    assert_eq!(
        resolved.styles,
        Literal::Object(vec![(
            "color".into(),
            Literal::String("var(--colors-red-300)".into())
        )]),
    );
    assert_eq!(
        unresolved.styles,
        Literal::Object(vec![(
            "color".into(),
            Literal::String("ghost\\.white".into())
        )]),
    );
    assert_eq!(
        unresolved_opacity.styles,
        Literal::Object(vec![(
            "color".into(),
            Literal::String("ghost\\.white\\/40".into())
        )]),
    );
    assert_eq!(
        raw_decimal.styles,
        Literal::Object(vec![(
            "color".into(),
            Literal::String("oklch(0.5 0.1 200)".into())
        )]),
    );
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "snapshot-heavy fixture keeps related color opacity assertions together"
)]
fn transform_supports_color_opacity_modifiers() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.300",
            "#fca5a5",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "opacity.half",
            "0.5",
            "var(--opacity-half)",
            TokenCategory::Opacity,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "background": {
                "shorthand": "bg",
                "className": "bg",
                "values": "colors"
            },
            "color": {
                "className": "c",
                "values": "colors"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let direct_token = utility.transform("bg", &Literal::String("red.300/40".into()));
    let direct_raw = utility.transform("bg", &Literal::String("red/30".into()));
    let curly = utility.transform("color", &Literal::String("{colors.red.300/40}".into()));
    let token_fn = utility.transform("bg", &Literal::String("token(colors.red.300/half)".into()));

    assert_debug_snapshot!(
        (direct_token, direct_raw, curly, token_fn),
        @r#"
    (
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "bg_red.300/40",
                styles: Object(
                    [
                        (
                            "background",
                            String(
                                "color-mix(in oklab, var(--colors-red-300) 40%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "bg_red/30",
                styles: Object(
                    [
                        (
                            "background",
                            String(
                                "color-mix(in oklab, red 30%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "c_{colors.red.300/40}",
                styles: Object(
                    [
                        (
                            "color",
                            String(
                                "color-mix(in oklab, var(--colors-red-300) 40%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "bg_token(colors.red.300/half)",
                styles: Object(
                    [
                        (
                            "background",
                            String(
                                "color-mix(in oklab, var(--colors-red-300) 50%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
    )
    "#);
}

#[test]
fn transform_supports_generated_color_palette_utility() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "300": { "value": "#fca5a5" },
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        }
    }))
    .expect("config");
    let tokens = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");
    let utility = Utility::from_config_with_options(
        &config.utilities,
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let result = utility
        .transform("colorPalette", &Literal::String("red".into()))
        .expect("transform");

    assert!(utility.is_known("colorPalette"));
    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "color-palette_red",
        styles: Object(
            [
                (
                    "--colors-color-palette-300",
                    String(
                        "var(--colors-red-300)",
                    ),
                ),
                (
                    "--colors-color-palette-500",
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
fn disabled_color_palette_generation_does_not_register_utility() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "enabled": false
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        }
    }))
    .expect("config");
    let tokens = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");
    let utility = Utility::from_config_with_options(
        &config.utilities,
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    assert!(!utility.is_known("colorPalette"));
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
#[allow(
    clippy::too_many_lines,
    reason = "snapshot-heavy fixture keeps related gradient assertions together"
)]
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
fn transform_escapes_unresolved_token_reference_values() {
    let tokens = TokenDictionary::builder().build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "background": {
                "shorthand": "bg",
                "className": "bg"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let wrapped = utility
        .transform("bg", &Literal::String("{colors.missing.500}".into()))
        .expect("wrapped reference transform");
    let plain_wrapped = utility
        .transform("bg", &Literal::String("{plain}".into()))
        .expect("plain wrapped reference transform");
    let token_fn = utility
        .transform("bg", &Literal::String("token(colors.missing.500)".into()))
        .expect("token function transform");
    let token_fn_with_fallback = utility
        .transform(
            "bg",
            &Literal::String("token(colors.missing.500, var(--fallback))".into()),
        )
        .expect("token function fallback transform");

    assert_eq!(
        wrapped.styles,
        Literal::Object(vec![(
            "background".into(),
            Literal::String("colors\\.missing\\.500".into())
        )]),
    );
    assert_eq!(
        plain_wrapped.styles,
        Literal::Object(vec![("background".into(), Literal::String("plain".into()))]),
    );
    assert_eq!(
        token_fn.styles,
        Literal::Object(vec![(
            "background".into(),
            Literal::String("colors\\.missing\\.500".into())
        )]),
    );
    assert_eq!(
        token_fn_with_fallback.styles,
        Literal::Object(vec![(
            "background".into(),
            Literal::String("var(--fallback)".into())
        )]),
    );
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

#[test]
fn resolve_values_value_maps_a_string_category_to_a_token_var() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "spacing.4",
            "1rem",
            "var(--spacing-4)",
            TokenCategory::Spacing,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "spaceX": { "values": "spacing" }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    // Node passes this resolved value as the positional argument to the
    // transform callback (`getPropertyRawValue` of the `spacing` category).
    assert_snapshot!(utility.resolve_values_value("spaceX", "4"), @"var(--spacing-4)");
}

#[test]
fn resolve_values_value_maps_an_inline_value_alias() {
    let utility = Utility::from_config(&utility_config(json!({
        "marginX": { "values": { "sm": "20px", "md": "40px" } }
    })));

    assert_snapshot!(utility.resolve_values_value("marginX", "sm"), @"20px");
}

#[test]
fn resolve_values_value_passes_through_when_no_category_matches() {
    let utility = Utility::from_config(&utility_config(json!({
        "size": {}
    })));

    // No `values` category — the original value reaches the transform verbatim.
    assert_snapshot!(utility.resolve_values_value("size", "4px"), @"4px");
}

#[test]
fn class_name_value_uses_authored_literal() {
    let utility = Utility::from_config(&utility_config(json!({
        "marginBottom": {
            "className": "mb",
            "values": { "2": "0.5rem", "4": "1rem" }
        }
    })));

    assert_eq!(utility.class_name_value("2"), "2");
    assert_eq!(utility.class_name_value("0.5rem"), "0.5rem");
    // Surrounding whitespace is trimmed to match the runtime
    // `withoutSpace(withoutImportant(value))`, which always `.trim()`s.
    assert_eq!(utility.class_name_value("0 auto "), "0_auto");
    assert_eq!(utility.class_name_value(" 0.5rem"), "0.5rem");
    assert_eq!(
        utility
            .value_alias_for_literal("marginBottom", "0.5rem")
            .as_deref(),
        Some("2"),
    );
    assert_snapshot!(
        utility.transform_str("marginBottom", "0.5rem").class_name,
        @"mb_0.5rem"
    );
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "one fixture keeps related resolver cases together"
)]
fn resolve_utility_value_describes_class_and_css_value() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#f00",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "color": {
                "className": "c",
                "values": "colors"
            },
            "marginBottom": {
                "className": "mb",
                "shorthand": "mb",
                "values": {
                    "2": "0.5rem",
                    "space": "0.5rem",
                    "4": "1rem"
                }
            },
            "width": {
                "className": "w"
            },
            "zIndex": {
                "className": "z"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let value_map_key = utility
        .resolve_utility_value("mb", &Literal::String("2".into()))
        .expect("value map key");
    let literal_with_aliases = utility
        .resolve_utility_value("marginBottom", &Literal::String("0.5rem".into()))
        .expect("literal with aliases");
    let arbitrary = utility
        .resolve_utility_value("width", &Literal::String("[calc(100% - 1rem)]".into()))
        .expect("arbitrary value");
    let arbitrary_important = utility
        .resolve_utility_value("width", &Literal::String("[4px] !important".into()))
        .expect("important arbitrary value");
    let token_reference = utility
        .resolve_utility_value("color", &Literal::String("{colors.red.500}".into()))
        .expect("token reference");
    let important = utility
        .resolve_utility_value("zIndex", &Literal::String("1002 !important".into()))
        .expect("important value");

    assert_debug_snapshot!(
        (
            value_map_key,
            literal_with_aliases,
            arbitrary,
            arbitrary_important,
            token_reference,
            important,
        ),
        @r#"
    (
        ResolvedUtilityValue {
            utility: "marginBottom",
            class_name: "mb_2",
            css_value: String(
                "0.5rem",
            ),
            important: false,
            source: ValueMap {
                key: "2",
                aliases: [
                    "space",
                ],
            },
        },
        ResolvedUtilityValue {
            utility: "marginBottom",
            class_name: "mb_0.5rem",
            css_value: String(
                "0.5rem",
            ),
            important: false,
            source: Literal {
                aliases: [
                    "2",
                    "space",
                ],
            },
        },
        ResolvedUtilityValue {
            utility: "width",
            class_name: "w_[calc(100%_-_1rem)]",
            css_value: String(
                "calc(100% - 1rem)",
            ),
            important: false,
            source: Arbitrary,
        },
        ResolvedUtilityValue {
            utility: "width",
            class_name: "w_[4px]!",
            css_value: String(
                "4px",
            ),
            important: true,
            source: Arbitrary,
        },
        ResolvedUtilityValue {
            utility: "color",
            class_name: "c_{colors.red.500}",
            css_value: String(
                "var(--colors-red-500)",
            ),
            important: false,
            source: TokenReference,
        },
        ResolvedUtilityValue {
            utility: "zIndex",
            class_name: "z_1002!",
            css_value: String(
                "1002",
            ),
            important: true,
            source: Literal {
                aliases: [],
            },
        },
    )
    "#,
    );
}

#[test]
fn resolve_utility_value_formats_class_prefix_and_separator() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "opacity": {
                "className": "op"
            }
        })),
        UtilityOptions {
            separator: Some("__".into()),
            prefix: Some("pd".into()),
            ..UtilityOptions::default()
        },
    );

    let resolved = utility
        .resolve_utility_value("opacity", &Literal::Number(0.5))
        .expect("resolved utility value");

    assert_eq!(resolved.class_name, "pd-op__0.5");
    assert_eq!(resolved.css_value, Literal::String("0.5".into()));
}

#[test]
fn resolve_utility_value_hashes_class_names_when_enabled() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "opacity": {
                "className": "op"
            }
        })),
        UtilityOptions {
            prefix: Some("pd".into()),
            hash_class_names: true,
            ..UtilityOptions::default()
        },
    );

    let resolved = utility
        .resolve_utility_value("opacity", &Literal::Number(0.5))
        .expect("resolved utility value");

    assert_eq!(resolved.class_name, format!("pd-{}", to_hash("op_0.5")));
}

#[test]
fn resolve_utility_value_rejects_non_scalar_values() {
    let utility = Utility::from_config(&utility_config(json!({
        "hideFrom": {
            "className": "hide",
            "values": {
                "sm": {
                    "@breakpoint sm": {
                        "display": "none"
                    }
                }
            }
        },
        "width": {
            "className": "w"
        }
    })));

    assert!(
        utility
            .resolve_utility_value("width", &Literal::Null)
            .is_none()
    );
    assert!(
        utility
            .resolve_utility_value(
                "width",
                &Literal::Array(vec![Literal::String("4px".into())])
            )
            .is_none()
    );
    assert!(
        utility
            .resolve_utility_value("hideFrom", &Literal::String("sm".into()))
            .is_none()
    );
}

#[test]
fn transform_str_emits_custom_property_target_from_serialized_property() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.border.muted",
            "#ccc",
            "var(--colors-border-muted)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "boxShadowColor": {
                "className": "bx-sh-c",
                "shorthand": "shadowColor",
                "values": "colors",
                "property": "--shadow-color",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.boxShadowColor.transform"
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    assert_debug_snapshot!(
        utility.transform_str("shadowColor", "border.muted").styles,
        @r#"
    Object(
        [
            (
                "--shadow-color",
                String(
                    "var(--colors-border-muted)",
                ),
            ),
        ],
    )
    "#);
}

#[test]
fn transform_str_does_not_reconstruct_color_mix_transform_callbacks() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.300",
            "#fca5a5",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "boxShadowColor": {
                "className": "bx-sh-c",
                "values": "colors",
                "property": "--shadow-color",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.boxShadowColor.transform"
                }
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    // The JS callback path and pure Rust config emission both write color
    // opacity modifiers directly to the serialized target property.
    assert_debug_snapshot!(
        utility.transform_str("boxShadowColor", "red.300/40").styles,
        @r#"
    Object(
        [
            (
                "--shadow-color",
                String(
                    "color-mix(in oklab, var(--colors-red-300) 40%, transparent)",
                ),
            ),
        ],
    )
    "#);
}
