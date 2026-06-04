mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use common::{compile_css, compile_css_with_options, compile_layer_css, config};

#[test]
fn emits_dynamic_atomic_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .bg_blue {
    background-color: blue;
  }
  .c_red {
    color: red;
  }
}
");
}

#[test]
fn emits_dynamic_atomic_css_with_configured_separator() {
    let config = config(serde_json::json!({
        "separator": "__",
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .bg__blue {
    background-color: blue;
  }
  .c__red {
    color: red;
  }
}
");
}

#[test]
fn hashes_atomic_class_names_with_prefix_conditions_and_important() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "hash": { "className": true },
        "prefix": { "className": "pd" },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "color": { "className": "c" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red !important', _hover: { bg: 'blue' } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .pd-wxtrg\! {
    color: red !important;
  }
  .pd-hsecaD:hover {
    background-color: blue;
  }
}
");
}

#[test]
fn appends_px_to_numeric_values_except_unitless_and_custom_properties() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "width": { "className": "w" },
            "opacity": { "className": "op" },
            "zIndex": { "className": "z" },
            "fontWeight": { "className": "fw" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ '--foo': 42, width: 42, opacity: 1, zIndex: 0, fontWeight: 700 })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .--foo_42 {
    --foo: 42;
  }
  .fw_700 {
    font-weight: 700;
  }
  .op_1 {
    opacity: 1;
  }
  .z_0 {
    z-index: 0;
  }
  .w_42 {
    width: 42px;
  }
}
");
}

#[test]
fn resolves_semantic_token_category_values_to_css_vars() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "blue": {
                        "500": { "value": "#2563eb" }
                    },
                    "brand": {
                        "500": { "value": "#111827" }
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "primary": { "value": "{colors.blue.500}" }
                }
            }
        },
        "utilities": {
            "color": { "className": "color", "values": "colors" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'primary' }); css({ color: 'brand.500' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .color_brand\.500 {
    color: var(--colors-brand-500);
  }
  .color_primary {
    color: var(--colors-primary);
  }
}
");
}

#[test]
fn emits_generated_color_palette_utility() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "300": { "value": "#fca5a5" },
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ colorPalette: 'red', color: 'colorPalette.500' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .c_colorPalette\.500 {
    color: var(--colors-color-palette-500);
  }
  .color-palette_red {
    --colors-color-palette-300: var(--colors-red-300);
    --colors-color-palette-500: var(--colors-red-500);
  }
}
");
}

#[test]
fn resolves_negative_spacing_category_values_to_calc_values() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "spacing": {
                    "4": { "value": "1rem" }
                }
            }
        },
        "utilities": {
            "margin": { "className": "m", "shorthand": "m", "values": "spacing" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ m: '-4' }); css({ m: '4' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .m_-4 {
    margin: calc(var(--spacing-4) * -1);
  }
  .m_4 {
    margin: var(--spacing-4);
  }
}
");
}

#[test]
fn theme_conditions_emit_self_or_descendant_where_selector() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                }
            }
        },
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "red": { "value": "#d00" }
                    }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _themePrimary: { color: 'red' } });",
    );

    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer tokens {
  :where(:root, :host) {
    --colors-red: #f00;
  }
}
@layer utilities {
  .themePrimary\:c_red:where([data-panda-theme=primary], [data-panda-theme=primary] *) {
    color: var(--colors-red);
  }
}
");
}

#[test]
fn resolves_color_opacity_modifiers_to_color_mix() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "300": { "value": "#fca5a5" }
                    }
                },
                "opacity": {
                    "half": { "value": 0.5 }
                }
            }
        },
        "utilities": {
            "background": { "className": "bg", "shorthand": "bg", "values": "colors" },
            "color": { "className": "c", "values": "colors" }
        }
    }));
    let css = compile_layer_css(
        &config,
        concat!(
            "import { css } from '@panda/css';\n",
            "css({ bg: 'red.300/40' });\n",
            "css({ bg: 'red/30' });\n",
            "css({ color: '{colors.red.300/40}' });\n",
            "css({ bg: 'token(colors.red.300/half)' });",
        ),
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .bg_red\.300\/40 {
    background: color-mix(in srgb, var(--colors-red-300) 40%, transparent);
  }
  .bg_red\/30 {
    background: color-mix(in srgb, red 30%, transparent);
  }
  .bg_token\(colors\.red\.300\/half\) {
    background: color-mix(in srgb, var(--colors-red-300) 50%, transparent);
  }
  .c_\{colors\.red\.300\/40\} {
    color: color-mix(in srgb, var(--colors-red-300) 40%, transparent);
  }
}
");
}

#[test]
fn escapes_nested_selector_keys_into_valid_class_names() {
    // `&:hover` is a raw selector, not a named condition: the runtime wraps it as
    // `[&:hover]:…` (so does the emitter), and `[`/`]`/`&`/`:` are escaped in the
    // class-name token while the real `:hover` is appended after it.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'orange', '&:hover': { color: 'red' } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .c_orange {
    color: orange;
  }
  .\[\&\:hover\]\:c_red:hover {
    color: red;
  }
}
");
}

