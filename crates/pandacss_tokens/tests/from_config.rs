//! `TokenDictionary::from_config` construction from a `UserConfig`: theme /
//! semantic / breakpoint collection, composite transforms, color-mix reference
//! expansion, css-var prefix/hash options, alias-chain resolution, deep
//! semantic conditions, and spacing middlewares.

use crate::common::{snapshot_token_values, snapshot_tokens};
use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::TokenDictionary;
use serde_json::json;

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "fixture-heavy config test keeps related token assertions together"
)]
fn from_config_collects_theme_tokens_semantic_tokens_and_breakpoints() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "breakpoints": {
                "sm": "640px",
                "md": "768px"
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": {
                            "value": "#f00",
                            "description": "Red 500",
                            "deprecated": true
                        }
                    }
                },
                "spacing": {
                    "DEFAULT": {
                        "value": "1rem"
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.red.500}",
                            "_dark": "#fff"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.red.500
      value: "#f00"
      var: var(--colors-red-500)
      category: colors
      condition: ~
      deprecated: true
      description: Red 500
    - path: spacing
      value: 1rem
      var: var(--spacing)
      category: spacing
      condition: ~
      deprecated: false
      description: ~
    - path: breakpoints.sm
      value: 640px
      var: var(--breakpoints-sm)
      category: breakpoints
      condition: ~
      deprecated: false
      description: ~
    - path: sizes.breakpoint-sm
      value: 640px
      var: var(--sizes-breakpoint-sm)
      category: sizes
      condition: ~
      deprecated: false
      description: ~
    - path: breakpoints.md
      value: 768px
      var: var(--breakpoints-md)
      category: breakpoints
      condition: ~
      deprecated: false
      description: ~
    - path: sizes.breakpoint-md
      value: 768px
      var: var(--sizes-breakpoint-md)
      category: sizes
      condition: ~
      deprecated: false
      description: ~
    - path: colors.fg
      value: var(--colors-red-500)
      var: var(--colors-fg)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.fg
      value: "#fff"
      var: var(--colors-fg)
      category: colors
      condition: _dark
      deprecated: false
      description: ~
    - path: colors.colorPalette
      value: var(--colors-color-palette)
      var: var(--colors-color-palette)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.colorPalette.500
      value: var(--colors-color-palette-500)
      var: var(--colors-color-palette-500)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
    assert_yaml_snapshot!(json!({
        "redDeprecated": dict.is_deprecated("colors.red.500"),
        "darkFg": dict
            .token_with_condition("colors.fg", "_dark")
            .map(|token| token.value.as_ref()),
    }), @r##"
    redDeprecated: true
    darkFg: "#fff"
    "##);
}

#[test]
fn from_config_collects_theme_variant_tokens_as_theme_conditions() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "bg": { "value": "#fff" }
                }
            }
        },
        "themes": {
            "dark": {
                "tokens": {
                    "colors": {
                        "bg": { "value": "#000" }
                    }
                },
                "semanticTokens": {
                    "colors": {
                        "fg": { "value": "{colors.bg}" }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.bg
      value: "#fff"
      var: var(--colors-bg)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.bg
      value: "#000"
      var: var(--colors-bg)
      category: colors
      condition: _themeDark
      deprecated: false
      description: ~
    - path: colors.fg
      value: var(--colors-bg)
      var: var(--colors-fg)
      category: colors
      condition: _themeDark
      deprecated: false
      description: ~
    - path: colors.colorPalette
      value: var(--colors-color-palette)
      var: var(--colors-color-palette)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
    let conditions: Vec<&str> = dict
        .conditions()
        .iter()
        .map(std::convert::AsRef::as_ref)
        .collect();
    assert_yaml_snapshot!(json!({ "conditions": conditions }), @r##"
    conditions:
      - _themeDark
    "##);
}

#[test]
fn from_config_transforms_composite_token_values() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                },
                "shadows": {
                    "sm": {
                        "value": {
                            "offsetX": 4,
                            "offsetY": 10,
                            "blur": 4,
                            "spread": 0,
                            "color": "{colors.red}"
                        }
                    },
                    "ring": {
                        "value": [
                            { "offsetX": 0, "offsetY": 1, "blur": 2, "spread": 0, "color": "rgb(0 0 0 / 0.1)" },
                            { "offsetX": 0, "offsetY": 0, "blur": 0, "spread": 1, "color": "{colors.red}" }
                        ]
                    }
                },
                "gradients": {
                    "brand": {
                        "value": {
                            "type": "linear",
                            "placement": "to right",
                            "stops": [
                                { "color": "{colors.red}", "position": 0 },
                                { "color": "blue", "position": 100 }
                            ]
                        }
                    }
                },
                "fonts": {
                    "body": { "value": ["Inter", "sans-serif"] }
                },
                "easings": {
                    "smooth": { "value": [0.4, 0, 0.2, 1] }
                },
                "borders": {
                    "base": {
                        "value": { "width": 1, "style": "solid", "color": "{colors.red}" }
                    }
                },
                "assets": {
                    "logo": { "value": { "type": "url", "value": "/logo.svg" } },
                    "mark": { "value": { "type": "svg", "value": "<svg viewBox=\"0 0 1 1\"><path fill=\"#000\"/></svg>" } }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    assets.logo: "url(\"/logo.svg\")"
    assets.mark: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 1 1'%3e%3cpath fill='black'/%3e%3c/svg%3e\")"
    borders.base: 1px solid var(--colors-red)
    colors.colorPalette: var(--colors-color-palette)
    colors.red: "#f00"
    easings.smooth: "cubic-bezier(0.4, 0, 0.2, 1)"
    fonts.body: "Inter, sans-serif"
    gradients.brand: "linear-gradient(to right, var(--colors-red) 0%, blue 100%)"
    shadows.ring: "0px 1px 2px 0px rgb(0 0 0 / 0.1), 0px 0px 0px 1px var(--colors-red)"
    shadows.sm: 4px 10px 4px 0px var(--colors-red)
    "##);
}

#[test]
fn from_config_expands_color_mix_references() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "pink": { "value": "#ff00ff" },
                    "border": { "value": "{colors.pink/30}" },
                    "ref": { "value": "{colors.border/40}" },
                    "overlay": { "value": "{colors.border/half}" }
                },
                "opacity": {
                    "half": { "value": 0.5 }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.pink/87}",
                            "_dark": "{colors.border}"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.border: "color-mix(in oklab, var(--colors-pink) 30%, transparent)"
    colors.colorPalette: var(--colors-color-palette)
    colors.fg: "color-mix(in oklab, var(--colors-pink) 87%, transparent)"
    colors.fg@_dark: var(--colors-border)
    colors.overlay: "color-mix(in oklab, var(--colors-border) 50%, transparent)"
    colors.pink: "#ff00ff"
    colors.ref: "color-mix(in oklab, var(--colors-border) 40%, transparent)"
    opacity.half: "0.5"
    "##);
}

#[test]
fn from_config_expands_alpha_modifier_reference_in_non_color_categories() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": { "ink": { "value": "#000000" } },
            },
            "semanticTokens": {
                "shadows": {
                    "embeddedAlpha": { "value": "3px 3px 0 {colors.ink/10}" },
                    "embeddedPlain": { "value": "3px 3px 0 {colors.ink}" },
                },
                "borders": {
                    "embeddedAlpha": { "value": "1px solid {colors.ink/10}" },
                },
                "gradients": {
                    "embeddedAlpha": { "value": "linear-gradient(to right, {colors.ink/10}, transparent)" },
                },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    borders.embeddedAlpha: "1px solid color-mix(in oklab, var(--colors-ink) 10%, transparent)"
    colors.colorPalette: var(--colors-color-palette)
    colors.ink: "#000000"
    gradients.embeddedAlpha: "linear-gradient(to right, color-mix(in oklab, var(--colors-ink) 10%, transparent), transparent)"
    shadows.embeddedAlpha: "3px 3px 0 color-mix(in oklab, var(--colors-ink) 10%, transparent)"
    shadows.embeddedPlain: 3px 3px 0 var(--colors-ink)
    "##);
}

