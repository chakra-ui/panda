use std::sync::Arc;

use insta::assert_debug_snapshot;
use pandacss_config::UserConfig;
use pandacss_extractor::Literal;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

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
fn transform_unwraps_arbitrary_value_brackets() {
    let utility = Utility::from_config(&utility_config(json!({
        "width": { "className": "w" }
    })));

    let result = utility
        .transform("width", &Literal::String("[12px]".into()))
        .expect("arbitrary transform");

    assert_eq!(
        result.styles,
        Literal::Object(vec![("width".into(), Literal::String("12px".into()))]),
    );
    // The class name keeps the authored `[arbitrary]` literal.
    assert_eq!(result.class_name, "w_[12px]");
}

#[test]
fn transform_supports_negative_token_category_value() {
    let mut negative = Token::new(
        "spacing.-4",
        "calc(var(--spacing-4) * -1)",
        "",
        TokenCategory::Spacing,
    );
    negative.set_extension("isNegative", "true");

    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "spacing.4",
            "1rem",
            "var(--spacing-4)",
            TokenCategory::Spacing,
        ))
        .insert(negative)
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "margin": { "className": "m", "values": "spacing" }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let result = utility
        .transform("margin", &Literal::String("-4".into()))
        .expect("negative transform");

    assert_eq!(
        result.styles,
        Literal::Object(vec![(
            "margin".into(),
            Literal::String("calc(var(--spacing-4) * -1)".into())
        )]),
    );
    assert_eq!(result.class_name, "m_-4");
}
