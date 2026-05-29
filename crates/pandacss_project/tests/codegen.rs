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
    let properties = artifact
        .files
        .iter()
        .find(|file| file.path == "types/properties.d.mts")
        .expect("properties file");

    assert_snapshot!(tokens.code, @r#"
    export type ColorToken = "colorPalette.500" | "red.500"

    export interface Tokens {
      colors: ColorToken
    }

    export type ColorPalette = "red"

    export type TokenValue<T extends keyof Tokens> = Tokens[T]
    "#);
    assert_snapshot!(properties.code, @r#"
    import type { ConditionalValue } from './conditions';

    import type { AnyNumber, AnyString, CssVars, ColorsValue } from './values';

    export type CssVarValue = ConditionalValue<CssVars | AnyString | AnyNumber>

    export type CssVarProperties = {
      [K in `--${string}`]?: CssVarValue
    }

    export interface SystemProperties {
      color?: ConditionalValue<ColorsValue>
    }
    "#);
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

    assert_snapshot!(format!("{ids:?}"), @"[Patterns, Types, Conditions]");
}
