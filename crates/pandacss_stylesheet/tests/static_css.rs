mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;

use common::{compile_css, compile_layer_css, compile_output, config};

#[test]
fn expands_static_css_utilities() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "css": [
                {
                    "conditions": ["hover"],
                    "properties": {
                        "color": ["red", "blue"]
                    }
                }
            ]
        },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Utilities]);
    assert_snapshot!(css, @r"
@layer utilities {
  .c_blue {
    color: blue;
  }
  .c_red {
    color: red;
  }
  .hover\:c_blue:hover {
    color: blue;
  }
  .hover\:c_red:hover {
    color: red;
  }
}
");
}

#[test]
fn expands_static_css_negative_token_category_values() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "spacing": {
                    "4": { "value": "1rem" }
                }
            }
        },
        "staticCss": {
            "css": [
                {
                    "properties": {
                        "margin": "*"
                    }
                }
            ]
        },
        "utilities": {
            "margin": { "className": "m", "values": "spacing" }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Utilities]);
    assert_snapshot!(css, @r"
@layer utilities {
  .m_-4 {
    margin: calc(var(--spacing-4) * -1);
  }
  .m_4 {
    margin: var(--spacing-4);
  }
}
");
}

#[test]
fn expands_static_css_color_opacity_modifiers() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "300": { "value": "#fca5a5" }
                    }
                }
            }
        },
        "staticCss": {
            "css": [
                {
                    "properties": {
                        "background": ["red.300/40", "red/30"]
                    }
                }
            ]
        },
        "utilities": {
            "background": { "className": "bg", "values": "colors" }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Utilities]);
    assert_snapshot!(css, @r"
@layer utilities {
  .bg_red\.300\/40 {
    background: color-mix(in srgb, var(--colors-red-300) 40%, transparent);
  }
  .bg_red\/30 {
    background: color-mix(in srgb, red 30%, transparent);
  }
}
");
}

#[test]
fn expands_static_css_responsive_breakpoints() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "css": [
                {
                    "responsive": true,
                    "properties": {
                        "color": ["red"]
                    }
                }
            ]
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Utilities]);
    assert_snapshot!(css, @r"
@layer utilities {
  .c_red {
    color: red;
  }
  @media (width >= 48rem) {
    .md\:c_red {
      color: red;
    }
  }
}
");
}

#[test]
fn expands_static_css_token_values_with_mixed_conditions_and_responsive() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "css": [
                {
                    "conditions": ["hoverFine"],
                    "responsive": true,
                    "properties": {
                        "color": ["blue.500", "red.500"]
                    }
                }
            ]
        },
        "conditions": {
            "hoverFine": ["@media (hover: hover)", "&:hover"]
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "tokens": {
                "colors": {
                    "blue": { "500": { "value": "#00f" } },
                    "red": { "500": { "value": "#f00" } }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Utilities]);
    assert_snapshot!(css, @r"
    @layer utilities {
      .c_blue\.500 {
        color: var(--colors-blue-500);
      }
      .c_red\.500 {
        color: var(--colors-red-500);
      }
      @media (width >= 48rem) {
        .md\:c_blue\.500 {
          color: var(--colors-blue-500);
        }
      }
      @media (width >= 48rem) {
        .md\:c_red\.500 {
          color: var(--colors-red-500);
        }
      }
      @media (hover: hover) {
        .hoverFine\:c_blue\.500:hover {
          color: var(--colors-blue-500);
        }
      }
      @media (hover: hover) {
        .hoverFine\:c_red\.500:hover {
          color: var(--colors-red-500);
        }
      }
    }
    ");
}

#[test]
fn reports_unsupported_themes_and_empty_wildcards() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "themes": ["light", "dark"],
            "css": [
                {
                    "properties": {
                        "color": "*",
                        "margin": "*"
                    }
                }
            ]
        },
        "utilities": {
            "color": { "className": "c" },
            "margin": { "className": "m", "values": ["1", "2"] }
        }
    }));
    let output = compile_output(&config, "", Default::default());
    let diagnostics = output
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.as_str())
        .collect::<Vec<_>>();

    assert_snapshot!(output.css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      .m_1 {
        margin: 1;
      }
      .m_2 {
        margin: 2;
      }
    }
    ");
    assert_snapshot!(diagnostics.join("\n"), @r"
    static_css_themes_unsupported
    static_css_wildcard_empty
    ");
}

#[test]
fn expands_static_css_recipe_wildcard() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": "*"
        },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" },
                            "md": { "padding": "12px" }
                        },
                        "variant": {
                            "solid": { "bg": "blue" },
                            "ghost": { "bg": "transparent" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
@layer recipes {
  @layer base {
    .button {
      display: inline-flex;
    }
  }
  .button--size_md {
    padding: 12px;
  }
  .button--size_sm {
    padding: 8px;
  }
  .button--variant_ghost {
    background-color: transparent;
  }
  .button--variant_solid {
    background-color: blue;
  }
}
");
}

#[test]
fn expands_recipe_level_static_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "padding": { "className": "p" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "staticCss": [{ "size": ["sm"] }],
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" },
                            "md": { "padding": "12px" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
@layer recipes {
  .button--size_sm {
    padding: 8px;
  }
}
");
}

#[test]
fn global_recipe_wildcard_overrides_recipe_level_static_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": "*"
        },
        "utilities": {
            "padding": { "className": "p" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "staticCss": [{ "size": ["sm"] }],
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" },
                            "md": { "padding": "12px" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
@layer recipes {
  .button--size_md {
    padding: 12px;
  }
  .button--size_sm {
    padding: 8px;
  }
}
");
}

#[test]
fn expands_static_css_recipe_conditions_and_responsive() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": {
                "button": [{ "conditions": ["hover"], "responsive": true, "size": ["sm"] }]
            }
        },
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        }
                    }
                }
            }
        },
        "utilities": {
            "padding": { "className": "p" }
        }
    }));
    let css = compile_layer_css(&config, "", &[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
@layer recipes {
  .button--size_sm {
    padding: 8px;
  }
  .hover\:button--size_sm:hover {
    padding: 8px;
  }
  @media (width >= 48rem) {
    .md\:button--size_sm {
      padding: 8px;
    }
  }
}
");
}

#[test]
fn expands_static_css_slot_recipe_wildcard() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": "*"
        },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" }
        },
        "theme": {
            "slotRecipes": {
                "checkbox": {
                    "className": "checkbox",
                    "slots": ["root", "control"],
                    "base": {
                        "root": { "display": "flex" },
                        "control": { "display": "inline-flex" }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "padding": "4px" },
                                "control": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes.slots {
  @layer base {
    .checkbox__control {
      display: inline-flex;
    }
    .checkbox__root {
      display: flex;
    }
  }
  .checkbox__control--size_sm {
    padding: 2px;
  }
  .checkbox__root--size_sm {
    padding: 4px;
  }
}
");
}

#[test]
fn expands_static_recipe_compound_variant_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": "*"
        },
        "utilities": {
            "padding": { "className": "p" },
            "borderWidth": { "className": "bw" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        },
                        "variant": {
                            "outline": { "borderWidth": "1px" }
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": "sm",
                            "variant": "outline",
                            "css": { "borderWidth": "2px" }
                        }
                    ]
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button--size_sm {
    padding: 8px;
  }
  .button--variant_outline {
    border-width: 1px;
  }
}
@layer utilities {
  .bw_2px {
    border-width: 2px;
  }
}
");
}
