use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use serde_json::json;

#[test]
#[allow(clippy::too_many_lines, reason = "single end-to-end theme fixture")]
fn deserializes_typed_theme_shape() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "breakpoints": {
                "md": "768px",
                "sm": "640px"
            },
            "tokens": {
                "colors": {
                    "red": {
                        "value": "#f00"
                    }
                },
                "shadows": {
                    "sm": {
                        "value": {
                            "offsetX": 0,
                            "offsetY": 1,
                            "blur": 2,
                            "spread": 0,
                            "color": "{colors.red}"
                        }
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.red}"
                        }
                    }
                }
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "jsx": ["Button"],
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" }
                        }
                    },
                    "defaultVariants": {
                        "size": "sm"
                    },
                    "compoundVariants": [
                        {
                            "size": ["sm", "md"],
                            "css": { "fontWeight": "bold" }
                        }
                    ]
                }
            },
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root"]
                }
            },
            "containers": {
                "sm": "24rem",
                "md": "36rem",
                "xs": "320px"
            },
            "containerNames": ["card", "sidebar"],
            "colorPalette": {
                "enabled": true,
                "include": ["red"],
                "exclude": ["gray"]
            }
        },
        "themes": {
            "dark": {
                "tokens": {
                    "colors": {
                        "red": {
                            "value": "#c00"
                        }
                    }
                },
                "semanticTokens": {
                    "colors": {
                        "fg": {
                            "value": "{colors.red}"
                        }
                    }
                }
            }
        }
    }))
    .expect("valid typed config");

    assert_yaml_snapshot!(json!({
        "breakpointNames": config.theme.breakpoint_names(),
        "breakpointCondition": config.breakpoint_condition("smToMd"),
        "recipes": config.theme.recipes.keys().collect::<Vec<_>>(),
        "button": config.theme.recipes.get("button").map(|recipe| json!({
            "className": recipe.class_name.as_deref(),
            "jsx": recipe.jsx.len(),
            "base": recipe.base.as_ref(),
            "variants": recipe.variants.keys().collect::<Vec<_>>(),
            "defaultVariants": recipe.default_variants.keys().collect::<Vec<_>>(),
            "compoundVariants": recipe.compound_variants.len(),
        })),
        "slotRecipes": config.theme.slot_recipes.keys().collect::<Vec<_>>(),
        "containers": config.theme.container_names(),
        "containerCondition": config.container_condition("@card/md"),
        "containerNames": &config.theme.container_names,
        "colorPalette": {
            "enabled": config.theme.color_palette.enabled,
            "include": &config.theme.color_palette.include,
            "exclude": &config.theme.color_palette.exclude,
        },
        "themes": config.themes.keys().collect::<Vec<_>>(),
    }), @r##"
    breakpointNames:
      - base
      - sm
      - md
    breakpointCondition: "@media (width >= 40rem) and (width < 48rem)"
    recipes:
      - button
    button:
      className: button
      jsx: 1
      base:
        display: inline-flex
      variants:
        - size
      defaultVariants:
        - size
      compoundVariants: 1
    slotRecipes:
      - card
    containers:
      - card
      - sidebar
    containerCondition: "@container card (inline-size >= 36rem)"
    containerNames:
      - card
      - sidebar
    colorPalette:
      enabled: true
      include:
        - red
      exclude:
        - gray
    themes:
      - dark
    "##);
}

#[test]
fn condition_names_are_derived_from_config() {
    let config: UserConfig = serde_json::from_value(json!({
        "conditions": {
            "hover": "&:hover",
            "supportsGrid": "@supports (display: grid)"
        },
        "theme": {
            "breakpoints": {
                "md": "768px",
                "sm": "640px"
            },
            "containers": {
                "sm": "24rem",
                "md": "36rem"
            },
            "containerNames": ["card"]
        },
        "themes": {
            "primary": {},
            "primary-legacy": {}
        }
    }))
    .expect("valid typed config");

    assert_yaml_snapshot!(config.condition_names(), @r##"
    - "@/md"
    - "@/mdDown"
    - "@/mdOnly"
    - "@/sm"
    - "@/smDown"
    - "@/smOnly"
    - "@/smToMd"
    - "@card/md"
    - "@card/mdDown"
    - "@card/mdOnly"
    - "@card/sm"
    - "@card/smDown"
    - "@card/smOnly"
    - "@card/smToMd"
    - _hover
    - _supportsGrid
    - _themePrimary
    - _themePrimary-legacy
    - base
    - md
    - mdDown
    - mdOnly
    - sm
    - smDown
    - smOnly
    - smToMd
    "##);
}

#[test]
fn css_var_root_defaults_and_overrides() {
    let default_config: UserConfig = serde_json::from_value(json!({})).expect("default config");
    let override_config: UserConfig = serde_json::from_value(json!({
        "cssVarRoot": ":where(html)"
    }))
    .expect("override config");

    assert_yaml_snapshot!(json!({
        "default": default_config.css_var_root,
        "override": override_config.css_var_root,
    }), @r##"
    default: ":where(:root, :host)"
    override: ":where(html)"
    "##);
}

#[test]
fn preserves_global_css_in_serialized_config() {
    let config: UserConfig = serde_json::from_value(json!({
        "globalCss": {
            "html, body": {
                "margin": 0,
                "_hover": {
                    "color": "red"
                }
            }
        }
    }))
    .expect("valid typed config");

    let serialized = serde_json::to_value(&config).expect("serialized config");
    assert_yaml_snapshot!(serialized.get("globalCss"), @r#"
    "html, body":
      margin: 0
      _hover:
        color: red
    "#);
}

#[test]
fn preserves_global_vars_in_serialized_config() {
    let config: UserConfig = serde_json::from_value(json!({
        "globalVars": {
            "--random-color": "red",
            "--button-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            }
        }
    }))
    .expect("valid typed config");

    let serialized = serde_json::to_value(&config).expect("serialized config");
    assert_yaml_snapshot!(serialized.get("globalVars"), @r#"
    "--random-color": red
    "--button-color":
      syntax: "<color>"
      inherits: false
      initialValue: blue
    "#);
}