#[test]
fn from_config_resolves_slash_keyed_token_reference_over_color_mix() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "sizes": { "1/2": { "value": "50%" } },
            },
            "semanticTokens": {
                "sizes": { "half": { "value": "{sizes.1/2}" } },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r#"
    sizes.1/2: 50%
    sizes.half: "var(--sizes-1\\/2)"
    "#);
}

#[test]
fn from_config_serializes_composite_shadow_semantic_token() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": { "ink": { "value": "#000000" } },
            },
            "semanticTokens": {
                "shadows": {
                    "composite": {
                        "value": { "offsetX": "3px", "offsetY": "3px", "blur": "0", "spread": "0", "color": "{colors.ink}" },
                    },
                },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.colorPalette: var(--colors-color-palette)
    colors.ink: "#000000"
    shadows.composite: 3px 3px 0 0 var(--colors-ink)
    "##);
}

/// `border` and `asset` share the composite path with `shadows`. Without the
/// `SemanticValue` variant order they deserialize as conditions, producing
/// `borders.card@color` / `assets.grid@type` instead of one serialized value.
#[test]
fn from_config_serializes_composite_border_and_asset_semantic_tokens() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": { "ink": { "value": "#000000" } },
            },
            "semanticTokens": {
                "borders": {
                    "card": { "value": { "color": "{colors.ink}", "width": "1px", "style": "solid" } },
                },
                "gradients": {
                    "sweep": { "value": { "type": "linear", "placement": "to right", "stops": ["{colors.ink}", "transparent"] } },
                },
                "assets": {
                    "grid": { "value": { "type": "svg", "value": "<svg/>" } },
                },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    assets.grid: "url(\"data:image/svg+xml,%3csvg/%3e\")"
    borders.card: 1px solid var(--colors-ink)
    colors.colorPalette: var(--colors-color-palette)
    colors.ink: "#000000"
    gradients.sweep: "linear-gradient(to right, var(--colors-ink), transparent)"
    "##);
}

