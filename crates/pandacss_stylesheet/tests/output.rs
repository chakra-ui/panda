//! Thin E2E parse → CSS corpus (legacy output.test.ts subset, no pattern callbacks).

use crate::common::{compile_css, compile_layer_css, config};
use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;

#[test]
fn output_css_with_base() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "breakpoints": { "md": "48rem" }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(
        &cfg,
        indoc::indoc! {r"
            import { css } from '@panda/css';
            css({
              base: { color: 'blue' },
              md: { color: 'red' },
            });
        "},
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .c_blue {
        color: blue;
      }
      @media (width >= 48rem) {
        .md\:c_red {
          color: red;
        }
      }
    }
    ");
}

#[test]
fn output_basic_css_usage() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "blue": { "100": { "value": "#dbeafe" } }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let css = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ color: 'blue.100' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .c_blue\.100 {
        color: var(--colors-blue-100);
      }
    }
    ");
}

#[test]
fn output_config_recipe() {
    let cfg = config(serde_json::json!({
        "importMap": {
            "css": ["@panda/css"],
            "recipe": ["@panda/recipes"],
            "pattern": [],
            "jsx": [],
            "tokens": []
        },
        "theme": {
            "tokens": {
                "colors": {
                    "blue": { "500": { "value": "#3b82f6" } },
                    "red": { "500": { "value": "#ef4444" } },
                    "white": { "value": "#fff" }
                }
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "fontSize": "lg" },
                    "variants": {
                        "size": {
                            "sm": { "padding": "2" },
                            "md": { "padding": "4" }
                        },
                        "variant": {
                            "primary": { "color": "white", "backgroundColor": "blue.500" },
                            "danger": { "color": "white", "backgroundColor": "red.500" }
                        }
                    },
                    "compoundVariants": [
                        { "variant": "danger", "size": "md", "css": { "zIndex": 100 } }
                    ]
                }
            }
        },
        "utilities": {
            "zIndex": { "className": "z" }
        }
    }));
    let css = compile_css(
        &cfg,
        "import { button } from '@panda/recipes'; button({ variant: 'danger', size: 'md' })",
    );
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    @layer tokens {
      :where(:root, :host) {
        --colors-blue-500: #3b82f6;
        --colors-red-500: #ef4444;
        --colors-white: #fff;
      }
    }
    @layer recipes {
      @layer base {
        .button {
          font-size: lg;
        }
      }
      .button--size_md {
        padding: 4;
      }
      .button--variant_danger {
        background-color: red.500;
        color: white;
      }
    }
    @layer utilities {
      .z_100 {
        z-index: 100;
      }
    }
    ");
}

#[test]
fn output_jsx_with_recipe_props() {
    let cfg = config(serde_json::json!({
        "importMap": {
            "css": ["@panda/css"],
            "recipe": ["@panda/recipes"],
            "pattern": [],
            "jsx": ["@panda/jsx"],
            "tokens": []
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "500": { "value": "#ef4444" } }
                },
                "spacing": {
                    "2": { "value": "0.5rem" },
                    "4": { "value": "1rem" }
                }
            },
            "recipes": {
                "badge": {
                    "jsx": ["Badge"],
                    "variants": {
                        "size": {
                            "sm": { "padding": "2" }
                        }
                    }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "padding": { "className": "p", "values": "spacing" }
        }
    }));
    let css = compile_layer_css(
        &cfg,
        concat!(
            "import { css } from '@panda/css';\n",
            "import { Badge } from '@panda/jsx';\n",
            "import { badge } from '@panda/recipes';\n",
            "badge({ size: 'sm' });\n",
            "css({ color: 'red.500' });\n",
            "const el = <Badge size=\"sm\" color=\"red.500\" />;\n",
        ),
        &[StylesheetLayer::Recipes, StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @"");
}

#[test]
fn output_custom_import_map() {
    let cfg = config(serde_json::json!({
        "importMap": {
            "css": ["controlled-import-map/css"],
            "recipe": ["controlled-import-map/common"],
            "pattern": ["controlled-import-map/common"],
            "jsx": ["controlled-import-map"],
            "tokens": []
        },
        "theme": {
            "tokens": {
                "colors": { "red": { "500": { "value": "#ef4444" } } },
                "spacing": { "3": { "value": "0.75rem" } }
            },
            "recipes": {
                "buttonStyle": {
                    "base": { "display": "inline-flex" }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "marginInline": { "className": "mx", "shorthand": "mx", "values": "spacing" }
        }
    }));
    let css = compile_layer_css(
        &cfg,
        indoc::indoc! {r"
            import { css } from 'controlled-import-map/css';
            css({ mx: '3', color: 'red.500' });
        "},
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .mx_3 {
        margin-inline: var(--spacing-3);
      }
      .c_red\.500 {
        color: var(--colors-red-500);
      }
    }
    ");
}

#[test]
fn output_runtime_conditions() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "blue": { "100": { "value": "#dbeafe" } },
                    "red": { "100": { "value": "#fee2e2" } }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let css = compile_layer_css(
        &cfg,
        indoc::indoc! {r"
            import { css } from '@panda/css';
            const isHovered = false;
            css({ color: isHovered ? 'blue.100' : 'red.100' });
        "},
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .c_red\.100 {
        color: var(--colors-red-100);
      }
    }
    ");
}

#[test]
fn output_array_syntax() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "spacing": { "0": { "value": "0px" } }
            }
        },
        "utilities": {
            "paddingLeft": { "className": "pl", "values": "spacing" }
        }
    }));
    let css = compile_layer_css(
        &cfg,
        "import { css } from '@panda/css'; css({ paddingLeft: [0] })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @"
    @layer utilities {
      .pl_0 {
        padding-left: var(--spacing-0);
      }
    }
    ");
}
