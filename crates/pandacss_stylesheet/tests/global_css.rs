use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_output, config};

#[test]
fn emits_made_with_panda_marker_in_base_layer() {
    let config = config(serde_json::json!({}));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    ");
}

#[test]
fn emits_made_with_panda_marker_before_user_global_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" }
        },
        "globalCss": {
            "body": {
                "color": "red"
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  body {
    color: red;
  }
}
");
}

#[test]
fn emits_global_css_color_mix_transform_utilities_to_custom_properties() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "border": {
                        "muted": { "value": "#ccc" }
                    }
                }
            }
        },
        "utilities": {
            "boxShadowColor": {
                "className": "bx-sh-c",
                "shorthand": "shadowColor",
                "values": "colors",
                "property": "--shadow-color",
                "transform": {
                    "kind": "js-callback",
                    "id": "utilities.boxShadowColor.transform"
                }
            }
        },
        "globalCss": {
            "body": {
                "shadowColor": "border.muted"
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  body {
    --shadow-color: var(--colors-border-muted);
  }
}
");
}

#[test]
fn expands_global_css_composition_props_through_utilities() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "fontSizes": {
                    "sm": { "value": "0.875rem" }
                },
                "lineHeights": {
                    "tight": { "value": "1.25" }
                },
                "colors": {
                    "red": { "500": { "value": "#f00" } }
                }
            },
            "textStyles": {
                "sm": {
                    "value": {
                        "fontSize": "sm",
                        "lineHeight": "tight"
                    }
                }
            },
            "layerStyles": {
                "card": {
                    "value": {
                        "bg": "red.500"
                    }
                }
            },
            "animationStyles": {
                "fade": {
                    "value": {
                        "animation": "fade-in 120ms ease"
                    }
                }
            }
        },
        "utilities": {
            "fontSize": { "className": "fs", "values": "fontSizes" },
            "lineHeight": { "className": "lh", "values": "lineHeights" },
            "backgroundColor": { "className": "bg-c", "shorthand": "bg", "values": "colors" },
            "animation": { "className": "anim" }
        },
        "globalCss": {
            "pre, code": {
                "textStyle": "sm",
                "layerStyle": "card",
                "animationStyle": "fade"
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  pre, code {
    font-size: var(--font-sizes-sm);
    line-height: var(--line-heights-tight);
    background-color: var(--colors-red-500);
    animation: fade-in 120ms ease;
  }
}
");
}

#[test]
fn skips_unknown_global_css_composition_values() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "textStyles": {
                "sm": {
                    "value": {
                        "fontSize": "0.875rem"
                    }
                }
            }
        },
        "globalCss": {
            "code": {
                "textStyle": "missing"
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
}
");
}

