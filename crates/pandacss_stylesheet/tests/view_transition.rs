use crate::common::{compile_layer_css, compile_output, config};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_encoder::EncodedRecipesSnapshot;
use pandacss_stylesheet::{
    StylesheetInput, StylesheetLayer, StylesheetOptions, UtilityStyleOverrides, ViewTransitionStyle,
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

#[test]
fn emits_bag_class_and_functional_pseudos() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
    }));
    let options = json!({
        "group": {
            "animationDuration": "0.4s",
            "animationTimingFunction": "ease-in-out",
        },
        "old": { "animationName": "slideOutLeft" },
        "new": { "animationName": "slideInRight" },
    });
    let style = ViewTransitionStyle::from_options(&options, "");
    let recipes = empty_recipes();
    let empty_utility_styles = UtilityStyleOverrides::default();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty_utility_styles,
            view_transitions: &[style],
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

    assert_snapshot!(output.get_layer_css(&[StylesheetLayer::Utilities]), @r"
    @layer utilities {
      .vt_kcBjZF {
        view-transition-class: vt_kcBjZF;
      }
      ::view-transition-group(.vt_kcBjZF) {
        animation-duration: 0.4s;
        animation-timing-function: ease-in-out;
      }
      ::view-transition-old(.vt_kcBjZF) {
        animation-name: slideOutLeft;
      }
      ::view-transition-new(.vt_kcBjZF) {
        animation-name: slideInRight;
      }
    }
    ");
}

#[test]
fn emits_image_pair_slot() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
    }));
    let style = ViewTransitionStyle::from_options(
        &json!({
            "imagePair": { "isolation": "isolate" },
            "old": { "animationName": "fade" },
        }),
        "",
    );
    let recipes = empty_recipes();
    let empty_utility_styles = UtilityStyleOverrides::default();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty_utility_styles,
            view_transitions: &[style],
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

    assert_snapshot!(output.get_layer_css(&[StylesheetLayer::Utilities]), @r"
    @layer utilities {
      .vt_hAXJbB {
        view-transition-class: vt_hAXJbB;
      }
      ::view-transition-image-pair(.vt_hAXJbB) {
        isolation: isolate;
      }
      ::view-transition-old(.vt_hAXJbB) {
        animation-name: fade;
      }
    }
    ");
}

#[test]
fn extracts_from_source_via_project() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
        "importMap": {
            "css": ["@panda/css"],
            "recipe": [],
            "pattern": [],
            "jsx": [],
            "tokens": []
        },
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition({
          group: {
            animationDuration: '0.4s',
            animationTimingFunction: 'ease-in-out',
          },
          old: { animationName: 'slideOutLeft' },
          new: { animationName: 'slideInRight' },
        })
    "};
    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Utilities]),
        @r"
    @layer utilities {
      .vt_kcBjZF {
        view-transition-class: vt_kcBjZF;
      }
      ::view-transition-group(.vt_kcBjZF) {
        animation-duration: 0.4s;
        animation-timing-function: ease-in-out;
      }
      ::view-transition-old(.vt_kcBjZF) {
        animation-name: slideOutLeft;
      }
      ::view-transition-new(.vt_kcBjZF) {
        animation-name: slideInRight;
      }
    }
    "
    );
}

#[test]
fn optimize_keyframes_keeps_view_transition_references() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
        "optimize": { "removeUnusedKeyframes": true },
        "importMap": {
            "css": ["@panda/css"],
            "recipe": [],
            "pattern": [],
            "jsx": [],
            "tokens": []
        },
        "theme": {
            "keyframes": {
                "slideOutLeft": {
                    "to": { "transform": "translateX(-100%)" }
                },
                "slideInRight": {
                    "from": { "transform": "translateX(100%)" }
                },
                "unused": {
                    "to": { "opacity": "0" }
                }
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition({
          old: { animationName: 'slideOutLeft' },
          new: { animationName: 'slideInRight' },
        })
    "};
    assert_snapshot!(
        compile_output(&cfg, source, StylesheetOptions::default())
            .get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]),
        @r"
    @layer tokens {
      @keyframes slideOutLeft {
        to {
          transform: translateX(-100%);
        }
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
      }
    }
    @layer utilities {
      .vt_ePDfIU {
        view-transition-class: vt_ePDfIU;
      }
      ::view-transition-old(.vt_ePDfIU) {
        animation-name: slideOutLeft;
      }
      ::view-transition-new(.vt_ePDfIU) {
        animation-name: slideInRight;
      }
    }
    "
    );
}

#[test]
fn applies_prefix_to_class_and_property() {
    let cfg = config(json!({
        "outdir": "styled-system",
        "include": [],
        "exclude": [],
        "jsxFramework": "react",
        "preflight": false,
        "prefix": "p",
    }));
    let style =
        ViewTransitionStyle::from_options(&json!({ "old": { "animationName": "fade" } }), "p");
    let recipes = empty_recipes();
    let empty_utility_styles = UtilityStyleOverrides::default();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &cfg,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty_utility_styles,
            view_transitions: &[style],
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

    assert_snapshot!(output.get_layer_css(&[StylesheetLayer::Utilities]), @r"
    @layer utilities {
      .p-vt_iYkyvX {
        view-transition-class: p-vt_iYkyvX;
      }
      ::view-transition-old(.p-vt_iYkyvX) {
        animation-name: fade;
      }
    }
    ");
}
