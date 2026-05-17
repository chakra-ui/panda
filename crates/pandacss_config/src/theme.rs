use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub type TokenTree = Value;
pub type SemanticTokenTree = Value;
pub type StyleConfig = Value;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    #[serde(default)]
    pub breakpoints: BTreeMap<String, String>,
    #[serde(default)]
    pub keyframes: StyleConfig,
    #[serde(default)]
    pub tokens: TokenTree,
    #[serde(default)]
    pub semantic_tokens: SemanticTokenTree,
    #[serde(default)]
    pub text_styles: StyleConfig,
    #[serde(default)]
    pub layer_styles: StyleConfig,
    #[serde(default)]
    pub animation_styles: StyleConfig,
    #[serde(default)]
    pub recipes: BTreeMap<String, Value>,
    #[serde(default)]
    pub slot_recipes: BTreeMap<String, Value>,
    #[serde(default)]
    pub container_names: Vec<String>,
    #[serde(default)]
    pub container_sizes: BTreeMap<String, String>,
    #[serde(default)]
    pub color_palette: ColorPaletteOptions,
}

impl Theme {
    #[must_use]
    pub fn breakpoint_names(&self) -> Vec<String> {
        let mut entries: Vec<_> = self
            .breakpoints
            .iter()
            .map(|(name, value)| (name.clone(), breakpoint_sort_value(value)))
            .collect();
        entries.sort_by(|(name_a, value_a), (name_b, value_b)| {
            value_a
                .partial_cmp(value_b)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| name_a.cmp(name_b))
        });

        let mut names = Vec::with_capacity(entries.len() + 1);
        names.push("base".to_owned());
        names.extend(entries.into_iter().map(|(name, _)| name));
        names
    }
}

fn breakpoint_sort_value(value: &str) -> f64 {
    value
        .chars()
        .take_while(|ch| ch.is_ascii_digit() || *ch == '.')
        .collect::<String>()
        .parse()
        .unwrap_or(f64::INFINITY)
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorPaletteOptions {
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub include: Vec<String>,
    #[serde(default)]
    pub exclude: Vec<String>,
}

pub type ThemeVariantsMap = BTreeMap<String, ThemeVariant>;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeVariant {
    #[serde(default)]
    pub tokens: TokenTree,
    #[serde(default)]
    pub semantic_tokens: SemanticTokenTree,
}

#[cfg(test)]
mod tests {
    use insta::assert_yaml_snapshot;
    use serde_json::json;

    use crate::Config;

    #[test]
    fn deserializes_typed_theme_shape() {
        let config: Config = serde_json::from_value(json!({
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
                        "className": "button"
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
}