#[test]
fn emits_custom_props_parent_selectors_selector_lists_and_raw_at_rules() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } }
    }));
    let css = compile_layer_css(
        &config,
        concat!(
            "import { css } from '@panda/css';\n",
            "css({\n",
            "  '--welcome-x': '20',\n",
            "  color: 'black',\n",
            "  '&:hover': { color: 'red' },\n",
            "  '.group &': { color: 'blue' },\n",
            "  '&, &:focus': { color: 'purple' },\n",
            "  '@media (hover: hover)': { color: 'green' },\n",
            "})",
        ),
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .--welcome-x_20 {
        --welcome-x: 20;
      }
      .c_black {
        color: black;
      }
      .group .\[\.group_\&\]\:c_blue {
        color: blue;
      }
      .\[\&\:hover\]\:c_red:hover {
        color: red;
      }
      .\[\&\,_\&\:focus\]\:c_purple, .\[\&\,_\&\:focus\]\:c_purple:focus {
        color: purple;
      }
      @media (hover: hover) {
        .\[\@media_\(hover\:_hover\)\]\:c_green {
          color: green;
        }
      }
    }
    ");
}

#[test]
fn resolves_token_references_interpolated_in_longhand_values() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": { "tokens": { "colors": { "red": { "300": { "value": "#f00" } } } } },
        "utilities": { "border": { "className": "border" } }
    }));
    let css = compile_layer_css(
        &config,
        concat!(
            "import { css } from '@panda/css'\n",
            "css({ border: '1px solid {colors.red.300}' })\n",
            "css({ border: '2px solid token(colors.red.300)' })",
        ),
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .border_1px_solid_\{colors\.red\.300\} {
        border: 1px solid var(--colors-red-300);
      }
      .border_2px_solid_token\(colors\.red\.300\) {
        border: 2px solid var(--colors-red-300);
      }
    }
    ");
}

#[test]
fn emits_gradient_utilities_from_value_maps() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "gradients": {
                    "primary": { "value": "linear-gradient(to right, #ff0000, #0000ff)" }
                },
                "colors": {
                    "red": { "200": { "value": "#fecaca" } },
                    "blue": { "300": { "value": "#93c5fd" } }
                }
            }
        },
        "utilities": {
            "backgroundGradient": {
                "shorthand": "bgGradient",
                "className": "bg-grad",
                "values": {
                    "primary": {
                        "backgroundImage": "{gradients.primary}"
                    },
                    "to-r": {
                        "--gradient-stops": "var(--gradient-via-stops, var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position))",
                        "--gradient-position": "to right",
                        "backgroundImage": "linear-gradient(var(--gradient-stops))"
                    },
                    "linear-gradient(var(--colors-red-200), var(--colors-blue-300))": {
                        "backgroundImage": "linear-gradient({colors.red.200}, {colors.blue.300})"
                    }
                }
            },
            "textGradient": {
                "className": "txt-grad",
                "values": {
                    "linear-gradient(var(--colors-red-200), var(--colors-blue-300))": {
                        "backgroundImage": "linear-gradient({colors.red.200}, {colors.blue.300})",
                        "-webkitBackgroundClip": "text",
                        "color": "transparent"
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(
        &config,
        concat!(
            "import { css } from '@panda/css';\n",
            "css({ bgGradient: 'primary' });\n",
            "css({ bgGradient: 'to-r' });\n",
            "css({ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' });\n",
            "css({ textGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' });",
        ),
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .bg-grad_linear-gradient\(\{colors\.red\.200\}\,_\{colors\.blue\.300\}\) {
        background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300));
      }
      .bg-grad_primary {
        background-image: var(--gradients-primary);
      }
      .bg-grad_to-r {
        --gradient-stops: var(--gradient-via-stops, var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position));
        --gradient-position: to right;
        background-image: linear-gradient(var(--gradient-stops));
      }
      .txt-grad_linear-gradient\(\{colors\.red\.200\}\,_\{colors\.blue\.300\}\) {
        background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300));
        -webkit-background-clip: text;
        color: transparent;
      }
    }
    ");
}

#[test]
fn fallback_atomic_class_names_replace_spaces_with_underscores() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .box-shadow_0_20px_60px_rgba\(15\,_23\,_42\,_0\.16\) {
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.16);
  }
}
");
}

#[test]
fn emits_conditions_and_breakpoints() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ _hover: { md: { color: 'red' } } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  @media (width >= 48rem) {
    .hover\:md\:c_red:hover {
      color: red;
    }
  }
}
");
}

#[test]
fn block_conditions_emit_each_slot_path() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "darkOrSystem": {
                "&:where(.dark, .dark *)": "@slot",
                "@media (prefers-color-scheme: dark)": {
                    "&:where([data-color-mode=system], [data-color-mode=system] *)": "@slot"
                }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ _darkOrSystem: { color: 'red' } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .darkOrSystem\:c_red:where(.dark, .dark *) {
    color: red;
  }
  @media (prefers-color-scheme: dark) {
    .darkOrSystem\:c_red:where([data-color-mode=system], [data-color-mode=system] *) {
      color: red;
    }
  }
}
");
}

#[test]
fn minified_output_preserves_significant_spaces() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "descendantHover": "& :hover"
        },
        "utilities": {
            "margin": { "className": "m" },
            "content": { "className": "content" }
        }
    }));
    let css = compile_css_with_options(
        &config,
        "import { css } from '@panda/css'; css({ margin: '1px 2px', content: '\"a  b\"', _descendantHover: { margin: '3px 4px' } })",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    );
    assert_snapshot!(css, @r#"@layer reset, base, tokens, recipes, utilities;@layer utilities{.m_1px_2px{margin:1px 2px;}.content_\"a__b\"{content:"a  b";}.descendantHover\:m_3px_4px :hover{margin:3px 4px;}}"#);
}
