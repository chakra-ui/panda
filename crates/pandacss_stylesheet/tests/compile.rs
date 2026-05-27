use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_project::Project;
use pandacss_stylesheet::{StylesheetInput, StylesheetOptions};

fn config(value: serde_json::Value) -> UserConfig {
    serde_json::from_value(value).expect("valid config")
}

fn compile_css(config: &UserConfig, source: &str) -> String {
    let mut project = Project::from_config(config.clone()).expect("valid project");
    project.parse_file("/style.ts", source);
    let snapshot = project.encoded_recipes().snapshot();
    let static_snapshot = project.static_encoded_recipes(config);
    let atoms = project.atoms().iter().collect::<Vec<_>>();
    pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            atoms,
            encoded_recipes: &snapshot,
            static_encoded_recipes: Some(&static_snapshot),
        },
        &StylesheetOptions {
            optimize: false,
            include_static: true,
            ..StylesheetOptions::default()
        },
    )
    .css
}

#[test]
fn emits_dynamic_atomic_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .bg_blue {
    background-color: blue;
  }
  .c_red {
    color: red;
  }
}
");
}

#[test]
fn emits_conditions_and_breakpoints() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
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
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _hover: { md: { color: 'red' } } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @media (width >= 48rem) {
    .hover\:md\:c_red:hover {
      color: red;
    }
  }
}
");
}

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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
fn emits_config_recipe_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "display": "inline-flex"
                    },
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        },
                        "variant": {
                            "solid": { "bg": "blue" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_css(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm', variant: 'solid' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button {
    display: inline-flex;
  }
  .button--size_sm {
    padding: 8px;
  }
  .button--variant_solid {
    background-color: blue;
  }
}
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button {
    display: inline-flex;
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button--size_sm {
    padding: 8px;
  }
  .button--size_sm:hover {
    padding: 8px;
  }
  @media (width >= 48rem) {
    .button--size_sm {
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
@layer recipes {
  .checkbox__control {
    display: inline-flex;
  }
  .checkbox__root {
    display: flex;
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
