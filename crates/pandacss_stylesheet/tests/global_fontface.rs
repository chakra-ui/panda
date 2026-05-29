mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;

use common::{compile_layer_css, config};

#[test]
fn emits_global_fontface_into_base_layer() {
    let config = config(serde_json::json!({
        "globalFontface": {
            "Inter": {
                "src": "url('/fonts/inter.woff2') format('woff2')",
                "fontWeight": "400 700",
                "fontDisplay": "swap"
            }
        }
    }));
    let base = compile_layer_css(&config, "", &[StylesheetLayer::Base]);
    assert_snapshot!(base, @"
    @layer base {
      @font-face {
        font-family: Inter;
        src: url('/fonts/inter.woff2') format('woff2');
        font-weight: 400 700;
        font-display: swap;
      }
    }
    ");
}

#[test]
fn emits_one_block_per_rule_for_fontface_arrays() {
    let config = config(serde_json::json!({
        "globalFontface": {
            "Inter": [
                { "src": "url('/fonts/inter-400.woff2')", "fontWeight": 400 },
                { "src": "url('/fonts/inter-700.woff2')", "fontWeight": 700 }
            ]
        }
    }));
    let base = compile_layer_css(&config, "", &[StylesheetLayer::Base]);
    assert_snapshot!(base, @"
    @layer base {
      @font-face {
        font-family: Inter;
        src: url('/fonts/inter-400.woff2');
        font-weight: 400;
      }
      @font-face {
        font-family: Inter;
        src: url('/fonts/inter-700.woff2');
        font-weight: 700;
      }
    }
    ");
}

#[test]
fn joins_multi_source_fontface_src_arrays() {
    let config = config(serde_json::json!({
        "globalFontface": {
            "Inter": {
                "src": ["url('/fonts/inter.woff2') format('woff2')", "url('/fonts/inter.woff') format('woff')"]
            }
        }
    }));
    let base = compile_layer_css(&config, "", &[StylesheetLayer::Base]);
    assert_snapshot!(base, @"
    @layer base {
      @font-face {
        font-family: Inter;
        src: url('/fonts/inter.woff2') format('woff2'),url('/fonts/inter.woff') format('woff');
      }
    }
    ");
}

#[test]
fn emits_global_position_try_with_dashed_ident() {
    let config = config(serde_json::json!({
        "globalPositionTry": {
            "flip": {
                "positionAnchor": "--trigger",
                "top": "anchor(bottom)"
            }
        }
    }));
    let base = compile_layer_css(&config, "", &[StylesheetLayer::Base]);
    assert_snapshot!(base, @"
    @layer base {
      @position-try --flip {
        position-anchor: --trigger;
        top: anchor(bottom);
      }
    }
    ");
}

#[test]
fn preserves_existing_double_dash_position_try_name() {
    let config = config(serde_json::json!({
        "globalPositionTry": {
            "--custom": {
                "top": "anchor(bottom)"
            }
        }
    }));
    let base = compile_layer_css(&config, "", &[StylesheetLayer::Base]);
    assert_snapshot!(base, @"
    @layer base {
      @position-try --custom {
        top: anchor(bottom);
      }
    }
    ");
}
