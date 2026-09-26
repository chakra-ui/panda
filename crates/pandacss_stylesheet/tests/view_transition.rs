use crate::common::{compile_layer_css, compile_output, config, empty_input};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_stylesheet::{
    StylesheetInput, StylesheetLayer, StylesheetOptions, ViewTransitionStyle,
};
use serde_json::json;

fn utilities_css(cfg: &UserConfig, style: ViewTransitionStyle) -> String {
    pandacss_stylesheet::compile(
        StylesheetInput {
            view_transitions: &[style],
            ..empty_input(cfg)
        },
        &StylesheetOptions {
            emit_layer_declaration: true,
            ..StylesheetOptions::default()
        },
    )
    .get_layer_css(&[StylesheetLayer::Utilities])
}

#[test]
fn a_view_transition_emits_a_class_and_one_pseudo_rule_per_phase() {
    let cfg = config(json!({}));
    let options = json!({
        "group": {
            "animationDuration": "0.4s",
            "animationTimingFunction": "ease-in-out",
        },
        "old": { "animationName": "slideOutLeft" },
        "new": { "animationName": "slideInRight" },
    });
    let style = ViewTransitionStyle::from_options(&options, "");

    assert_snapshot!(utilities_css(&cfg, style), @r"
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
fn image_pair_styles_target_the_image_pair_pseudo() {
    let cfg = config(json!({}));
    let style = ViewTransitionStyle::from_options(
        &json!({
            "imagePair": { "isolation": "isolate" },
            "old": { "animationName": "fade" },
        }),
        "",
    );

    assert_snapshot!(utilities_css(&cfg, style), @r"
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
fn a_view_transition_call_in_source_emits_its_class_and_pseudos() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
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
fn keyframe_pruning_keeps_keyframes_a_view_transition_uses() {
    let cfg = config(json!({
        "optimize": { "removeUnusedKeyframes": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
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
fn prefix_applies_to_the_view_transition_class() {
    let cfg = config(json!({
        "prefix": "p",
    }));
    let style =
        ViewTransitionStyle::from_options(&json!({ "old": { "animationName": "fade" } }), "p");

    assert_snapshot!(utilities_css(&cfg, style), @r"
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

#[test]
fn a_theme_view_transition_emits_when_used_by_name() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "viewTransitions": {
                "slide": {
                    "group": { "animationDuration": "0.4s" },
                    "old": { "opacity": 0 },
                    "new": { "opacity": 1 },
                },
                "fade": {
                    "old": { "opacity": 1 },
                    "new": { "opacity": 0 },
                },
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition('slide')
    "};
    assert_snapshot!(
        compile_output(&cfg, source, StylesheetOptions::default())
            .get_layer_css(&[StylesheetLayer::Utilities]),
        @r"
    @layer utilities {
      .vt_slide {
        view-transition-class: vt_slide;
      }
      ::view-transition-group(.vt_slide) {
        animation-duration: 0.4s;
      }
      ::view-transition-old(.vt_slide) {
        opacity: 0;
      }
      ::view-transition-new(.vt_slide) {
        opacity: 1;
      }
    }
    "
    );
}

#[test]
fn an_unused_theme_view_transition_emits_nothing() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "viewTransitions": {
                "slide": { "old": { "opacity": 0 } },
                "fade": { "old": { "opacity": 1 } },
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition('slide')
    "};
    let css = compile_output(&cfg, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Utilities]);
    assert!(css.contains("vt_slide"));
    assert!(!css.contains("vt_fade"));
}

#[test]
fn keyframe_pruning_keeps_keyframes_a_theme_view_transition_uses() {
    let cfg = config(json!({
        "optimize": { "removeUnusedKeyframes": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "keyframes": {
                "slideOutLeft": {
                    "to": { "transform": "translateX(-100%)" }
                },
                "unused": {
                    "to": { "opacity": "0" }
                }
            },
            "viewTransitions": {
                "slide": {
                    "old": { "animationName": "slideOutLeft" },
                }
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition('slide')
    "};
    let css = compile_output(&cfg, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);
    assert!(css.contains("@keyframes slideOutLeft"));
    assert!(!css.contains("@keyframes unused"));
    assert!(css.contains("vt_slide"));
}

#[test]
fn prefix_applies_to_a_theme_view_transition() {
    let cfg = config(json!({
        "prefix": "p",
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "viewTransitions": {
                "slide": { "old": { "opacity": 0 } }
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition('slide')
    "};
    let css = compile_output(&cfg, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Utilities]);
    assert!(css.contains(".p-vt_slide"));
    assert!(css.contains("view-transition-class: p-vt_slide"));
    assert!(css.contains("::view-transition-old(.p-vt_slide)"));
    assert!(!css.contains(".vt_slide {"));
}

#[test]
fn a_theme_view_transition_named_through_a_const_still_emits() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "viewTransitions": {
                "slide": { "old": { "opacity": 0 } }
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        const name = 'slide'
        export const slide = viewTransition(name)
    "};
    let css = compile_output(&cfg, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Utilities]);
    assert!(css.contains(".vt_slide"));
}

#[test]
fn a_theme_view_transition_named_by_an_unknown_variable_emits_nothing() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "viewTransitions": {
                "slide": { "old": { "opacity": 0 } }
            }
        }
    }));
    let source = indoc! {"
        import { viewTransition } from '@panda/css'
        export const slide = viewTransition(name)
    "};
    let css = compile_output(&cfg, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Utilities]);
    assert!(!css.contains("vt_slide"));
}