/// `SemanticValue` tries the value before the conditions map, so a composite
/// object is no longer mistaken for conditions. This is the other direction:
/// a real conditions map whose branches are composites must still split into
/// per-condition tokens for every category that has a composite form.
#[test]
fn from_config_keeps_conditions_for_composite_semantic_tokens() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": { "ink": { "value": "#000000" }, "snow": { "value": "#ffffff" } },
            },
            "semanticTokens": {
                "shadows": {
                    "card": { "value": {
                        "base": { "offsetX": "0", "offsetY": "1px", "blur": "2px", "spread": "0", "color": "{colors.ink}" },
                        "_dark": { "offsetX": "0", "offsetY": "1px", "blur": "2px", "spread": "0", "color": "{colors.snow}" },
                    } },
                },
                "borders": {
                    "card": { "value": {
                        "base": { "color": "{colors.ink}", "width": "1px", "style": "solid" },
                        "_dark": { "color": "{colors.snow}", "width": "2px", "style": "dashed" },
                    } },
                },
                "gradients": {
                    "sweep": { "value": {
                        "base": { "type": "linear", "placement": "to right", "stops": ["{colors.ink}", "transparent"] },
                        "_dark": { "type": "linear", "placement": "to left", "stops": ["{colors.snow}", "transparent"] },
                    } },
                },
                "assets": {
                    "grid": { "value": {
                        "base": { "type": "svg", "value": "<svg/>" },
                        "_dark": { "type": "url", "value": "https://example.test/grid.png" },
                    } },
                },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    assets.grid: "url(\"data:image/svg+xml,%3csvg/%3e\")"
    assets.grid@_dark: "url(\"https://example.test/grid.png\")"
    borders.card: 1px solid var(--colors-ink)
    borders.card@_dark: 2px dashed var(--colors-snow)
    colors.colorPalette: var(--colors-color-palette)
    colors.ink: "#000000"
    colors.snow: "#ffffff"
    gradients.sweep: "linear-gradient(to right, var(--colors-ink), transparent)"
    gradients.sweep@_dark: "linear-gradient(to left, var(--colors-snow), transparent)"
    shadows.card: 0 1px 2px 0 var(--colors-ink)
    shadows.card@_dark: 0 1px 2px 0 var(--colors-snow)
    "##);
}

/// Shadow arrays and the `inset` flag also flow through the composite path.
#[test]
fn from_config_serializes_shadow_arrays_and_inset_semantic_tokens() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": { "ink": { "value": "#000000" }, "snow": { "value": "#ffffff" } },
            },
            "semanticTokens": {
                "shadows": {
                    "layered": { "value": [
                        { "offsetX": "0", "offsetY": "1px", "blur": "2px", "spread": "0", "color": "{colors.ink}" },
                        { "offsetX": "0", "offsetY": "4px", "blur": "8px", "spread": "0", "color": "{colors.snow}" },
                    ] },
                    "strings": { "value": ["0 1px 2px {colors.ink}", "0 4px 8px {colors.snow}"] },
                    "inner": { "value": { "offsetX": "0", "offsetY": "1px", "blur": "2px", "spread": "0", "color": "{colors.ink}", "inset": true } },
                },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.colorPalette: var(--colors-color-palette)
    colors.ink: "#000000"
    colors.snow: "#ffffff"
    shadows.inner: inset 0 1px 2px 0 var(--colors-ink)
    shadows.layered: "0 1px 2px 0 var(--colors-ink), 0 4px 8px 0 var(--colors-snow)"
    shadows.strings: "0 1px 2px var(--colors-ink), 0 4px 8px var(--colors-snow)"
    "##);
}

/// Composite values accept bare numbers where CSS needs a unit. A stop position
/// is a percentage along the gradient and a numeric placement is an angle;
/// emitting either unitless gives a gradient that renders wrong, or not at all.
#[test]
fn from_config_gives_numeric_gradient_values_their_css_unit() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "gradients": {
                    "angled": { "value": { "type": "linear", "placement": 45, "stops": ["red", "blue"] } },
                    "positioned": { "value": { "type": "linear", "placement": "to right", "stops": [
                        { "color": "red", "position": 0 },
                        { "color": "blue", "position": 100 },
                    ] } },
                    "keyword": { "value": { "type": "radial", "placement": "circle at center", "stops": ["red", "blue"] } },
                },
            },
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    gradients.angled: "linear-gradient(45deg, red, blue)"
    gradients.keyword: "radial-gradient(circle at center, red, blue)"
    gradients.positioned: "linear-gradient(to right, red 0%, blue 100%)"
    "##);
}

