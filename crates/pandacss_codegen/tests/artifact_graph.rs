use insta::assert_snapshot;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenContext, CodegenInput, ConfigDependency, DependencySet,
    GenerateOptions,
};
use pandacss_config::UserConfig;

use crate::common::{artifact, file, file_dependencies, user_config};
/// Codegen artifacts a change to `dependency` forces Panda to rewrite.
fn affected_ids(dependency: ConfigDependency) -> Vec<ArtifactId> {
    ArtifactGraph
        .generate(
            CodegenContext::config_only(&UserConfig::default()),
            GenerateOptions::default(),
            ArtifactGraph.affected(DependencySet::one(dependency)),
        )
        .iter()
        .map(|artifact| artifact.id)
        .collect()
}

#[test]
fn switching_codegen_format_rewrites_every_artifact() {
    assert_eq!(
        affected_ids(ConfigDependency::CodegenFormat),
        vec![
            ArtifactId::Helpers,
            ArtifactId::JsxIsValidProp,
            ArtifactId::JsxFactory,
            ArtifactId::JsxHelper,
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
            ArtifactId::ViewTransition,
            ArtifactId::PositionTry,
            ArtifactId::Keyframes,
            ArtifactId::FirstThatWorks,
            ArtifactId::Cx,
            ArtifactId::Tokens,
            ArtifactId::CssIndex,
            ArtifactId::Conditions
        ]
    );
}

#[test]
fn adding_a_condition_rewrites_the_artifacts_that_read_conditions() {
    assert_eq!(
        affected_ids(ConfigDependency::Conditions),
        vec![
            ArtifactId::Recipes,
            ArtifactId::Themes,
            ArtifactId::Types,
            ArtifactId::Css,
            ArtifactId::Conditions
        ]
    );
}

#[test]
fn editing_a_recipe_leaves_css_and_pattern_artifacts_alone() {
    assert_eq!(
        affected_ids(ConfigDependency::Recipes),
        vec![
            ArtifactId::JsxCreateRecipeContext,
            ArtifactId::JsxCreateSlotRecipeContext,
            ArtifactId::Recipes,
            ArtifactId::Types
        ]
    );
}

#[test]
fn editing_a_pattern_leaves_recipe_artifacts_alone() {
    assert_eq!(
        affected_ids(ConfigDependency::Patterns),
        vec![
            ArtifactId::JsxPatterns,
            ArtifactId::JsxIndex,
            ArtifactId::Patterns,
            ArtifactId::Types
        ]
    );
}

#[test]
fn editing_a_theme_rewrites_only_themes_and_types() {
    assert_eq!(
        affected_ids(ConfigDependency::Themes),
        vec![ArtifactId::Themes, ArtifactId::Types]
    );
}

#[test]
fn codegen_never_writes_the_design_system_spec() {
    let ids: Vec<ArtifactId> = ArtifactGraph
        .generate_all(
            CodegenContext::config_only(&UserConfig::default()),
            GenerateOptions::default(),
        )
        .iter()
        .map(|artifact| artifact.id)
        .collect();

    assert!(!ids.contains(&ArtifactId::Specs));
    assert_eq!(
        ids,
        ArtifactGraph
            .styled_system()
            .map(|node| node.id)
            .collect::<Vec<_>>()
    );
}

#[test]
fn the_spec_is_still_reachable_by_id() {
    let specs = ArtifactGraph.node(ArtifactId::Specs);
    assert!(specs.is_some(), "`--spec` looks the node up by id");
}

/// `ALL` and `NODES` are hand-written; nothing else catches a missing entry.
#[test]
fn every_id_is_registered() {
    let mut registered: Vec<ArtifactId> =
        ArtifactGraph.nodes().iter().map(|node| node.id).collect();
    let mut all = ArtifactId::ALL.to_vec();
    registered.sort_unstable_by_key(|id| id.as_str());
    all.sort_unstable_by_key(|id| id.as_str());

    assert_eq!(registered, all);
}

