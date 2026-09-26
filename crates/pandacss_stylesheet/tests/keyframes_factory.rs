//! Inline `keyframes({...})` emits a tree-shaken `@keyframes` block in the
//! tokens layer, merged with `theme.keyframes`, driven end-to-end through a
//! project (extract → snapshot → compile).

use crate::common::{compile_layer_css, config};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;
use serde_json::json;

#[test]
fn emits_inline_keyframes_referenced_by_animation_name() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
    }));
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        export const cls = css({ animationName: fade })
    "};

    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Tokens]),
        @"
    @layer tokens {
      @keyframes kf_feVUdh {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    }
    "
    );
}

#[test]
fn two_inline_keyframes_in_one_animation_name_both_survive_pruning() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "optimize": { "removeUnusedKeyframes": true },
    }));
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const scale = keyframes({ from: { transform: 'scale(1)' }, to: { transform: 'scale(1.2)' } })
        const spin = keyframes({ to: { transform: 'rotate(360deg)' } })
        export const cls = css({ animationName: `${scale}, ${spin}` })
    "};

    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Tokens]),
        @"
    @layer tokens {
      @keyframes kf_fcamfv {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes kf_jkSwUM {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(1.2);
        }
      }
    }
    "
    );

    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Utilities]),
        @r"
    @layer utilities {
      .animation-name_kf_jkSwUM\,_kf_fcamfv {
        animation-name: kf_jkSwUM, kf_fcamfv;
      }
    }
    "
    );
}

#[test]
fn pruning_drops_an_inline_keyframe_no_animation_name_uses() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "optimize": { "removeUnusedKeyframes": true },
    }));
    let source = indoc! {"
        import { keyframes } from '@panda/css'
        export const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
    "};

    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Tokens]),
        @""
    );
}

#[test]
fn keeps_a_referenced_inline_keyframe_under_pruning() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "optimize": { "removeUnusedKeyframes": true },
    }));
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const fade = keyframes({ from: { opacity: 0 } })
        export const cls = css({ animationName: fade })
    "};

    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Tokens]),
        @"
    @layer tokens {
      @keyframes kf_gdwKNo {
        from {
          opacity: 0;
        }
      }
    }
    "
    );
}

#[test]
fn merges_inline_keyframes_with_theme_keyframes() {
    let cfg = config(json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "keyframes": {
                "spin": { "to": { "transform": "rotate(360deg)" } }
            }
        },
    }));
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const fade = keyframes({ from: { opacity: 0 } })
        export const a = css({ animationName: 'spin' })
        export const b = css({ animationName: fade })
    "};

    assert_snapshot!(
        compile_layer_css(&cfg, source, &[StylesheetLayer::Tokens]),
        @"
    @layer tokens {
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes kf_gdwKNo {
        from {
          opacity: 0;
        }
      }
    }
    "
    );
}
