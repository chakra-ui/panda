//! Inline `keyframes({...})` emits a tree-shaken `@keyframes` block in the
//! tokens layer, merged with `theme.keyframes`, driven end-to-end through a
//! project (extract → snapshot → compile).

use crate::common::{compile_layer_css, config};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;
use serde_json::json;

fn cfg() -> pandacss_config::UserConfig {
    config(json!({
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
    }))
}

#[test]
fn emits_inline_keyframes_referenced_by_animation_name() {
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        export const cls = css({ animationName: fade })
    "};

    assert_snapshot!(
        compile_layer_css(&cfg(), source, &[StylesheetLayer::Tokens]),
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
fn emits_both_keyframes_from_a_composed_multi_animation_name() {
    // Two inline keyframes composed into one comma-separated `animationName`,
    // the same shape as a `positionTryFallbacks` list. Both fold and both blocks
    // emit, even under unused-keyframe pruning.
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const scale = keyframes({ from: { transform: 'scale(1)' }, to: { transform: 'scale(1.2)' } })
        const spin = keyframes({ to: { transform: 'rotate(360deg)' } })
        export const cls = css({ animationName: `${scale}, ${spin}` })
    "};

    assert_snapshot!(
        compile_layer_css(&pruning_cfg(), source, &[StylesheetLayer::Tokens]),
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

    // The atomic `animation-name` declaration emits with both folded names.
    assert_snapshot!(
        compile_layer_css(&pruning_cfg(), source, &[StylesheetLayer::Utilities]),
        @r"
    @layer utilities {
      .animation-name_kf_jkSwUM\,_kf_fcamfv {
        animation-name: kf_jkSwUM, kf_fcamfv;
      }
    }
    "
    );
}

fn pruning_cfg() -> pandacss_config::UserConfig {
    config(json!({
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
    }))
}

#[test]
fn tree_shakes_an_unreferenced_inline_keyframe() {
    // The name is never placed in `animationName`, so with removeUnusedKeyframes
    // it is dropped — same as an unused `theme.keyframes` entry.
    let source = indoc! {"
        import { keyframes } from '@panda/css'
        export const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
    "};

    assert_snapshot!(
        compile_layer_css(&pruning_cfg(), source, &[StylesheetLayer::Tokens]),
        @""
    );
}

#[test]
fn keeps_a_referenced_inline_keyframe_under_pruning() {
    let source = indoc! {"
        import { css, keyframes } from '@panda/css'
        const fade = keyframes({ from: { opacity: 0 } })
        export const cls = css({ animationName: fade })
    "};

    assert_snapshot!(
        compile_layer_css(&pruning_cfg(), source, &[StylesheetLayer::Tokens]),
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
