//! Color-palette generation: virtual palette tokens, DEFAULT keyword, nested
//! semantic defaults, include/exclude options (JS parity), semantic-token
//! includes, and disabling generation.

use crate::common::{build_dictionary, snapshot_token_values};
use insta::assert_yaml_snapshot;
use pandacss_tokens::TokenDictionary;
use serde_json::json;

#[test]
fn color_palettes_are_built_from_color_tokens() {
    let dict = build_dictionary(json!({
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
    }));

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
fn color_palette_handles_default_keyword() {
    let dict = build_dictionary(json!({
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
    }));

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
fn color_palette_handles_nested_semantic_defaults() {
    let dict = build_dictionary(json!({
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
    }));

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
fn color_palette_options_are_respected() {
    let dict = build_dictionary(json!({
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
    }));

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
fn color_palette_include_keeps_only_the_listed_palettes() {
    let include_dict = build_dictionary(json!({
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
    }));

    assert_yaml_snapshot!(snapshot_color_palettes(&include_dict), @r##"
    blue:
      "--colors-color-palette-500": var(--colors-blue-500)
      "--colors-color-palette-700": var(--colors-blue-700)
    red:
      "--colors-color-palette-500": var(--colors-red-500)
      "--colors-color-palette-700": var(--colors-red-700)
    "##);
}

#[test]
fn color_palette_exclude_drops_the_listed_palettes() {
    let exclude_dict = build_dictionary(json!({
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
    }));

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
fn color_palette_include_supports_semantic_tokens() {
    let dict = build_dictionary(json!({
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
    }));

    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    primary:
      "--colors-color-palette": var(--colors-primary)
    "##);
}

#[test]
fn color_palette_generation_can_be_disabled() {
    let dict = build_dictionary(json!({
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
    }));

    assert_yaml_snapshot!(json!({ "values": snapshot_token_values(&dict) }), @r##"
    values:
      colors.red.500: "#ef4444"
    "##);
    assert!(dict.color_palettes().is_empty());
}

#[test]
fn conditional_only_semantic_color_joins_its_palette() {
    let dict = build_dictionary(json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "blue": {
                        "solid": {
                            "value": { "_light": "{colors.blue.600}", "_dark": "{colors.blue.600}" }
                        }
                    }
                }
            }
        }
    }));

    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    blue:
      "--colors-color-palette-solid": var(--colors-blue-solid)
    "##);
}

/// Palettes with flat steps plus nested variant groups with `DEFAULT`s.
fn nested_palettes(color_palette: &serde_json::Value) -> TokenDictionary {
    let palette = |name: &str| {
        json!({
            "1": { "value": format!("#{name}1") },
            "a3": { "value": format!("#{name}a3") },
            "solid": {
                "bg": {
                    "DEFAULT": { "value": format!("#{name}9") },
                    "hover": { "value": format!("#{name}10") }
                }
            }
        })
    };
    build_dictionary(json!({
        "theme": {
            "colorPalette": color_palette,
            "semanticTokens": { "colors": { "red": palette("red"), "gray": palette("gray") } }
        }
    }))
}

fn palette_names(dict: &TokenDictionary) -> Vec<String> {
    let mut names: Vec<String> = dict
        .color_palettes()
        .palettes()
        .keys()
        .map(ToString::to_string)
        .collect();
    names.sort();
    names
}

#[test]
fn every_color_group_is_a_palette_by_default() {
    let dict = nested_palettes(&json!({}));
    assert_yaml_snapshot!(palette_names(&dict), @"
    - gray
    - gray.solid
    - gray.solid.bg
    - red
    - red.solid
    - red.solid.bg
    ");
}

#[test]
fn included_palette_maps_its_flat_and_nested_tokens() {
    let dict = nested_palettes(&json!({ "include": ["red"] }));
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r#"
    red:
      "--colors-color-palette-1": var(--colors-red-1)
      "--colors-color-palette-a3": var(--colors-red-a3)
      "--colors-color-palette-solid-bg": var(--colors-red-solid-bg)
      "--colors-color-palette-solid-bg-hover": var(--colors-red-solid-bg-hover)
    "#);
}

#[test]
fn included_palette_does_not_make_its_nested_groups_palettes() {
    let dict = nested_palettes(&json!({ "include": ["red", "gray"] }));
    assert_yaml_snapshot!(palette_names(&dict), @"
    - gray
    - red
    ");
}

#[test]
fn excluding_nested_names_keeps_top_level_palettes_with_their_whole_subtree() {
    let dict = nested_palettes(&json!({ "exclude": ["*.*"] }));
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r#"
    gray:
      "--colors-color-palette-1": var(--colors-gray-1)
      "--colors-color-palette-a3": var(--colors-gray-a3)
      "--colors-color-palette-solid-bg": var(--colors-gray-solid-bg)
      "--colors-color-palette-solid-bg-hover": var(--colors-gray-solid-bg-hover)
    red:
      "--colors-color-palette-1": var(--colors-red-1)
      "--colors-color-palette-a3": var(--colors-red-a3)
      "--colors-color-palette-solid-bg": var(--colors-red-solid-bg)
      "--colors-color-palette-solid-bg-hover": var(--colors-red-solid-bg-hover)
    "#);
}

#[test]
fn excluding_a_palette_drops_its_nested_palettes() {
    let dict = nested_palettes(&json!({ "exclude": ["gray"] }));
    assert_yaml_snapshot!(palette_names(&dict), @"
    - red
    - red.solid
    - red.solid.bg
    ");
}

#[test]
fn including_a_nested_group_keeps_its_ancestor_palette() {
    let dict = nested_palettes(&json!({ "include": ["red.solid"] }));
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r#"
    red:
      "--colors-color-palette-1": var(--colors-red-1)
      "--colors-color-palette-a3": var(--colors-red-a3)
      "--colors-color-palette-solid-bg": var(--colors-red-solid-bg)
      "--colors-color-palette-solid-bg-hover": var(--colors-red-solid-bg-hover)
    red.solid:
      "--colors-color-palette-bg": var(--colors-red-solid-bg)
      "--colors-color-palette-bg-hover": var(--colors-red-solid-bg-hover)
    "#);
}

#[test]
fn including_nested_groups_with_a_glob_keeps_the_root_palette() {
    let dict = nested_palettes(&json!({ "include": ["red.*"] }));
    assert_yaml_snapshot!(palette_names(&dict), @"
    - red
    - red.solid
    - red.solid.bg
    ");
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
