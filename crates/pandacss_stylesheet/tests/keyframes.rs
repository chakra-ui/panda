mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetOptions;

use common::{compile_css, compile_css_with_options, config};

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
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;");
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
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
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
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;@layer tokens{@keyframes spin{to{transform:rotate(360deg);}}}");
}
