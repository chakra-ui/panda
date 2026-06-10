use insta::assert_snapshot;
use pandacss_encoder::EncodedRecipesSnapshot;
use pandacss_project::{Project, System};
use pandacss_shared::DiagnosticSeverity;
use pandacss_stylesheet::{
    StylesheetInput, StylesheetLayer, StylesheetOptions, UtilityStyleOverrides,
};

use crate::common::{compile_css, compile_output, config};

fn compile_project_output(
    project: &mut Project,
    config: &pandacss_config::UserConfig,
) -> pandacss_stylesheet::StylesheetOutput {
    let snapshots = project.stylesheet_snapshots(config);
    pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            token_dictionary: None,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &[],
            token_refs: snapshots.token_refs,
        },
        &StylesheetOptions {
            include_static: true,
            ..StylesheetOptions::default()
        },
    )
}

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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
        --spacing-2: 0.5rem;
        --colors-fg: var(--colors-red);
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_only_referenced_vars() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            },
            "textStyles": {
                "body": {
                    "value": {
                        "color": "{colors.red}"
                    }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ textStyle: 'body' });",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("--colors-red: #f00;"));
    assert!(!css.contains("--colors-blue: #00f;"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
      }
    }
    @layer utilities {
      @layer compositions {
        .textStyle_body {
          color: var(--colors-red);
        }
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_referenced_semantic_conditions() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "conditions": {
            "dark": ".dark &"
        },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" },
                    "green": { "value": "#0f0" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.red}",
                            "_dark": "{colors.blue}"
                        }
                    }
                }
            },
            "textStyles": {
                "body": {
                    "value": {
                        "color": "{colors.fg}"
                    }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ textStyle: 'body' });",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("--colors-fg: var(--colors-red);"));
    assert!(css.contains("--colors-fg: var(--colors-blue);"));
    assert!(!css.contains("--colors-green: #0f0;"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
        --colors-blue: #00f;
        --colors-fg: var(--colors-red);
      }
      .dark {
        --colors-fg: var(--colors-blue);
      }
    }
    @layer utilities {
      @layer compositions {
        .textStyle_body {
          color: var(--colors-fg);
        }
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_static_css_token_references() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "css": [
                {
                    "properties": {
                        "color": ["{colors.red}"]
                    }
                }
            ]
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let css = output.get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("--colors-red: #f00;"));
    assert!(!css.contains("--colors-blue: #00f;"));
    assert_snapshot!(css, @r"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
      }
    }
    @layer utilities {
      .c_\{colors\.red\} {
        color: var(--colors-red);
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_custom_property_direct_token_path_references() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "300": { "value": "#f00" } },
                    "blue": { "300": { "value": "#00f" } }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ '--css-var': 'colors.red.300', color: 'var(--css-var)' });",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("--colors-red-300: #f00;"));
    assert!(!css.contains("--colors-blue-300: #00f;"));
    assert_snapshot!(css, @r"
    @layer tokens {
      :where(:root, :host) {
        --colors-red-300: #f00;
      }
    }
    @layer utilities {
      .\--css-var_colors\.red\.300 {
        --css-var: colors.red.300;
      }
      .color_var\(--css-var\) {
        color: var(--css-var);
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_custom_property_curly_token_modifier_references() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "300": { "value": "#f00" } },
                    "blue": { "300": { "value": "#00f" } }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ '--css-var': '{colors.red.300/40}', color: 'var(--css-var)' });",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("--colors-red-300: #f00;"));
    assert!(!css.contains("--colors-blue-300: #00f;"));
    assert_snapshot!(css, @r"
    @layer tokens {
      :where(:root, :host) {
        --colors-red-300: #f00;
      }
    }
    @layer utilities {
      .\--css-var_\{colors\.red\.300\/40\} {
        --css-var: {colors.red.300/40};
      }
      .color_var\(--css-var\) {
        color: var(--css-var);
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_runtime_token_var_references_without_atoms() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { token } from '@panda/tokens'; export const red = token.var('colors.red');",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert!(css.contains("--colors-red: #f00;"));
    assert!(!css.contains("--colors-blue: #00f;"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
      }
    }
    ");
}

#[test]
fn optimize_tokens_keeps_runtime_semantic_token_references_without_atoms() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "conditions": {
            "dark": ".dark &"
        },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" },
                    "green": { "value": "#0f0" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.red}",
                            "_dark": "{colors.blue}"
                        }
                    }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { token } from '@panda/tokens'; export const fg = token.var('colors.fg');",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens]);

    assert!(css.contains("--colors-fg: var(--colors-red);"));
    assert!(css.contains("--colors-fg: var(--colors-blue);"));
    assert!(!css.contains("--colors-green: #0f0;"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
        --colors-blue: #00f;
        --colors-fg: var(--colors-red);
      }
      .dark {
        --colors-fg: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn optimize_tokens_does_not_keep_primitive_runtime_token_value_references() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { token } from '@panda/tokens'; export const red = token('colors.red');",
        StylesheetOptions::default(),
    );
    assert!(output.layer_css(StylesheetLayer::Tokens).is_none());
}

