use insta::assert_snapshot;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenInput, ConfigDependency, DependencySet, GenerateOptions,
};

mod common;

use common::{artifact, file, file_dependencies};

#[test]
fn filters_artifacts_by_config_dependencies() {
    let graph = ArtifactGraph;

    let affected = graph.generate_affected(
        DependencySet::one(ConfigDependency::CodegenFormat),
        GenerateOptions::default(),
    );
    assert_eq!(
        affected
            .iter()
            .map(|artifact| artifact.id)
            .collect::<Vec<_>>(),
        vec![
            ArtifactId::Helpers,
            ArtifactId::JsxIsValidProp,
            ArtifactId::JsxFactory,
            ArtifactId::JsxPatterns,
            ArtifactId::JsxCreateRecipeContext,
            ArtifactId::JsxCreateSlotRecipeContext,
            ArtifactId::JsxIndex,
            ArtifactId::Patterns,
            ArtifactId::Recipes,
            ArtifactId::Themes,
            ArtifactId::Types,
            ArtifactId::Css,
            ArtifactId::Cva,
            ArtifactId::Sva,
            ArtifactId::Cx,
            ArtifactId::Tokens,
            ArtifactId::CssIndex,
            ArtifactId::Conditions
        ]
    );

    let condition_changes = graph.generate_affected(
        DependencySet::one(ConfigDependency::Conditions),
        GenerateOptions::default(),
    );
    assert_eq!(
        condition_changes
            .iter()
            .map(|artifact| artifact.id)
            .collect::<Vec<_>>(),
        vec![
            ArtifactId::Recipes,
            ArtifactId::Themes,
            ArtifactId::Types,
            ArtifactId::Css,
            ArtifactId::Conditions
        ]
    );

    let unaffected = graph.generate_affected(
        DependencySet::one(ConfigDependency::Recipes),
        GenerateOptions::default(),
    );
    assert_eq!(
        unaffected
            .iter()
            .map(|artifact| artifact.id)
            .collect::<Vec<_>>(),
        vec![
            ArtifactId::JsxCreateRecipeContext,
            ArtifactId::JsxCreateSlotRecipeContext,
            ArtifactId::Recipes,
            ArtifactId::Types
        ]
    );

    let pattern_changes = graph.generate_affected(
        DependencySet::one(ConfigDependency::Patterns),
        GenerateOptions::default(),
    );
    assert_eq!(
        pattern_changes
            .iter()
            .map(|artifact| artifact.id)
            .collect::<Vec<_>>(),
        vec![
            ArtifactId::JsxPatterns,
            ArtifactId::JsxIndex,
            ArtifactId::Patterns,
            ArtifactId::Types
        ]
    );

    let theme_changes = graph.generate_affected(
        DependencySet::one(ConfigDependency::Themes),
        GenerateOptions::default(),
    );
    assert_eq!(
        theme_changes
            .iter()
            .map(|artifact| artifact.id)
            .collect::<Vec<_>>(),
        vec![ArtifactId::Themes, ArtifactId::Types]
    );
}

#[test]
fn emitted_files_carry_config_dependencies() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate(GenerateOptions::default());

    let helpers = artifact(&artifacts, ArtifactId::Helpers);
    assert!(file_dependencies(helpers, "helpers.mjs").contains(ConfigDependency::CodegenFormat));
    assert!(file_dependencies(helpers, "helpers.d.mts").contains(ConfigDependency::CodegenFormat));

    let conditions = artifact(&artifacts, ArtifactId::Conditions);
    let dependencies = file_dependencies(conditions, "css/conditions.mjs");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Conditions));
    assert!(dependencies.contains(ConfigDependency::Tokens));

    let pattern_config = serde_json::from_value(serde_json::json!({
        "patterns": {
            "stack": {
                "properties": {
                    "gap": { "property": "gap" }
                }
            }
        }
    }))
    .expect("config should deserialize");
    let artifacts = graph.generate_with_config(&pattern_config, GenerateOptions::default());
    let patterns = artifact(&artifacts, ArtifactId::Patterns);
    let dependencies = file_dependencies(patterns, "patterns/stack.mjs");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Patterns));
    assert!(dependencies.contains(ConfigDependency::Tokens));
    assert!(dependencies.contains(ConfigDependency::Utilities));

    let types = artifact(&artifacts, ArtifactId::Types);
    let dependencies = file_dependencies(types, "types/tokens.d.mts");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Tokens));
    assert!(dependencies.contains(ConfigDependency::Themes));

    let dependencies = file_dependencies(types, "types/system.d.mts");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Tokens));
    assert!(dependencies.contains(ConfigDependency::Utilities));
    assert!(dependencies.contains(ConfigDependency::Syntax));

    let themes_config = serde_json::from_value(serde_json::json!({
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "brand": { "value": "red" }
                    }
                }
            }
        }
    }))
    .expect("config should deserialize");
    let artifacts = graph.generate_with_config(&themes_config, GenerateOptions::default());
    let themes = artifact(&artifacts, ArtifactId::Themes);
    let dependencies = file_dependencies(themes, "themes/index.mjs");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Themes));
    assert!(dependencies.contains(ConfigDependency::Tokens));
}

#[test]
fn standalone_theme_artifact_builds_token_dictionary() {
    let config = serde_json::from_value(serde_json::json!({
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "brand": { "value": "red" }
                    }
                }
            }
        }
    }))
    .expect("config should deserialize");
    let artifacts = ArtifactGraph.generate_with_config(&config, GenerateOptions::default());
    let themes = artifact(&artifacts, ArtifactId::Themes);
    let primary = file(themes, "themes/theme-primary.json");

    assert_snapshot!(primary, @r##"
    {
      "name": "primary",
      "id": "panda-theme-primary",
      "css": "[data-panda-theme=primary] {\n  --colors-brand: red;\n}"
    }
    "##);
}

#[test]
fn prebuilt_empty_token_state_does_not_rebuild_theme_dictionary() {
    let config = serde_json::from_value(serde_json::json!({
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "brand": { "value": "red" }
                    }
                }
            }
        }
    }))
    .expect("config should deserialize");
    let input = CodegenInput {
        config,
        token_dictionary_provided: true,
        ..CodegenInput::default()
    };
    let artifacts = ArtifactGraph.generate_with_input(&input, GenerateOptions::default());
    let themes = artifact(&artifacts, ArtifactId::Themes);
    let primary = file(themes, "themes/theme-primary.json");

    assert_snapshot!(primary, @r#"
    {
      "name": "primary",
      "id": "panda-theme-primary",
      "css": ""
    }
    "#);
}
