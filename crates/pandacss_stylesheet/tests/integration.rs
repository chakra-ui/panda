use crate::common::{compile_css, config};
use insta::assert_snapshot;

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "integration fixture keeps config, source, and CSS assertion together"
)]
fn compiles_realistic_static_dynamic_tokens_global_and_recipes() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "dark": ".dark &",
            "hover": "&:hover"
        },
        "staticCss": {
            "css": [
                {
                    "conditions": ["hover"],
                    "properties": {
                        "color": ["blue.500"]
                    }
                }
            ],
            "recipes": {
                "button": [{ "size": ["sm"] }]
            }
        },
        "globalCss": {
            "body": {
                "margin": "0",
                "color": "red.500"
            }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "tokens": {
                "colors": {
                    "blue": { "500": { "value": "#2563eb" } },
                    "red": { "500": { "value": "#ef4444" } }
                }
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "display": "inline-flex"
                    },
                    "variants": {
                        "size": {
                            "sm": { "padding": "4px" }
                        },
                        "tone": {
                            "solid": { "bg": "red.500" }
                        }
                    }
                }
            }
        },
        "utilities": {
            "backgroundColor": { "className": "bg", "shorthand": "bg", "values": "colors" },
            "color": { "className": "c", "values": "colors" },
            "display": { "className": "d" },
            "margin": { "className": "m" },
            "padding": { "className": "p" }
        }
    }));
    let css = compile_css(
        &config,
        concat!(
            "import { css } from '@panda/css';\n",
            "import { button } from '@panda/recipes';\n",
            "css({ color: 'red.500', md: { bg: 'blue.500' }, _dark: { color: 'blue.500' } });\n",
            "button({ tone: 'solid' });",
        ),
    );

    assert_snapshot!(css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      body {
        margin: 0;
        color: var(--colors-red-500);
      }
    }
    @layer tokens {
      :where(:root, :host) {
        --colors-blue-500: #2563eb;
        --colors-red-500: #ef4444;
        --breakpoints-md: 48rem;
        --sizes-breakpoint-md: 48rem;
      }
    }
    @layer recipes {
      @layer base {
        .button {
          display: inline-flex;
        }
      }
      .button--tone_solid {
        background-color: var(--colors-red-500);
      }
      .button--size_sm {
        padding: 4px;
      }
    }
    @layer utilities {
      .c_blue\.500 {
        color: var(--colors-blue-500);
      }
      .c_red\.500 {
        color: var(--colors-red-500);
      }
      .dark .dark\:c_blue\.500 {
        color: var(--colors-blue-500);
      }
      .hover\:c_blue\.500:hover {
        color: var(--colors-blue-500);
      }
      @media (width >= 48rem) {
        .md\:bg_blue\.500 {
          background-color: var(--colors-blue-500);
        }
      }
    }
    ");
}
