use crate::common::{compile_css, config, empty_input};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_stylesheet::{PositionTryStyle, StylesheetInput, StylesheetLayer, StylesheetOptions};
use serde_json::json;

fn base_css(styles: &[PositionTryStyle]) -> String {
    pandacss_stylesheet::compile(
        StylesheetInput {
            position_try: styles,
            ..empty_input(&config(json!({})))
        },
        &StylesheetOptions {
            emit_layer_declaration: true,
            ..StylesheetOptions::default()
        },
    )
    .get_layer_css(&[StylesheetLayer::Base])
}

#[test]
fn an_inline_position_try_emits_a_hashed_block() {
    let style = PositionTryStyle::from_options(
        &json!({ "top": "anchor(bottom)", "insetInlineStart": "anchor(start)" }),
        "",
    );
    assert_snapshot!(base_css(&[style]), @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @position-try --pt_dAuNmh {
        top: anchor(bottom);
        inset-inline-start: anchor(start);
      }
    }
    ");
}

#[test]
fn a_theme_position_try_block_is_named_after_the_theme_key() {
    let style =
        PositionTryStyle::from_named_options("bottom", &json!({ "top": "anchor(bottom)" }), "p");
    assert_snapshot!(base_css(&[style]), @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @position-try --p-pt_bottom {
        top: anchor(bottom);
      }
    }
    ");
}

#[test]
fn no_position_try_usage_emits_no_block() {
    assert!(!base_css(&[]).contains("@position-try"));
}

#[test]
fn polyfill_keeps_position_try_descriptors_plain() {
    // `:not(#\#)` is a selector hack; descriptors in an at-rule must stay plain.
    let cfg = config(json!({}));
    let style = PositionTryStyle::from_options(
        &json!({ "positionAnchor": "--trigger", "top": "anchor(bottom)" }),
        "",
    );
    let css = pandacss_stylesheet::compile(
        StylesheetInput {
            position_try: &[style],
            ..empty_input(&cfg)
        },
        &StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;

    assert!(css.contains("@position-try --pt_"));
    assert!(css.contains("position-anchor: --trigger;"));
    assert!(css.contains("top: anchor(bottom);"));
    let block = &css[css.find("@position-try").expect("block")..];
    let block = &block[..block.find('}').expect("close")];
    assert!(!block.contains(":not("));
    assert!(css.contains(":root:not(#\\#)"));
}

#[test]
fn a_position_try_call_in_css_emits_the_theme_block() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "positionTry": {
                "flip": { "top": "anchor(bottom)" }
            }
        }
    }));

    let css = compile_css(
        &cfg,
        indoc! {r"
            import { css, positionTry } from '@panda/css'
            css({ positionTryFallbacks: positionTry('flip') })
        "},
    );

    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @position-try --pt_flip {
        top: anchor(bottom);
      }
    }
    @layer utilities {
      .position-try-fallbacks_--pt_flip {
        position-try-fallbacks: --pt_flip;
      }
    }
    ");
}

#[test]
fn the_prefix_applies_to_both_the_value_and_the_block() {
    let cfg = config(json!({
        "prefix": "p",
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "positionTry": {
                "flip": { "top": "anchor(bottom)" }
            }
        }
    }));

    let css = compile_css(
        &cfg,
        indoc! {r"
            import { css, positionTry } from '@panda/css'
            css({ positionTryFallbacks: positionTry('flip') })
        "},
    );

    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @position-try --p-pt_flip {
        top: anchor(bottom);
      }
    }
    @layer utilities {
      .p-position-try-fallbacks_--p-pt_flip {
        position-try-fallbacks: --p-pt_flip;
      }
    }
    ");
}