#[test]
fn optimize_tokens_combines_runtime_and_stylesheet_references() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" },
                    "green": { "value": "#0f0" }
                },
                "spacing": {
                    "2": { "value": "0.5rem" }
                }
            },
            "textStyles": {
                "body": {
                    "value": {
                        "color": "{colors.blue}"
                    }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'; import { token } from '@panda/tokens'; css({ textStyle: 'body' }); export const red = token.var('colors.red');",
        StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Tokens]);

    assert!(css.contains("--colors-red: #f00;"));
    assert!(css.contains("--colors-blue: #00f;"));
    assert!(!css.contains("--colors-green: #0f0;"));
    assert!(!css.contains("--spacing-2: 0.5rem;"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
        --colors-blue: #00f;
      }
    }
    ");
}

#[test]
fn optimize_tokens_runtime_refs_update_when_file_is_refreshed() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            }
        }
    }));
    let system = System::new(config.clone()).expect("valid system");
    let mut project = Project::new(system);

    project.parse_file(
        "a.ts",
        "import { token } from '@panda/tokens'; export const color = token.var('colors.red');",
    );
    let red_output = compile_project_output(&mut project, &config);
    let red_css = red_output.get_layer_css(&[StylesheetLayer::Tokens]);
    assert!(red_css.contains("--colors-red: #f00;"));
    assert!(!red_css.contains("--colors-blue: #00f;"));

    project.refresh_file(
        "a.ts",
        "import { token } from '@panda/tokens'; export const color = token.var('colors.blue');",
    );
    let blue_output = compile_project_output(&mut project, &config);
    let blue_css = blue_output.get_layer_css(&[StylesheetLayer::Tokens]);
    assert!(!blue_css.contains("--colors-red: #f00;"));
    assert!(blue_css.contains("--colors-blue: #00f;"));
    assert_snapshot!(blue_css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
      }
    }
    ");
}

#[test]
fn optimize_tokens_runtime_refs_update_when_file_is_removed() {
    let config = config(serde_json::json!({
        "optimize": { "removeUnusedTokens": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            }
        }
    }));
    let system = System::new(config.clone()).expect("valid system");
    let mut project = Project::new(system);

    project.parse_file(
        "a.ts",
        "import { token } from '@panda/tokens'; export const color = token.var('colors.red');",
    );
    project.parse_file(
        "b.ts",
        "import { token } from '@panda/tokens'; export const color = token.var('colors.blue');",
    );
    let all_output = compile_project_output(&mut project, &config);
    let all_css = all_output.get_layer_css(&[StylesheetLayer::Tokens]);
    assert!(all_css.contains("--colors-red: #f00;"));
    assert!(all_css.contains("--colors-blue: #00f;"));

    project.remove_file("a.ts");
    let blue_output = compile_project_output(&mut project, &config);
    let blue_css = blue_output.get_layer_css(&[StylesheetLayer::Tokens]);
    assert!(!blue_css.contains("--colors-red: #f00;"));
    assert!(blue_css.contains("--colors-blue: #00f;"));
    assert_snapshot!(blue_css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-gray-100: #f4f4f5;
        --colors-gray-900: #18181b;
        --colors-fg: var(--colors-gray-900);
      }
      .dark {
        --colors-fg: var(--colors-gray-100);
      }
      @media (prefers-reduced-motion: no-preference) {
        :where(:root, :host) {
          --colors-fg: color-mix(in srgb, var(--colors-gray-900) 80%, transparent);
        }
      }
    }
    ");
}

