use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use serde_json::json;

#[test]
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
            "containerNames": ["sidebar"],
            "containerSizes": {
                "sm": "320px"
            },
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
        "containerNames": &config.theme.container_names,
        "colorPalette": {
            "enabled": config.theme.color_palette.enabled,
            "include": &config.theme.color_palette.include,
            "exclude": &config.theme.color_palette.exclude,
        },
        "themes": config.themes.keys().collect::<Vec<_>>(),
    }), @r"
    breakpointNames:
      - base
      - sm
      - md
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
    containerNames:
      - sidebar
    colorPalette:
      enabled: true
      include:
        - red
      exclude:
        - gray
    themes:
      - dark
    ");
}