#[test]
fn emitted_files_carry_config_dependencies() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate_all(
        CodegenContext::config_only(&UserConfig::default()),
        GenerateOptions::default(),
    );

    let helpers = artifact(&artifacts, ArtifactId::Helpers);
    assert!(file_dependencies(helpers, "helpers.mjs").contains(ConfigDependency::CodegenFormat));
    assert!(file_dependencies(helpers, "helpers.d.ts").contains(ConfigDependency::CodegenFormat));

    let conditions = artifact(&artifacts, ArtifactId::Conditions);
    let dependencies = file_dependencies(conditions, "css/conditions.mjs");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Conditions));
    assert!(dependencies.contains(ConfigDependency::Tokens));

    let pattern_config = user_config(serde_json::json!({
        "patterns": {
            "stack": {
                "properties": {
                    "gap": { "property": "gap" }
                }
            }
        }
    }));
    let artifacts = graph.generate_all(
        CodegenContext::config_only(&pattern_config),
        GenerateOptions::default(),
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);
    let dependencies = file_dependencies(patterns, "patterns/stack.mjs");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Patterns));
    assert!(dependencies.contains(ConfigDependency::Tokens));
    assert!(dependencies.contains(ConfigDependency::Utilities));

    let types = artifact(&artifacts, ArtifactId::Types);
    let dependencies = file_dependencies(types, "types/tokens.d.ts");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Tokens));
    assert!(dependencies.contains(ConfigDependency::Themes));

    let dependencies = file_dependencies(types, "types/system.d.ts");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Tokens));
    assert!(dependencies.contains(ConfigDependency::Utilities));

    let themes_config = user_config(serde_json::json!({
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "brand": { "value": "red" }
                    }
                }
            }
        }
    }));
    let artifacts = graph.generate_all(
        CodegenContext::config_only(&themes_config),
        GenerateOptions::default(),
    );
    let themes = artifact(&artifacts, ArtifactId::Themes);
    let dependencies = file_dependencies(themes, "themes/index.mjs");
    assert!(dependencies.contains(ConfigDependency::CodegenFormat));
    assert!(dependencies.contains(ConfigDependency::Themes));
    assert!(dependencies.contains(ConfigDependency::Tokens));
}

#[test]
fn standalone_theme_artifact_builds_token_dictionary() {
    let config = user_config(serde_json::json!({
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "brand": { "value": "red" }
                    }
                }
            }
        }
    }));
    let artifacts = ArtifactGraph.generate_all(
        CodegenContext::config_only(&config),
        GenerateOptions::default(),
    );
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
    let config = user_config(serde_json::json!({
        "themes": {
            "primary": {
                "tokens": {
                    "colors": {
                        "brand": { "value": "red" }
                    }
                }
            }
        }
    }));
    let input = CodegenInput {
        config,
        token_dictionary_provided: true,
        ..CodegenInput::default()
    };
    let artifacts = ArtifactGraph.generate_all(&input, GenerateOptions::default());
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

/// A `.d.ts` that names another declaration file directly (`export * from
/// './css.d.ts'`) is TS2846. Declaration specifiers must name the runtime
/// module and let TypeScript map `./css.js` onto `./css.d.ts`.
#[test]
fn declaration_files_never_import_a_declaration_file_by_name() {
    let config = user_config(serde_json::json!({
        "jsxFramework": "react",
        "jsxFactory": "styled",
        "theme": {
            "recipes": {
                "button": { "className": "btn", "base": { "color": "red" } }
            },
            "slotRecipes": {
                "card": { "className": "card", "slots": ["root"], "base": { "root": {} } }
            }
        },
        "patterns": {
            "stack": { "jsxName": "Stack", "properties": { "gap": { "property": "gap" } } }
        }
    }));
    let input = CodegenInput {
        config,
        ..CodegenInput::default()
    };

    for format in [
        pandacss_config::CodegenFormat::Js,
        pandacss_config::CodegenFormat::Mjs,
    ] {
        let artifacts = ArtifactGraph.generate_all(
            &input,
            GenerateOptions {
                format,
                import_extensions: true,
            },
        );
        let mut checked = 0;
        for artifact in &artifacts {
            for file in &artifact.files {
                if !file.path.ends_with(".d.ts") && !file.path.ends_with(".d.mts") {
                    continue;
                }
                checked += 1;
                for line in file.code.lines() {
                    assert!(
                        !line.contains(".d.ts'") && !line.contains(".d.mts'"),
                        "{} ({format:?}) references a declaration file directly: {line}",
                        file.path
                    );
                }
            }
        }
        assert!(checked > 10, "expected declaration files, saw {checked}");
    }
}

/// `UnstyledProps` used to be re-declared in both recipe-context artifacts. A
/// `.d.ts` exports its top-level declarations even without `export`, so the two
/// collided through `jsx/index.d.ts`'s `export *` (TS2308).
#[test]
fn recipe_context_artifacts_share_one_unstyled_props_declaration() {
    let config = user_config(serde_json::json!({
        "jsxFramework": "react",
        "jsxFactory": "styled"
    }));
    let input = CodegenInput {
        config,
        ..CodegenInput::default()
    };
    let artifacts = ArtifactGraph.generate_all(&input, GenerateOptions::default());

    let declarations = artifacts
        .iter()
        .flat_map(|artifact| &artifact.files)
        .filter(|file| file.code.contains("interface UnstyledProps"))
        .map(|file| file.path.as_str())
        .collect::<Vec<_>>();

    assert_eq!(declarations, vec!["types/jsx.d.ts"]);
}