#[test]
fn bare_type_selector_nests_as_descendant() {
    let config = config(serde_json::json!({
        "globalCss": {
            ".article": {
                "h2": { "color": "blue" }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  .article h2 {
    color: blue;
  }
}
");
}

#[test]
fn comma_group_distributes_parent_to_every_member() {
    let config = config(serde_json::json!({
        "globalCss": {
            ".article": {
                "h2, h3, h4": { "color": "blue" }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  .article h2, .article h3, .article h4 {
    color: blue;
  }
}
");
}

#[test]
fn composition_and_sibling_override_merge_into_one_block() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "fonts": { "code": { "value": "monospace" }, "sans": { "value": "system-ui" } }
            },
            "textStyles": {
                "label": {
                    "medium": { "value": { "fontFamily": "sans", "fontSize": "14px" } }
                }
            }
        },
        "globalCss": {
            ".codeblock": {
                "textStyle": "label.medium",
                "fontFamily": "code"
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  .codeblock {
    font-family: code;
    font-size: 14px;
  }
}
");
}

#[test]
fn emits_global_css_from_serialized_config() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:is(:hover, [data-hover])"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "tokens": {
                "colors": {
                    "red": { "500": { "value": "#f00" } }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "backgroundColor": { "className": "bg-c", "shorthand": "bgColor", "values": "colors" },
            "padding": { "className": "p" }
        },
        "globalCss": {
            "html, body": {
                "padding": 0,
                "color": "red.500",
                "_hover": {
                    "bgColor": "red.500"
                },
                "md": {
                    "padding": "4px"
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  html, body {
    padding: 0;
    color: var(--colors-red-500);
  }
  html:is(:hover, [data-hover]), body:is(:hover, [data-hover]) {
    background-color: var(--colors-red-500);
  }
  @media (width >= 48rem) {
    html, body {
      padding: 4px;
    }
  }
}
");
}

#[test]
fn emits_global_css_direct_nesting_and_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "focus": "&:is(:focus, [data-focus])",
            "hover": "&:is(:hover, [data-hover])"
        },
        "theme": {
            "breakpoints": {
                "sm": "40rem",
                "lg": "64rem"
            },
            "tokens": {
                "colors": {
                    "blue": { "200": { "value": "#bfdbfe" }, "300": { "value": "#93c5fd" } },
                    "red": { "200": { "value": "#fecaca" }, "400": { "value": "#f87171" } }
                }
            }
        },
        "utilities": {
            "backgroundColor": { "className": "bg-c", "values": "colors" },
            "color": { "className": "c", "values": "colors" },
            "fontSize": { "className": "fs" },
            "width": { "className": "w" }
        },
        "globalCss": {
            ".btn": {
                "width": { "base": "40px", "lg": "90px" },
                "_focus": {
                    "color": "red.200",
                    "_hover": {
                        "backgroundColor": "red.400"
                    }
                },
                "sm": {
                    "fontSize": "12px"
                },
                "& .aaa": {
                    "color": "blue.200",
                    "& .bbb": {
                        "color": "blue.300"
                    }
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      .btn {
        width: 40px;
      }
      .btn:is(:focus, [data-focus]) {
        color: var(--colors-red-200);
      }
      .btn:is(:focus, [data-focus]):is(:hover, [data-hover]) {
        background-color: var(--colors-red-400);
      }
      .btn .aaa {
        color: var(--colors-blue-200);
      }
      .btn .aaa .bbb {
        color: var(--colors-blue-300);
      }
      @media (width >= 40rem) {
        .btn {
          font-size: 12px;
        }
      }
      @media (width >= 64rem) {
        .btn {
          width: 90px;
        }
      }
    }
    ");
}

#[test]
fn emits_global_css_nested_utility_transforms() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "divideX": {
                "className": "divide-x",
                "values": {
                    "40px": {
                        "& > :not([hidden]) ~ :not([hidden])": {
                            "borderInlineStartWidth": "40px",
                            "borderInlineEndWidth": "0px"
                        }
                    }
                }
            }
        },
        "globalCss": {
            ".btn": {
                "&:hover": {
                    "divideX": "40px"
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  .btn:hover > :not([hidden]) ~ :not([hidden]) {
    border-inline-end-width: 0px;
    border-inline-start-width: 40px;
  }
}
");
}

#[test]
fn emits_global_css_recursive_nesting_and_important() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:is(:hover, [data-hover])"
        },
        "utilities": {
            "color": { "className": "c" },
            "cursor": { "className": "cursor" },
            "margin": { "className": "m" },
            "marginTop": { "className": "mt" },
            "scrollPaddingTop": { "className": "scroll-pt" },
            "textDecoration": { "className": "td" },
            "userSelect": { "className": "select" }
        },
        "globalCss": {
            "html": {
                "scrollPaddingTop": "80px",
                "&.dragging-ew": {
                    "userSelect": "none !important",
                    "& *": {
                        "cursor": "ew-resize !important"
                    },
                    "_hover": {
                        "color": "red"
                    }
                }
            },
            "body > a": {
                "&:not(:hover)": {
                    "textDecoration": "none"
                }
            },
            "p": {
                "margin": 0,
                "& ~ &": {
                    "marginTop": 0
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      html {
        scroll-padding-top: 80px;
      }
      html.dragging-ew {
        user-select: none !important;
      }
      html.dragging-ew * {
        cursor: ew-resize !important;
      }
      html.dragging-ew:is(:hover, [data-hover]) {
        color: red;
      }
      body > a:not(:hover) {
        text-decoration: none;
      }
      p {
        margin: 0;
      }
      p ~ p {
        margin-top: 0;
      }
    }
    ");
}

#[test]
fn emits_global_css_at_rules() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "200": { "value": "#fecaca" }, "400": { "value": "#f87171" } }
                }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" }
        },
        "globalCss": {
            "@media (min-width: 640px)": {
                "body, :root": {
                    "color": "red.200"
                },
                "@supports (display: grid) and (display: contents)": {
                    "body": {
                        "color": "red.200",
                        "& a": {
                            "color": "red.400"
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @media (min-width: 640px) {
        body, :root {
          color: var(--colors-red-200);
        }
        @supports (display: grid) and (display: contents) {
          body {
            color: var(--colors-red-200);
          }
          body a {
            color: var(--colors-red-400);
          }
        }
      }
    }
    ");
}

#[test]
fn resolves_global_css_token_references_in_raw_at_rules() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "sizes": {
                    "4xl": { "value": "56rem" }
                }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        },
        "globalCss": {
            "@container (min-width: {sizes.4xl})": {
                "html": {
                    "color": "green"
                }
            },
            "@media (min-width: token(sizes.4xl))": {
                "body": {
                    "color": "blue"
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @r"
@layer base {
  :root {
    --made-with-panda: '🐼';
  }
  @media (min-width: 56rem) {
    body {
      color: blue;
    }
  }
  @container (min-width: 56rem) {
    html {
      color: green;
    }
  }
}
");
}