#[test]
fn block_conditions_emit_each_semantic_token_slot_path() {
    let config = config(serde_json::json!({
        "conditions": {
            "darkOrSystem": {
                "&:where(.dark, .dark *)": "@slot",
                "@media (prefers-color-scheme: dark)": {
                    "&:where([data-color-mode=system], [data-color-mode=system] *)": "@slot"
                }
            }
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" },
                    "blue": { "value": "#00f" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.red}",
                            "_darkOrSystem": "{colors.blue}"
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
        --colors-blue: #00f;
        --colors-fg: var(--colors-red);
      }
      :where(.dark, .dark *) {
        --colors-fg: var(--colors-blue);
      }
      @media (prefers-color-scheme: dark) {
        :where([data-color-mode=system], [data-color-mode=system] *) {
          --colors-fg: var(--colors-blue);
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-red: #f00;
        --colors-blue: #00f;
        --breakpoints-md: 48rem;
        --sizes-breakpoint-md: 48rem;
        --colors-accent: var(--colors-red);
      }
      @media (width >= 48rem) {
        .dark {
          --colors-accent: var(--colors-blue);
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
        compounds: Vec::new(),
        atomic: Vec::new(),
    };
    let empty_utility_styles = UtilityStyleOverrides::default();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &config,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty_utility_styles,
            encoded_recipes: &recipes,
            static_encoded_recipes: None,
            static_pattern_atoms: &[],
            token_refs: &[],
        },
        &StylesheetOptions::default(),
    );
    let css = output.get_layer_css(&[StylesheetLayer::Base, StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
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
        compounds: Vec::new(),
        atomic: Vec::new(),
    };
    let empty_utility_styles = UtilityStyleOverrides::default();
    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config: &config,
            token_dictionary: None,
            atoms: &[],
            utility_styles: &empty_utility_styles,
            encoded_recipes: &recipes,
            static_encoded_recipes: None,
            static_pattern_atoms: &[],
            token_refs: &[],
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
    let output = compile_output(&config, "", StylesheetOptions::default());
    assert!(output.layer_css(StylesheetLayer::Tokens).is_none());
}

#[test]
fn static_css_themes_emit_selected_theme_token_vars() {
    let config = config(serde_json::json!({
        "conditions": {
            "osDark": "@media (prefers-color-scheme: dark)"
        },
        "staticCss": {
            "themes": ["primary"]
        },
        "theme": {
            "tokens": {
                "colors": {
                    "text": { "value": "blue" },
                    "blue": {
                        "400": { "value": "#60a5fa" },
                        "600": { "value": "#2563eb" }
                    },
                    "red": {
                        "200": { "value": "#fecaca" },
                        "400": { "value": "#f87171" },
                        "600": { "value": "#dc2626" }
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "body": {
                        "value": {
                            "base": "{colors.blue.600}",
                            "_osDark": "{colors.blue.400}"
                        }
                    }
                }
            }
        },
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "text": { "value": "red" }
                    }
                },
                "semanticTokens": {
                    "colors": {
                        "body": {
                            "value": {
                                "base": "{colors.red.600}",
                                "_osDark": "{colors.red.400}"
                            }
                        },
                        "muted": { "value": "{colors.red.200}" }
                    }
                }
            },
            "primary-legacy": {
                "tokens": {
                    "colors": {
                        "text": { "value": "green" }
                    }
                }
            }
        }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let css = output.get_layer_css(&[StylesheetLayer::Tokens]);

    assert!(css.contains("[data-panda-theme=primary]"));
    assert!(!css.contains("[data-panda-theme=primary-legacy]"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-text: blue;
        --colors-blue-400: #60a5fa;
        --colors-blue-600: #2563eb;
        --colors-red-200: #fecaca;
        --colors-red-400: #f87171;
        --colors-red-600: #dc2626;
        --colors-body: var(--colors-blue-600);
      }
      @media (prefers-color-scheme: dark) {
        :where(:root, :host) {
          --colors-body: var(--colors-blue-400);
        }
      }
      :where([data-panda-theme=primary], [data-panda-theme=primary] *) {
        --colors-text: red;
        --colors-body: var(--colors-red-600);
        --colors-muted: var(--colors-red-200);
      }
      @media (prefers-color-scheme: dark) {
        :where([data-panda-theme=primary], [data-panda-theme=primary] *) {
          --colors-body: var(--colors-red-400);
        }
      }
    }
    ");
}

#[test]
fn static_css_themes_star_emits_all_theme_token_vars() {
    let config = config(serde_json::json!({
        "staticCss": {
            "themes": ["*"]
        },
        "theme": {
            "tokens": {
                "colors": {
                    "text": { "value": "blue" }
                }
            }
        },
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "text": { "value": "red" }
                    }
                }
            },
            "secondary": {
                "tokens": {
                    "colors": {
                        "text": { "value": "green" }
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");

    assert!(css.contains("[data-panda-theme=primary]"));
    assert!(css.contains("[data-panda-theme=secondary]"));
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
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    )
    .get_layer_css(&[StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"@layer tokens{:where(:root, :host){--colors-red:#f00;}}");
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base, StylesheetLayer::Tokens]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
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