#[test]
fn from_config_uses_css_var_prefix_and_hash_options() {
    let config: UserConfig = serde_json::from_value(json!({
        "prefix": {
            "cssVar": "panda"
        },
        "hash": {
            "cssVar": true
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "500": {
                            "value": "#f00"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.red.500
      value: "#f00"
      var: var(--panda-iYfRb)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.colorPalette.500
      value: var(--panda-iOGEjQ)
      var: var(--panda-iOGEjQ)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
}

#[test]
fn from_config_resolves_alias_chains_like_js_dictionary() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "pink": { "value": "#ff00ff" },
                    "border": { "value": "{colors.pink}" },
                    "disabled": { "value": "{colors.border}" }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.border: var(--colors-pink)
    colors.colorPalette: var(--colors-color-palette)
    colors.disabled: var(--colors-border)
    colors.pink: "#ff00ff"
    "##);
}

#[test]
fn from_config_flattens_deep_semantic_conditions_like_js() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "pink": {
                        "value": {
                            "base": "#fff",
                            "osDark": {
                                "highCon": "sdfdfsd"
                            }
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.pink
      value: "#fff"
      var: var(--colors-pink)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.pink
      value: sdfdfsd
      var: var(--colors-pink)
      category: colors
      condition: "osDark:highCon"
      deprecated: false
      description: ~
    - path: colors.colorPalette
      value: var(--colors-color-palette)
      var: var(--colors-color-palette)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "fixture-heavy middleware test keeps related spacing assertions together"
)]
fn from_config_applies_spacing_middlewares() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "spacing": {
                    "0": { "value": "0rem" },
                    "sm": { "value": "0.25rem" },
                    "empty": { "value": "" }
                },
                "sizes": {
                    "full": { "value": "100%" }
                }
            },
            "semanticTokens": {
                "spacing": {
                    "gutter": {
                        "value": {
                            "base": "{spacing.sm}",
                            "_wide": "2rem"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_details(&dict), @r#"
    - path: sizes.full
      value: 100%
      var: var(--sizes-full)
      category: sizes
      condition: ~
      originalValue: ~
      extensions: {}
    - path: spacing.0
      value: 0rem
      var: var(--spacing-0)
      category: spacing
      condition: ~
      originalValue: ~
      extensions: {}
    - path: spacing.sm
      value: 0.25rem
      var: var(--spacing-sm)
      category: spacing
      condition: ~
      originalValue: ~
      extensions: {}
    - path: spacing.gutter
      value: var(--spacing-sm)
      var: var(--spacing-gutter)
      category: spacing
      condition: ~
      originalValue: "{spacing.sm}"
      extensions:
        semantic: "true"
    - path: spacing.gutter
      value: 2rem
      var: var(--spacing-gutter)
      category: spacing
      condition: _wide
      originalValue: ~
      extensions:
        semantic: "true"
    - path: spacing.-sm
      value: calc(var(--spacing-sm) * -1)
      var: ""
      category: spacing
      condition: ~
      originalValue: 0.25rem
      extensions:
        isNegative: "true"
        originalPath: spacing.sm
        prop: "-sm"
    - path: spacing.-empty
      value: calc(var(--spacing-empty) * -1)
      var: ""
      category: spacing
      condition: ~
      originalValue: ""
      extensions:
        isNegative: "true"
        originalPath: spacing.empty
        prop: "-empty"
    - path: spacing.-gutter
      value: calc(var(--spacing-gutter) * -1)
      var: ""
      category: spacing
      condition: ~
      originalValue: "{spacing.sm}"
      extensions:
        isNegative: "true"
        originalPath: spacing.gutter
        prop: "-gutter"
        semantic: "true"
    - path: spacing.-gutter
      value: calc(var(--spacing-gutter) * -1)
      var: ""
      category: spacing
      condition: _wide
      originalValue: 2rem
      extensions:
        isNegative: "true"
        originalPath: spacing.gutter
        prop: "-gutter"
        semantic: "true"
    "#);
}

fn snapshot_token_details(dict: &TokenDictionary) -> Vec<serde_json::Value> {
    dict.iter()
        .map(|token| {
            json!({
                "path": token.path.as_ref(),
                "value": token.value.as_ref(),
                "var": token.var.as_ref(),
                "category": token.category.as_str(),
                "condition": token.condition.as_deref(),
                "originalValue": token.original_value.as_deref(),
                "extensions": token
                    .extension_entries()
                    .collect::<std::collections::BTreeMap<_, _>>(),
            })
        })
        .collect()
}
