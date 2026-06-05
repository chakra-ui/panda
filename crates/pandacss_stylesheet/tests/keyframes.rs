use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetOptions;

use crate::common::{compile_css, compile_css_with_options, config};

#[test]
fn emits_single_keyframe_block_in_tokens_layer() {
    let config = config(serde_json::json!({
        "theme": {
            "keyframes": {
                "spin": {
                    "from": { "transform": "rotate(0deg)" },
                    "to":   { "transform": "rotate(360deg)" }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
    ");
}

#[test]
fn emits_multiple_keyframes_with_percentage_selectors() {
    let config = config(serde_json::json!({
        "theme": {
            "keyframes": {
                "pulse": {
                    "0%":   { "opacity": "1" },
                    "50%":  { "opacity": "0.5" },
                    "100%": { "opacity": "1" }
                },
                "fadeIn": {
                    "0%":   { "opacity": "0" },
                    "100%": { "opacity": "1" }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }
      @keyframes fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
    }
    ");
}

#[test]
fn optimize_keyframes_keeps_only_referenced_blocks() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedKeyframes": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "keyframes": {
                "spin": {
                    "to": { "transform": "rotate(360deg)" }
                },
                "fade": {
                    "to": { "opacity": "0" }
                }
            }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ animationName: 'spin' });",
    );

    assert!(css.contains("@keyframes spin"));
    assert!(!css.contains("@keyframes fade"));
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    }
    @layer utilities {
      .animation-name_spin {
        animation-name: spin;
      }
    }
    ");
}

#[test]
fn optimize_keyframes_keeps_static_css_references() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedKeyframes": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "css": [
                {
                    "properties": {
                        "animationName": ["spin"]
                    }
                }
            ]
        },
        "theme": {
            "keyframes": {
                "spin": {
                    "to": { "transform": "rotate(360deg)" }
                },
                "fade": {
                    "to": { "opacity": "0" }
                }
            }
        },
        "utilities": {
            "animationName": { "className": "animationName" }
        }
    }));
    let css = compile_css(&config, "");

    assert!(css.contains("@keyframes spin"));
    assert!(!css.contains("@keyframes fade"));
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    }
    @layer utilities {
      .animationName_spin {
        animation-name: spin;
      }
    }
    ");
}

#[test]
fn emits_keyframes_alongside_token_vars_in_same_layer() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "colors": { "red": { "value": "#f00" } }
            },
            "keyframes": {
                "spin": {
                    "to": { "transform": "rotate(360deg)" }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    }
    ");
}

#[test]
fn skips_tokens_layer_when_keyframes_object_is_empty() {
    let config = config(serde_json::json!({
        "theme": {
            "keyframes": {}
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    ");
}

#[test]
fn keyframe_with_multiple_declarations_per_selector() {
    let config = config(serde_json::json!({
        "theme": {
            "keyframes": {
                "slideIn": {
                    "from": {
                        "transform": "translateX(-100%)",
                        "opacity": "0"
                    },
                    "to": {
                        "transform": "translateX(0)",
                        "opacity": "1"
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      @keyframes slideIn {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    }
    ");
}

#[test]
fn minified_output_preserves_keyframe_blocks() {
    let config = config(serde_json::json!({
        "theme": {
            "keyframes": {
                "spin": {
                    "to": { "transform": "rotate(360deg)" }
                }
            }
        }
    }));
    let css = compile_css_with_options(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    );
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;@layer base{:root{--made-with-panda:'🐼';}}@layer tokens{@keyframes spin{to{transform:rotate(360deg);}}}");
}
