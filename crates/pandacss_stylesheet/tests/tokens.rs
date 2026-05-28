mod common;

use insta::assert_snapshot;
use pandacss_project::EncodedRecipesSnapshot;
use pandacss_shared::DiagnosticSeverity;
use pandacss_stylesheet::{StylesheetInput, StylesheetLayer, StylesheetOptions};

use common::{compile_css, compile_css_with_options, config};

#[test]
fn emits_primitive_and_semantic_token_vars() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                },
                "spacing": {
                    "2": { "value": "0.5rem" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": "{colors.red}"
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer tokens {
  :where(:root, :host) {
    --colors-red: #f00;
    --spacing-2: 0.5rem;
    --colors-fg: #f00;
  }
}
");
}

#[test]
fn emits_semantic_token_conditions() {
    let config = config(serde_json::json!({
        "conditions": {
            "dark": ".dark &",
            "motion": "@media (prefers-reduced-motion: no-preference)"
        },
        "theme": {
            "tokens": {
                "colors": {
                    "gray": {
                        "100": { "value": "#f4f4f5" },
                        "900": { "value": "#18181b" }
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.gray.900}",
                            "_dark": "{colors.gray.100}",
                            "_motion": "color-mix(in srgb, {colors.gray.900} 80%, transparent)"
                        }
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer tokens {
  :where(:root, :host) {
    --colors-gray-100: #f4f4f5;
    --colors-gray-900: #18181b;
    --colors-fg: #18181b;
  }
  .dark {
    --colors-fg: #f4f4f5;
  }
  @media (prefers-reduced-motion: no-preference) {
    :where(:root, :host) {
      --colors-fg: color-mix(in srgb, #18181b 80%, transparent);
    }
  }
}
");
}

#[test]
fn emits_nested_semantic_token_conditions() {
    let config = config(serde_json::json!({
        "conditions": {
            "dark": ".dark &"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "accent": {
                        "value": {
                            "base": "{colors.red}",
                            "_dark": {
                                "md": "{colors.blue}"
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer tokens {
  :where(:root, :host) {
    --colors-red: #f00;
    --colors-blue: #00f;
    --breakpoints-md: 48rem;
    --sizes-breakpoint-md: 48rem;
    --colors-accent: #f00;
  }
  @media (width >= 48rem) {
    .dark {
      --colors-accent: #00f;
    }
  }
}
");
}

#[test]
fn get_layer_css_concatenates_layers_without_extra_blank_line() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--brand": "red"
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                }
            }
        }
    }));
    let recipes = EncodedRecipesSnapshot {
        base: Vec::new(),
        variants: Vec::new(),
        atomic: Vec::new(),
    };
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &config,
            token_dictionary: None,
            atoms: Vec::new(),
            encoded_recipes: &recipes,
            static_encoded_recipes: None,
        },
        &StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Base, StylesheetLayer::Tokens]);
    assert_snapshot!(css, @r"
@layer base {
  :where(:root, :host) {
    --brand: red;
  }
}
@layer tokens {
  :where(:root, :host) {
    --colors-red: #f00;
  }
}
");
}

#[test]
fn token_build_errors_are_reported_as_diagnostics() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "bad": { "value": "{colors.red/notAnOpacity}" }
                }
            }
        }
    }));
    let recipes = EncodedRecipesSnapshot {
        base: Vec::new(),
        variants: Vec::new(),
        atomic: Vec::new(),
    };
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &config,
            token_dictionary: None,
            atoms: Vec::new(),
            encoded_recipes: &recipes,
            static_encoded_recipes: None,
        },
        &StylesheetOptions::default(),
    );
    let diagnostics = output
        .diagnostics
        .iter()
        .map(|diagnostic| {
            serde_json::json!({
                "code": diagnostic.code,
                "severity": match diagnostic.severity {
                    DiagnosticSeverity::Info => "info",
                    DiagnosticSeverity::Warning => "warning",
                    DiagnosticSeverity::Error => "error",
                },
                "message": diagnostic.message,
            })
        })
        .collect::<Vec<_>>();
    assert_snapshot!(serde_json::to_string_pretty(&diagnostics).expect("json"), @r#"
[
  {
    "code": "token_dictionary_build_failed",
    "severity": "error",
    "message": "Failed to build token dictionary: Token error: Invalid color mix at colors.red/notAnOpacity: colors.red"
  }
]
"#);
}

#[test]
fn skips_unknown_semantic_token_conditions() {
    let config = config(serde_json::json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "_unknown": "red"
                        }
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
");
}

#[test]
fn emits_tokens_between_base_and_runtime_layers() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "globalCss": {
            "body": { "margin": "0" }
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red' })",
    );
    let base = css.find("@layer base").expect("base layer");
    let tokens = css.find("@layer tokens").expect("tokens layer");
    let utilities = css.find("@layer utilities").expect("utilities layer");
    assert!(base < tokens);
    assert!(tokens < utilities);
}

#[test]
fn minified_output_preserves_token_var_declarations() {
    let config = config(serde_json::json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                }
            }
        }
    }));
    let css = compile_css_with_options(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    );
    assert_snapshot!(css, @r"@layer reset, base, tokens, recipes, utilities;@layer tokens{:where(:root, :host){--colors-red:#f00;}}");
}

#[test]
fn css_var_root_override_applies_to_tokens_and_global_vars() {
    let config = config(serde_json::json!({
        "cssVarRoot": ":where(html)",
        "globalVars": {
            "--brand": "red"
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer base {
  :where(html) {
    --brand: red;
  }
}
@layer tokens {
  :where(html) {
    --colors-red: #f00;
  }
}
");
}
