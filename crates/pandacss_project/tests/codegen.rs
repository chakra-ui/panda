mod common;

use common::create_config;
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
        .generate_artifact(&config, ArtifactId::Types, GenerateOptions::default())
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

    export type ColorPalette = "red"

    export type TokenValue<T extends keyof Tokens> = Tokens[T]
    "#);

    // `types/system` is the merged surface (own csstype + properties + selectors +
    // system-types) — ~540 members, so assert its shape rather than full content.
    let code = &system.code;
    assert!(code.contains("export type CssValue = Globals | (string & {}) | number"));
    assert!(code.contains("export interface CssProperties {"));
    assert!(code.contains("  cursor?: ConditionalValue<CssValue>"));
    assert!(code.contains("export interface SystemProperties extends CssProperties {"));
    assert!(code.contains("  color?: ConditionalValue<ColorsValue>"));
    assert!(code.contains(
        "export interface SystemStyleObject extends SystemProperties, CssVarProperties, NestedStyles {}"
    ));
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
        .generate_artifact(config, ArtifactId::Patterns, GenerateOptions::default())
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
    );
    let ids = artifacts
        .into_iter()
        .map(|artifact| artifact.id)
        .collect::<Vec<_>>();

    assert_snapshot!(format!("{ids:?}"), @"[Patterns, Types, Tokens, Conditions]");
}
