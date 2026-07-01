use crate::common::create_config;
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactId, ConfigDependency, GenerateOptions};
use pandacss_project::{Project, System};
use serde_json::json;

#[test]
fn generates_artifacts_from_resolved_project_state() {
    let config = create_config(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "500": { "value": "#f00" } }
                }
            }
        },
        "utilities": {
            "color": {
                "className": "c",
                "values": "colors"
            }
        }
    }));
    let system = System::new(config.clone()).expect("valid project config");
    let project = Project::new(system);

    let artifact = project
        .generate_artifact(&config, ArtifactId::Types, GenerateOptions::default(), None)
        .expect("types artifact");
    let tokens = artifact
        .files
        .iter()
        .find(|file| file.path == "types/tokens.d.mts")
        .expect("tokens file");
    let system = artifact
        .files
        .iter()
        .find(|file| file.path == "types/system.d.mts")
        .expect("system file");

    assert_snapshot!(tokens.code, @r#"
    export type ColorToken = "colorPalette.500" | "red.500"

    export interface Tokens {
      colors: ColorToken
    }

    export type Token = `colors.${ColorToken}`

    export type ColorOpacityModifier = `${number}`

    export type ColorOpacityToken = `colors.${ColorToken}/${ColorOpacityModifier}`

    export type TokenPath = Token | ColorOpacityToken

    export type ColorPalette = "red"

    export type TokenValue<T extends keyof Tokens> = Tokens[T]
    "#);

    // `types/system` is the merged surface (own csstype + properties + selectors +
    // system-types) — ~540 members, so assert its shape rather than full content.
    let code = &system.code;
    assert!(code.contains("export type CssValue = Globals | (string & {}) | number"));
    assert!(code.contains("export interface SystemProperties {"));
    assert!(!code.contains("export interface CssProperties {"));
    assert!(
        code.contains(r#"  color?: ConditionalValue<ColorsValue | PropertyValueMap["color"]>"#)
    );
    assert!(code.contains(
        "export interface SystemStyleObject extends SystemProperties, CssVarProperties, NestedStyles {}"
    ));
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "theme artifact fixture covers runtime and type outputs together"
)]
fn generates_theme_artifact_files() {
    let config = create_config(json!({
        "conditions": {
            "osDark": "@media (prefers-color-scheme: dark)"
        },
        "theme": {
            "tokens": {
                "colors": {
                    "blue": {
                        "400": { "value": "#60a5fa" },
                        "600": { "value": "#2563eb" }
                    },
                    "pink": {
                        "400": { "value": "#f472b6" },
                        "600": { "value": "#db2777" }
                    }
                }
            }
        },
        "themes": {
            "default": {
                "tokens": {
                    "colors": {
                        "primary": { "value": "blue" }
                    }
                },
                "semanticTokens": {
                    "colors": {
                        "text": {
                            "value": {
                                "base": "{colors.blue.600}",
                                "_osDark": "{colors.blue.400}"
                            }
                        }
                    }
                }
            },
            "empty": {},
            "pink": {
                "tokens": {
                    "colors": {
                        "primary": { "value": "pink" }
                    }
                },
                "semanticTokens": {
                    "colors": {
                        "text": {
                            "value": {
                                "base": "{colors.pink.600}",
                                "_osDark": "{colors.pink.400}"
                            }
                        }
                    }
                }
            }
        }
    }));
    let system = System::new(config.clone()).expect("valid project config");
    let project = Project::new(system);
    let artifact = project
        .generate_artifact(&config, ArtifactId::Themes, GenerateOptions::default(), None)
        .expect("themes artifact");

    let mut files = artifact
        .files
        .iter()
        .map(|file| file.path.as_str())
        .collect::<Vec<_>>();
    files.sort_unstable();
    assert_eq!(
        files,
        vec![
            "themes/index.d.mts",
            "themes/index.mjs",
            "themes/theme-default.json",
            "themes/theme-empty.json",
            "themes/theme-pink.json"
        ]
    );

    let default_theme = artifact
        .files
        .iter()
        .find(|file| file.path == "themes/theme-default.json")
        .expect("default theme json");
    assert_snapshot!(default_theme.code, @r#"
    {
      "name": "default",
      "id": "panda-theme-default",
      "css": "[data-panda-theme=default] {\n  --colors-primary: blue;\n  --colors-text: var(--colors-blue-600);\n}\n@media (prefers-color-scheme: dark) {\n  [data-panda-theme=default] {\n    --colors-text: var(--colors-blue-400);\n  }\n}"
    }
    "#);
    let empty_theme = artifact
        .files
        .iter()
        .find(|file| file.path == "themes/theme-empty.json")
        .expect("empty theme json");
    assert_snapshot!(empty_theme.code, @r#"
    {
      "name": "empty",
      "id": "panda-theme-empty",
      "css": ""
    }
    "#);

    let index_types = artifact
        .files
        .iter()
        .find(|file| file.path == "themes/index.d.mts")
        .expect("themes index types");
    assert_snapshot!(index_types.code, @r#"
    export type ThemeName = "default" | "empty" | "pink"
    export type ThemeByName = {
      "default": {
        id: string
        name: "default"
        css: string
      }
      "pink": {
        id: string
        name: "pink"
        css: string
      }
    }

    export type Theme<T extends ThemeName> = ThemeByName[T]

    /**
     * Dynamically import a theme by name
     */
    export declare function getTheme<T extends ThemeName>(themeName: T): Promise<ThemeByName[T]>

    /**
     * Inject a theme stylesheet into the document
     */
    export declare function injectTheme(el: HTMLElement, theme: Theme<any>): HTMLStyleElement
    "#);
}

#[test]
fn embeds_pattern_codegen_source_from_config() {
    let config = create_config(json!({
        "patterns": {
            "stack": {
                "defaultValues": { "gap": "4" },
                "properties": { "gap": { "property": "gap" } },
                "codegenSource": "{ transform(props) { return { display: \"flex\", gap: props.gap } }, defaultValues: {\"gap\":\"4\"} }"
            }
        }
    }));
    let system = System::new(config.clone()).expect("valid project config");
    let project = Project::new(system);

    let code = pattern_runtime_code(&project, &config);
    assert!(
        code.contains("display: \"flex\""),
        "expected the user transform body, got:\n{code}"
    );
    assert!(
        code.contains("gap: props.gap"),
        "expected the user transform body, got:\n{code}"
    );
    assert!(
        !code.contains("(s) => s"),
        "should not fall back to the identity transform:\n{code}"
    );
}

#[test]
fn falls_back_to_identity_transform_without_codegen_source() {
    let config = create_config(json!({
        "patterns": {
            "stack": {
                "defaultValues": { "gap": "4" },
                "properties": { "gap": { "property": "gap" } }
            }
        }
    }));
    let system = System::new(config.clone()).expect("valid project config");
    let project = Project::new(system);

    let code = pattern_runtime_code(&project, &config);
    assert!(
        code.contains("(s) => s"),
        "expected the identity fallback, got:\n{code}"
    );
}

/// The generated `patterns/stack` runtime module (skips the `.d.ts` declaration).
fn pattern_runtime_code(project: &Project, config: &pandacss_config::UserConfig) -> String {
    let artifact = project
        .generate_artifact(config, ArtifactId::Patterns, GenerateOptions::default(), None)
        .expect("patterns artifact");
    artifact
        .files
        .into_iter()
        .find(|file| file.path.starts_with("patterns/stack") && !file.path.ends_with(".d.ts"))
        .expect("patterns/stack runtime file")
        .code
}

#[test]
fn generates_affected_artifacts_by_dependency() {
    let config = create_config(json!({}));
    let system = System::new(config.clone()).expect("valid project config");
    let project = Project::new(system);

    let artifacts = project.generate_affected_artifacts(
        &config,
        pandacss_codegen::DependencySet::one(ConfigDependency::Tokens),
        GenerateOptions::default(),
        None,
    );
    let ids = artifacts
        .into_iter()
        .map(|artifact| artifact.id)
        .collect::<Vec<_>>();

    assert_snapshot!(format!("{ids:?}"), @"[Patterns, Themes, Types, Tokens, Conditions]");
}
