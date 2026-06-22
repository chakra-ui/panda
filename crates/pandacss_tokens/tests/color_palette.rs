//! Color-palette generation: virtual palette tokens, DEFAULT keyword, nested
//! semantic defaults, include/exclude options (JS parity), semantic-token
//! includes, and disabling generation.

use crate::common::snapshot_token_values;
use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::TokenDictionary;
use serde_json::json;

#[test]
fn from_config_builds_color_palette_view() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "primary": { "value": "#111" },
                    "red": {
                        "300": { "value": "#fca5a5" },
                        "500": { "value": "#ef4444" }
                    },
                    "button": {
                        "light": {
                            "accent": {
                                "secondary": { "value": "#123456" }
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

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.button.light.accent.secondary: "#123456"
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.300: var(--colors-color-palette-300)
    colors.colorPalette.500: var(--colors-color-palette-500)
    colors.colorPalette.accent.secondary: var(--colors-color-palette-accent-secondary)
    colors.colorPalette.light.accent.secondary: var(--colors-color-palette-light-accent-secondary)
    colors.colorPalette.secondary: var(--colors-color-palette-secondary)
    colors.primary: "#111"
    colors.red.300: "#fca5a5"
    colors.red.500: "#ef4444"
    "##);
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    button:
      "--colors-color-palette-light-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light:
      "--colors-color-palette-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light.accent:
      "--colors-color-palette-secondary": var(--colors-button-light-accent-secondary)
    primary:
      "--colors-color-palette": var(--colors-primary)
    red:
      "--colors-color-palette-300": var(--colors-red-300)
      "--colors-color-palette-500": var(--colors-red-500)
    "##);
}

#[test]
fn from_config_color_palette_handles_default_keyword() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "brand": {
                        "DEFAULT": { "value": "green" },
                        "hot": {
                            "DEFAULT": { "value": "blue" },
                            "er": { "value": "#FF0000" }
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
    colors.brand: green
    colors.brand.hot: blue
    colors.brand.hot.er: "#FF0000"
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.er: var(--colors-color-palette-er)
    colors.colorPalette.hot: var(--colors-color-palette-hot)
    colors.colorPalette.hot.er: var(--colors-color-palette-hot-er)
    "##);
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    brand:
      "--colors-color-palette": var(--colors-brand)
      "--colors-color-palette-hot": var(--colors-brand-hot)
      "--colors-color-palette-hot-er": var(--colors-brand-hot-er)
    brand.hot:
      "--colors-color-palette": var(--colors-brand-hot)
      "--colors-color-palette-er": var(--colors-brand-hot-er)
    "##);
}

#[test]
fn from_config_color_palette_handles_nested_semantic_defaults() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "button": {
                        "dark": {
                            "value": "navy"
                        },
                        "light": {
                            "DEFAULT": {
                                "value": "skyblue"
                            },
                            "accent": {
                                "DEFAULT": {
                                    "value": "cyan"
                                },
                                "secondary": {
                                    "value": "blue"
                                }
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

    assert_yaml_snapshot!(snapshot_token_values(&dict), @"
    colors.button.dark: navy
    colors.button.light: skyblue
    colors.button.light.accent: cyan
    colors.button.light.accent.secondary: blue
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.accent: var(--colors-color-palette-accent)
    colors.colorPalette.accent.secondary: var(--colors-color-palette-accent-secondary)
    colors.colorPalette.dark: var(--colors-color-palette-dark)
    colors.colorPalette.light: var(--colors-color-palette-light)
    colors.colorPalette.light.accent: var(--colors-color-palette-light-accent)
    colors.colorPalette.light.accent.secondary: var(--colors-color-palette-light-accent-secondary)
    colors.colorPalette.secondary: var(--colors-color-palette-secondary)
    ");
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    button:
      "--colors-color-palette-dark": var(--colors-button-dark)
      "--colors-color-palette-light": var(--colors-button-light)
      "--colors-color-palette-light-accent": var(--colors-button-light-accent)
      "--colors-color-palette-light-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light:
      "--colors-color-palette": var(--colors-button-light)
      "--colors-color-palette-accent": var(--colors-button-light-accent)
      "--colors-color-palette-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light.accent:
      "--colors-color-palette": var(--colors-button-light-accent)
      "--colors-color-palette-secondary": var(--colors-button-light-accent-secondary)
    "##);
}

#[test]
fn from_config_respects_color_palette_options() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "include": ["red*"]
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" },
                        "muted": { "value": "#fee2e2" }
                    },
                    "blue": {
                        "500": { "value": "#3b82f6" }
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
    colors.blue.500: "#3b82f6"
    colors.colorPalette.500: var(--colors-color-palette-500)
    colors.colorPalette.muted: var(--colors-color-palette-muted)
    colors.red.500: "#ef4444"
    colors.red.muted: "#fee2e2"
    "##);
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    red:
      "--colors-color-palette-500": var(--colors-red-500)
      "--colors-color-palette-muted": var(--colors-red-muted)
    "##);
}

#[test]
fn from_config_color_palette_include_exclude_match_js_cases() {
    let include_config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "include": ["red", "blue"]
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#red500" },
                        "700": { "value": "#red700" }
                    },
                    "blue": {
                        "500": { "value": "#blue500" },
                        "700": { "value": "#blue700" }
                    },
                    "green": {
                        "500": { "value": "#green500" },
                        "700": { "value": "#green700" }
                    }
                }
            }
        }
    }))
    .expect("config");
    let include_dict = TokenDictionary::from_config(&include_config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_color_palettes(&include_dict), @r##"
    blue:
      "--colors-color-palette-500": var(--colors-blue-500)
      "--colors-color-palette-700": var(--colors-blue-700)
    red:
      "--colors-color-palette-500": var(--colors-red-500)
      "--colors-color-palette-700": var(--colors-red-700)
    "##);

    let exclude_config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "exclude": ["red"]
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#red500" },
                        "700": { "value": "#red700" }
                    },
                    "blue": {
                        "500": { "value": "#blue500" },
                        "700": { "value": "#blue700" }
                    },
                    "green": {
                        "500": { "value": "#green500" },
                        "700": { "value": "#green700" }
                    }
                }
            }
        }
    }))
    .expect("config");
    let exclude_dict = TokenDictionary::from_config(&exclude_config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_color_palettes(&exclude_dict), @r##"
    blue:
      "--colors-color-palette-500": var(--colors-blue-500)
      "--colors-color-palette-700": var(--colors-blue-700)
    green:
      "--colors-color-palette-500": var(--colors-green-500)
      "--colors-color-palette-700": var(--colors-green-700)
    "##);
}

