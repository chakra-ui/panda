use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetOptions;

use crate::common::{compile_fontface_output, config};

fn inter_config() -> pandacss_config::UserConfig {
    config(serde_json::json!({
        "globalFontface": {
            "Inter": {
                "src": "url('/fonts/inter.woff2') format('woff2')",
                "fontWeight": "400 700",
                "fontDisplay": "swap"
            }
        }
    }))
}

#[test]
fn compile_fontface_wraps_in_base_layer() {
    let css = compile_fontface_output(
        &inter_config(),
        StylesheetOptions {
            emit_layer_declaration: true,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @"
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
fn compile_fontface_bare_without_layer_wrapper() {
    let css = compile_fontface_output(
        &inter_config(),
        StylesheetOptions {
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @"
    @font-face {
      font-family: Inter;
      src: url('/fonts/inter.woff2') format('woff2');
      font-weight: 400 700;
      font-display: swap;
    }
    ");
}

#[test]
fn compile_fontface_empty_when_none_defined() {
    let css = compile_fontface_output(
        &config(serde_json::json!({})),
        StylesheetOptions {
            emit_layer_declaration: true,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_eq!(css, "");
}
