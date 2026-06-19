use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_output, config};

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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
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
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ animationName: 'spin' });",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("@keyframes spin"));
    assert!(!css.contains("@keyframes fade"));
    assert_snapshot!(css, @"
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("@keyframes spin"));
    assert!(!css.contains("@keyframes fade"));
    assert_snapshot!(css, @"
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
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
    let output = compile_output(&config, "", StylesheetOptions::default());
    assert!(output.layer_css(StylesheetLayer::Tokens).is_none());
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
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
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    )
    .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"@layer tokens{@keyframes spin{to{transform:rotate(360deg);}}}");
}

#[test]
fn keyframe_steps_expand_configured_utilities() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "spacing": {
                    "4": { "value": "1rem" }
                }
            },
            "keyframes": {
                "slide": {
                    "from": {
                        "opacity": "0",
                        "paddingLeft": "4"
                    },
                    "to": {
                        "opacity": "1",
                        "paddingLeft": "0"
                    }
                }
            }
        },
        "utilities": {
            "opacity": {
                "className": "opacity",
                "values": {
                    "0": "0",
                    "1": "1"
                }
            },
            "paddingLeft": {
                "className": "pl",
                "values": "spacing"
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --spacing-4: 1rem;
      }
      @keyframes slide {
        from {
          opacity: 0;
          padding-left: var(--spacing-4);
        }
        to {
          opacity: 1;
          padding-left: 0;
        }
      }
    }
    ");
}