#[test]
fn from_config_color_palette_include_supports_semantic_tokens() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "include": ["primary"]
            },
            "tokens": {
                "colors": {
                    "blue": { "500": { "value": "#blue500" } },
                    "red": { "500": { "value": "#red500" } },
                    "green": { "500": { "value": "#green500" } }
                }
            },
            "semanticTokens": {
                "colors": {
                    "primary": { "value": "{colors.blue.500}" },
                    "secondary": { "value": "{colors.red.500}" },
                    "accent": { "value": "{colors.green.500}" }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    primary:
      "--colors-color-palette": var(--colors-primary)
    "##);
}

#[test]
fn from_config_can_disable_color_palette_generation() {
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

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(json!({ "values": snapshot_token_values(&dict) }), @r##"
    values:
      colors.red.500: "#ef4444"
    "##);
    assert!(dict.color_palettes().is_empty());
}

fn snapshot_color_palettes(
    dict: &TokenDictionary,
) -> std::collections::BTreeMap<String, std::collections::BTreeMap<String, String>> {
    dict.color_palettes()
        .palettes()
        .iter()
        .map(|(palette, values)| {
            (
                palette.to_string(),
                values
                    .iter()
                    .map(|(key, value)| (key.to_string(), value.to_string()))
                    .collect(),
            )
        })
        .collect()
}
