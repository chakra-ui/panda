use insta::{assert_snapshot, assert_yaml_snapshot};

use crate::common::{config, split_output, split_result};
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

/// Render the split file set as `=== path ===\n<code>` blocks for snapshotting.
fn render(files: &[pandacss_stylesheet::SplitCssFile]) -> String {
    files
        .iter()
        .map(|file| format!("=== {} ===\n{}", file.path, file.code))
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn splits_layers_and_recipes_into_files_with_indexes() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": { "colors": { "red": { "value": "#f00" } } },
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "display": "inline-flex" },
                    "variants": { "size": { "sm": { "padding": "8px" } } }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "display": { "className": "d" },
            "padding": { "className": "p" }
        }
    }));
    let files = split_output(
        &config,
        "import { css } from '@panda/css'\nimport { button } from '@panda/recipes'\ncss({ color: 'red' })\nbutton({ size: 'sm' })",
        StylesheetOptions::default(),
    );
    assert_snapshot!(render(&files), @"
    === styles.css ===
    @layer reset, base, tokens,
           recipes,
           utilities;
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    @import './styles/global.css';
    @import './styles/tokens.css';
    @import './styles/utilities.css';
    @import './styles/recipes.css';

    === styles/global.css ===
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }

    === styles/tokens.css ===
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
      }
    }

    === styles/utilities.css ===
    @layer utilities {
      .c_red {
        color: var(--colors-red);
      }
    }

    === styles/recipes/button.css ===
    @layer recipes {
      @layer base {
        .button {
          display: inline-flex;
        }
      }
      @layer variants {
        .button--size_sm {
          padding: 8px;
        }
      }
    }

    === styles/recipes.css ===
    @import './recipes/button.css';
    ");
}

#[test]
fn split_css_declares_recipe_sublayers_before_imports() {
    let config = config(serde_json::json!({
        "importMap": { "css": [], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "recipes": {
                "alpha": {
                    "className": "alpha",
                    "variants": { "tone": { "quiet": { "color": "gray" } } }
                },
                "zeta": {
                    "className": "zeta",
                    "base": { "color": "red" }
                }
            }
        },
        "utilities": { "color": { "className": "c" } }
    }));
    let files = split_output(
        &config,
        "import { alpha, zeta } from '@panda/recipes'; alpha({ tone: 'quiet' }); zeta({});",
        StylesheetOptions::default(),
    );
    let index = files
        .iter()
        .find(|file| file.path == "styles.css")
        .expect("styles.css");

    let base = index.code.find("recipes.base").expect("base preamble");
    let variants = index
        .code
        .find("recipes.variants")
        .expect("variants preamble");
    let imports = index.code.find("@import").expect("imports");
    assert!(base < variants && variants < imports);
}

#[test]
fn split_css_with_layer_filter_skips_unselected_files() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": { "colors": { "red": { "value": "#f00" } } }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let source = "import { css } from '@panda/css'\ncss({ color: 'red' })";
    let files = split_output(
        &config,
        source,
        StylesheetOptions {
            layers: Some(vec![StylesheetLayer::Utilities]),
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );

    assert_snapshot!(render(&files), @"
    === styles.css ===
    @import './styles/utilities.css';

    === styles/utilities.css ===
    @layer utilities {
      .c_red {
        color: var(--colors-red);
      }
    }
    ");
}

#[test]
fn split_css_emits_theme_files() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "colors": {
                    "text": { "value": "blue" }
                }
            }
        },
        "themes": {
            "primaryTheme": {
                "tokens": {
                    "colors": {
                        "text": { "value": "red" }
                    }
                }
            }
        }
    }));
    let files = split_output(&config, "", StylesheetOptions::default());

    assert!(
        files
            .iter()
            .any(|file| file.path == "styles/themes/primary-theme.css")
    );
}

#[test]
fn split_css_sanitizes_and_disambiguates_recipe_paths() {
    let config = config(serde_json::json!({
        "staticCss": { "recipes": "*" },
        "theme": {
            "recipes": {
                "../../../outside": {
                    "className": "unsafe",
                    "base": { "color": "red" }
                },
                "outside": {
                    "className": "safe",
                    "base": { "color": "blue" }
                }
            }
        },
        "utilities": { "color": { "className": "c" } }
    }));
    let files = split_output(&config, "", StylesheetOptions::default());
    let recipe_paths = files
        .iter()
        .filter(|file| {
            file.path.starts_with("styles/recipes/") && file.path != "styles/recipes.css"
        })
        .map(|file| file.path.as_str())
        .collect::<Vec<_>>();

    assert_yaml_snapshot!(recipe_paths, @r"
    - styles/recipes/outside.css
    - styles/recipes/outside-kchoyq.css
    ");
}

#[test]
fn split_css_returns_static_css_diagnostics() {
    let config = config(serde_json::json!({
        "staticCss": {
            "css": [{ "properties": { "colr": "red" } }]
        }
    }));
    let output = split_result(&config, "", StylesheetOptions::default());

    assert_yaml_snapshot!(
        output
            .diagnostics
            .iter()
            .map(|diagnostic| diagnostic.code.as_str())
            .collect::<Vec<_>>(),
        @r"
    - static_css_property_unknown
    "
    );
}
