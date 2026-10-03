use crate::common::{compile_layer_css, config};
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
fn text_style_parent_key_uses_its_nested_default() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "textStyles": {
                "body": {
                    "DEFAULT": { "value": { "fontSize": "16px", "lineHeight": "1.6" } },
                    "compact": { "value": { "fontSize": "14px", "lineHeight": "1.5" } }
                }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'body' });\ncss({ textStyle: 'body.compact' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_body {
          font-size: 16px;
          line-height: 1.6;
        }
        .textStyle_body\.compact {
          font-size: 14px;
          line-height: 1.5;
        }
      }
    }
    ");
}

#[test]
fn top_level_default_text_style_keeps_its_name() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "textStyles": { "DEFAULT": { "value": { "fontSize": "15px" } } } }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'DEFAULT' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_DEFAULT {
          font-size: 15px;
        }
      }
    }
    ");
}

#[test]
fn deeply_nested_text_style_default_is_reached_through_its_parent() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "textStyles": { "heading": { "h1": { "DEFAULT": { "value": { "fontSize": "32px", "fontWeight": "bold" } }, "light": { "value": { "fontSize": "32px", "fontWeight": "light" } } } } } }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'heading.h1' });\ncss({ textStyle: 'heading.h1.light' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_heading\.h1 {
          font-size: 32px;
          font-weight: bold;
        }
        .textStyle_heading\.h1\.light {
          font-size: 32px;
          font-weight: light;
        }
      }
    }
    ");
}

#[test]
fn default_in_the_middle_of_a_text_style_path_is_skipped() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "textStyles": { "mid": { "DEFAULT": { "inner": { "value": { "letterSpacing": "1px" } } } } } }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'mid.inner' });\ncss({ textStyle: 'mid.DEFAULT.inner' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_mid\.inner {
          letter-spacing: 1px;
        }
      }
    }
    ");
}

#[test]
fn explicit_default_text_style_path_is_not_a_name() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "textStyles": { "body": { "DEFAULT": { "value": { "fontSize": "16px" } } } } }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'body.DEFAULT' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    
    ");
}

#[test]
fn layer_style_parent_key_uses_its_nested_default() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "layerStyles": { "card": { "DEFAULT": { "value": { "background": "white", "borderRadius": "4px" } }, "muted": { "value": { "background": "gray" } } } } }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ layerStyle: 'card' });\ncss({ layerStyle: 'card.muted' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .layerStyle_card {
          background: white;
          border-radius: 4px;
        }
        .layerStyle_card\.muted {
          background: gray;
        }
      }
    }
    ");
}

#[test]
fn animation_style_parent_key_uses_its_nested_default() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "animationStyles": { "fade": { "DEFAULT": { "value": { "animationName": "fade", "animationDuration": "1s" } }, "slow": { "value": { "animationName": "fade", "animationDuration": "3s" } } } } }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ animationStyle: 'fade' });\ncss({ animationStyle: 'fade.slow' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .animationStyle_fade {
          animation-duration: 1s;
          animation-name: fade;
        }
        .animationStyle_fade\.slow {
          animation-duration: 3s;
          animation-name: fade;
        }
      }
    }
    ");
}

#[test]
fn responsive_nested_default_text_style_emits_media_query() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "breakpoints": { "md": "768px" },
            "textStyles": {
                "body": {
                    "DEFAULT": { "value": { "fontSize": { "base": "14px", "md": "18px" } } }
                }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'body' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_body {
          font-size: 14px;
        }
        @media (width >= 48rem) {
          .textStyle_body {
            font-size: 18px;
          }
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
          animation-duration: 300ms;
          animation-name: fadeIn;
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
fn composition_styles_resolve_token_categories_and_nested_conditions() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:is(:hover, [data-hover])"
        },
        "utilities": {
            "animationDuration": { "className": "anim-dur", "values": "durations" },
            "backgroundColor": { "className": "bg", "values": "colors" },
            "color": { "className": "c", "values": "colors" },
            "fontSize": { "className": "fs", "values": "fontSizes" },
            "gap": { "className": "gap", "values": "spacing" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "tokens": {
                "colors": {
                    "brand": {
                        "500": { "value": "#0f766e" }
                    }
                },
                "durations": {
                    "slow": { "value": "300ms" }
                },
                "fontSizes": {
                    "lg": { "value": "1.125rem" }
                },
                "spacing": {
                    "2": { "value": "0.5rem" }
                }
            },
            "textStyles": {
                "heading": {
                    "value": {
                        "fontSize": "lg",
                        "color": "brand.500",
                        "_hover": { "color": "brand.500" },
                        "md": { "gap": "2" }
                    }
                }
            },
            "layerStyles": {
                "panel": {
                    "value": {
                        "backgroundColor": "brand.500",
                        "_hover": { "backgroundColor": "brand.500" }
                    }
                }
            },
            "animationStyles": {
                "enter": {
                    "value": {
                        "animationDuration": "slow",
                        "_hover": { "animationDuration": "slow" }
                    }
                }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css';\ncss({ textStyle: 'heading' });\ncss({ layerStyle: 'panel' });\ncss({ animationStyle: 'enter' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @"
    @layer utilities {
      @layer compositions {
        .animationStyle_enter, .animationStyle_enter:is(:hover, [data-hover]) {
          animation-duration: var(--durations-slow);
        }
        .layerStyle_panel, .layerStyle_panel:is(:hover, [data-hover]) {
          background-color: var(--colors-brand-500);
        }
        .textStyle_heading {
          color: var(--colors-brand-500);
          font-size: var(--font-sizes-lg);
        }
        .textStyle_heading:is(:hover, [data-hover]) {
          color: var(--colors-brand-500);
        }
        @media (width >= 48rem) {
          .textStyle_heading {
            gap: var(--spacing-2);
          }
        }
      }
    }
    ");
}

#[test]
fn composition_media_queries_sort_inside_compositions_layer() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "breakpoints": {
                "lg": "64rem",
                "md": "48rem"
            },
            "textStyles": {
                "display": {
                    "value": {
                        "lg": { "fontSize": "3rem" },
                        "md": { "fontSize": "2rem" }
                    }
                }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ textStyle: 'display' });",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      @layer compositions {
        @media (width >= 48rem) {
          .textStyle_display {
            font-size: 2rem;
          }
        }
        @media (width >= 64rem) {
          .textStyle_display {
            font-size: 3rem;
          }
        }
      }
    }
    ");
}

#[test]
fn unknown_composition_value_does_not_emit_fallback_declaration() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "textStyles": {
                "body": { "value": { "fontSize": "md" } }
            }
        }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ textStyle: 'missing' });",
        &[StylesheetLayer::Utilities],
    );

    assert!(!utilities.contains("text-style"));
    assert!(!utilities.contains(".textStyle_missing"));
    assert_snapshot!(utilities, @"");
}

#[test]
fn unknown_composition_with_no_theme_styles_emits_nothing() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] }
    }));
    let utilities = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ textStyle: 'lg' });",
        &[StylesheetLayer::Utilities],
    );

    assert_snapshot!(utilities, @"");
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
