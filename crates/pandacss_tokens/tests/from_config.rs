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
    gradients.brand: "linear-gradient(to right, var(--colors-red) 0px, blue 100px)"
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
      extensions: {}
    - path: spacing.gutter
      value: 2rem
      var: var(--spacing-gutter)
      category: spacing
      condition: _wide
      originalValue: ~
      extensions: {}
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
