mod common;

use common::{compile_layer_css, config};
use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;

#[test]
fn text_style_emits_class_with_resolved_styles_in_compositions_sublayer() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "textStyles": {
                "heading": {
                    "h1": { "value": { "fontSize": "2xl", "lineHeight": "tight" } }
                }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ textStyle: 'heading.h1' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_heading\.h1 {
          font-size: 2xl;
          line-height: tight;
        }
      }
    }
    ");
}

#[test]
fn layer_style_and_animation_style_get_their_own_classes_in_same_sublayer() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "layerStyles": {
                "card": { "value": { "background": "white", "borderRadius": "md" } }
            },
            "animationStyles": {
                "fadeIn": { "value": { "animationName": "fadeIn", "animationDuration": "300ms" } }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ layerStyle: 'card' });\ncss({ animationStyle: 'fadeIn' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .animationStyle_fadeIn {
          animation-name: fadeIn;
          animation-duration: 300ms;
        }
        .layerStyle_card {
          background: white;
          border-radius: md;
        }
      }
    }
    ");
}

#[test]
fn composition_style_with_token_reference_resolves_to_var() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": { "primary": { "value": "#3b82f6" } }
            },
            "textStyles": {
                "body": { "value": { "color": "{colors.primary}" } }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ textStyle: 'body' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_body {
          color: var(--colors-primary);
        }
      }
    }
    ");
}

#[test]
fn unused_compositions_emit_no_css() {
    // Composition values registered but never referenced → no CSS.
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "textStyles": {
                "heading": { "h1": { "value": { "fontSize": "2xl" } } }
            }
        }
    }));
    let utilities = compile_layer_css(&cfg, "", &[StylesheetLayer::Utilities]);
    assert_snapshot!(utilities, @"");
}
