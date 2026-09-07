use crate::common::config;
use insta::assert_snapshot;
use pandacss_encoder::EncodedRecipesSnapshot;
use pandacss_stylesheet::{
    PositionTryStyle, StylesheetInput, StylesheetLayer, StylesheetOptions, UtilityStyleOverrides,
};
use serde_json::json;

fn empty_recipes() -> EncodedRecipesSnapshot {
    EncodedRecipesSnapshot {
        base: Vec::new(),
        variants: Vec::new(),
        compounds: Vec::new(),
        atomic: Vec::new(),
    }
}

fn emit_base(styles: &[PositionTryStyle]) -> String {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
    }));
    let recipes = empty_recipes();
    let empty_utility_styles = UtilityStyleOverrides::default();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty_utility_styles,
            view_transitions: &[],
            position_try: styles,
            encoded_recipes: &recipes,
            static_encoded_recipes: None,
            static_pattern_atoms: &[],
            token_refs: &[],
        },
        &StylesheetOptions {
            emit_layer_declaration: true,
            ..StylesheetOptions::default()
        },
    );
    output.get_layer_css(&[StylesheetLayer::Base])
}

#[test]
fn emits_a_position_try_block_from_a_hashed_object_bag() {
    let style = PositionTryStyle::from_options(
        &json!({ "top": "anchor(bottom)", "insetInlineStart": "anchor(start)" }),
        "",
    );
    assert_snapshot!(emit_base(&[style]), @"
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
fn emits_a_named_theme_position_try_block_with_prefix() {
    let style =
        PositionTryStyle::from_named_options("bottom", &json!({ "top": "anchor(bottom)" }), "p");
    assert_snapshot!(emit_base(&[style]), @"
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
fn emits_no_position_try_block_for_an_empty_list() {
    assert!(!emit_base(&[]).contains("@position-try"));
}

#[test]
fn polyfill_keeps_position_try_descriptors_plain() {
    // The polyfill applies the `:not(#\#)` specificity hack to selector rules,
    // but `@position-try` descriptors must stay untouched, like @font-face /
    // @property (regression guard for the removed globalPositionTry coverage).
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
    }));
    let style = PositionTryStyle::from_options(
        &json!({ "positionAnchor": "--trigger", "top": "anchor(bottom)" }),
        "",
    );
    let recipes = empty_recipes();
    let empty = UtilityStyleOverrides::default();
    let css = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty,
            view_transitions: &[],
            position_try: &[style],
            encoded_recipes: &recipes,
            static_encoded_recipes: None,
            static_pattern_atoms: &[],
            token_refs: &[],
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
    // The specificity hack applies to selectors (the marker :root), never to
    // descriptors inside the at-rule.
    let block = &css[css.find("@position-try").expect("block")..];
    let block = &block[..block.find('}').expect("close")];
    assert!(!block.contains(":not("));
    assert!(css.contains(":root:not(#\\#)"));
}

/// End-to-end: a `positionTry('name')` call used as a css value folds to its
/// dashed-ident and the `@position-try` block for that theme name still emits.
#[test]
fn position_try_call_value_folds_and_block_emits() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "positionTry": {
                "flip": { "top": "anchor(bottom)" }
            }
        }
    }));

    let css = crate::common::compile_css(
        &cfg,
        indoc::indoc! {r"
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

/// The folded value and the emitted block share the config class-name prefix,
/// so a `prefix: "p"` config yields `--p-pt_flip` on both sides.
#[test]
fn position_try_call_value_uses_config_prefix() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
        "prefix": "p",
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "positionTry": {
                "flip": { "top": "anchor(bottom)" }
            }
        }
    }));

    let css = crate::common::compile_css(
        &cfg,
        indoc::indoc! {r"
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
