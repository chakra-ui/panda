mod common;

use insta::assert_snapshot;

use common::{compile_css, config};

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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer base {
  html, body {
    padding: 0;
    color: #f00;
  }
  html:is(:hover, [data-hover]), body:is(:hover, [data-hover]) {
    background-color: #f00;
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer base {
  .btn {
    width: 40px;
  }
  @media (width >= 64rem) {
    .btn {
      width: 90px;
    }
  }
  .btn:is(:focus, [data-focus]) {
    color: #fecaca;
  }
  .btn:is(:focus, [data-focus]):is(:hover, [data-hover]) {
    background-color: #f87171;
  }
  @media (width >= 40rem) {
    .btn {
      font-size: 12px;
    }
  }
  .btn .aaa {
    color: #bfdbfe;
  }
  .btn .aaa .bbb {
    color: #93c5fd;
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer base {
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
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer base {
  @media (min-width: 640px) {
    body, :root {
      color: #fecaca;
    }
  }
  @media (min-width: 640px) {
    @supports (display: grid) and (display: contents) {
      body {
        color: #fecaca;
      }
    }
  }
  @media (min-width: 640px) {
    @supports (display: grid) and (display: contents) {
      body a {
        color: #f87171;
      }
    }
  }
}
");
}
