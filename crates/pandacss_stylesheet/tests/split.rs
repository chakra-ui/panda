mod common;

use insta::assert_snapshot;

use common::{config, split_output};

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
    );
    assert_snapshot!(render(&files), @"
    === styles.css ===
    @layer reset, base, tokens, recipes, utilities;
    @import './styles/tokens.css';
    @import './styles/utilities.css';
    @import './styles/recipes.css';

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
      .button--size_sm {
        padding: 8px;
      }
    }

    === styles/recipes.css ===
    @import './recipes/button.css';
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
    let files = split_output(&config, "");

    assert!(
        files
            .iter()
            .any(|file| file.path == "styles/themes/primary-theme.css")
    );
}
