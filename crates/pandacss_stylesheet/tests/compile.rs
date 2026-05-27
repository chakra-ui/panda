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
    pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            atoms: &project.atoms().iter().cloned().collect::<Vec<_>>(),
            encoded_recipes: &snapshot,
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
