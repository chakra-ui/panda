use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_stylesheet::StylesheetLayer;

use crate::common::{compile_layer_css, config};

#[test]
fn styled_default_props_extract_styles_and_recipe_variants() {
    let config = frame_config();

    let source = indoc::indoc! {r"
        import { styled } from '@panda/jsx';
        import { frame } from '@panda/recipes';
        import { ArkFrame } from '@ark-ui/react';

        const srcDoc = '<html><head><style>body { margin: 0; }</style></head><body><div /></body></html>';

        const StyledFrame = styled(ArkFrame, frame, {
          defaultProps: {
            srcDoc,
            size: 'sm',
            color: 'red',
          },
          forwardProps: ['srcDoc'],
        });
    "};

    let css = compile_layer_css(
        &config,
        source,
        &[StylesheetLayer::Recipes, StylesheetLayer::Utilities],
    );

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .frame {
          display: block;
        }
      }
      @layer variants {
        .frame--size_sm {
          padding: 2px;
        }
      }
    }
    @layer utilities {
      .color_red {
        color: red;
      }
    }
    ");
}

fn frame_config() -> UserConfig {
    config(serde_json::json!({
        "jsxFramework": "react",
        "importMap": {
            "jsx": ["@panda/jsx"],
            "recipe": ["@panda/recipes"]
        },
        "theme": {
            "recipes": {
                "frame": {
                    "base": { "display": "block" },
                    "variants": {
                        "size": {
                            "sm": { "padding": "2px" },
                            "md": { "padding": "8px" }
                        }
                    },
                    "defaultVariants": { "size": "md" }
                }
            }
        }
    }))
}

#[test]
fn member_factory_preserves_styles_and_filters_default_props() {
    let config = frame_config();

    let source = indoc::indoc! {r"
        import { styled } from '@panda/jsx';
        const srcDoc = '<body><div>Preview</div></body>';

        const StyledFrame = styled.iframe({ color: 'red' }, {
          defaultProps: {
            srcDoc,
            marginTop: '8px',
          },
          forwardProps: ['srcDoc'],
        });
    "};

    let css = compile_layer_css(&config, source, &[StylesheetLayer::Utilities]);

    assert_snapshot!(css, @r"
    @layer utilities {
      .color_red {
        color: red;
      }
      .margin-top_8px {
        margin-top: 8px;
      }
    }
    ");
}

#[test]
fn member_factory_recipe_defaults_select_variants() {
    let config = frame_config();

    let source = indoc::indoc! {r"
        import { styled } from '@panda/jsx';
        import { frame } from '@panda/recipes';

        const StyledFrame = styled.iframe(frame, {
          defaultProps: {
            size: 'sm',
            color: 'red',
            srcDoc: '<body><div>Preview</div></body>',
          },
          forwardProps: ['srcDoc'],
        });
    "};

    let css = compile_layer_css(
        &config,
        source,
        &[StylesheetLayer::Recipes, StylesheetLayer::Utilities],
    );

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .frame {
          display: block;
        }
      }
      @layer variants {
        .frame--size_sm {
          padding: 2px;
        }
      }
    }
    @layer utilities {
      .color_red {
        color: red;
      }
    }
    ");
}

#[test]
fn conditional_recipe_defaults_emit_styles_and_variants_from_both_branches() {
    let config = frame_config();

    let source = indoc::indoc! {r"
        import { styled } from '@panda/jsx';
        import { frame } from '@panda/recipes';

        const StyledFrame = styled('iframe', frame, {
          defaultProps: enabled
            ? { size: 'sm', color: 'red', srcDoc: '<body>Small</body>' }
            : { size: 'md', color: 'blue', srcDoc: '<body>Medium</body>' },
          forwardProps: ['srcDoc'],
        });
    "};

    let css = compile_layer_css(
        &config,
        source,
        &[StylesheetLayer::Recipes, StylesheetLayer::Utilities],
    );

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .frame {
          display: block;
        }
      }
      @layer variants {
        .frame--size_md {
          padding: 8px;
        }
        .frame--size_sm {
          padding: 2px;
        }
      }
    }
    @layer utilities {
      .color_blue {
        color: blue;
      }
      .color_red {
        color: red;
      }
    }
    ");
}

#[test]
fn jsx_spreads_emit_custom_properties_selectors_and_at_rules() {
    let config = frame_config();

    let source = indoc::indoc! {r"
        import { styled } from '@panda/jsx';

        const styles = {
          '--frame-color': 'red',
          '&:hover': { color: 'red' },
          '@media (min-width: 40rem)': { marginTop: '8px' },
        };

        const Frame = <styled.iframe {...styles} />;
    "};

    let css = crate::common::compile_tsx_layer_css(&config, source, &[StylesheetLayer::Utilities]);

    assert_snapshot!(css, @r"
    @layer utilities {
      .\--frame-color_red {
        --frame-color: red;
      }
      .\[\&\:hover\]\:color_red:hover {
        color: red;
      }
      @media (min-width: 40rem) {
        .\[\@media_\(min-width\:_40rem\)\]\:margin-top_8px {
          margin-top: 8px;
        }
      }
    }
    ");
}
