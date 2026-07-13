use crate::common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{
    ArtifactFile, ArtifactGraph, ArtifactId, CodegenInput, CodegenOverlay, GenerateOptions,
};
use pandacss_config::{CodegenFormat, TypeData, UserConfig};

fn options() -> GenerateOptions {
    GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    }
}

fn overlay() -> CodegenOverlay {
    CodegenOverlay {
        jsx: "@ds/jsx".into(),
        recipes: "@ds/recipes".into(),
        patterns: "@ds/patterns".into(),
        owned_recipes: Vec::new(),
        owned_patterns: Vec::new(),
        ..Default::default()
    }
}

fn input_with(config: UserConfig, overlay: CodegenOverlay) -> CodegenInput {
    CodegenInput {
        types: TypeData {
            recipes: config.recipe_type_data(),
            patterns: config.pattern_type_data(),
            ..TypeData::default()
        },
        config,
        overlay: Some(overlay),
        ..CodegenInput::default()
    }
}

fn recipes_config(recipes: &serde_json::Value) -> UserConfig {
    serde_json::from_value(serde_json::json!({ "theme": { "recipes": recipes } }))
        .expect("config should deserialize")
}

fn patterns_config(patterns: &serde_json::Value) -> UserConfig {
    serde_json::from_value(serde_json::json!({
        "jsxFramework": "react",
        "patterns": patterns,
    }))
    .expect("config should deserialize")
}

fn config_with_app_recipe() -> UserConfig {
    recipes_config(&serde_json::json!({
        "button": { "className": "button" },
    }))
}

fn generate_with(config: UserConfig, overlay: CodegenOverlay) -> Vec<ArtifactFile> {
    ArtifactGraph
        .generate_with_input(&input_with(config, overlay), options())
        .into_iter()
        .flat_map(|artifact| artifact.files)
        .collect()
}

#[test]
fn generic_runtime_is_still_emitted_locally() {
    let artifacts =
        ArtifactGraph.generate_with_input(&input_with(UserConfig::default(), overlay()), options());

    assert!(!artifact(&artifacts, ArtifactId::Css).files.is_empty());
    assert!(!artifact(&artifacts, ArtifactId::Helpers).files.is_empty());
    assert!(file(artifact(&artifacts, ArtifactId::CssIndex), "css/index.ts").contains("./css"));
}

#[test]
fn recipes_emits_only_app_delta() {
    let config = recipes_config(&serde_json::json!({
        "button": { "className": "button" },
        "card": { "className": "card" },
    }));
    let mut overlay = overlay();
    overlay.owned_recipes = vec!["button".into()];

    let artifacts = ArtifactGraph.generate_with_input(&input_with(config, overlay), options());
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert_eq!(
        paths(recipes),
        vec!["recipes/runtime.ts", "recipes/card.ts", "recipes/index.ts"]
    );
    assert_eq!(
        file(recipes, "recipes/index.ts"),
        indoc! {r"
        export { button } from '@ds/recipes';
        export * from './card';
        "}
        .trim()
    );
}

#[test]
fn recipes_conflict_reexports_app_and_omits_ds_named() {
    let config = recipes_config(&serde_json::json!({
        "button": { "className": "button" },
    }));
    // App redefined `button`, so it is excluded from owned_recipes (app wins).
    let overlay = overlay();

    let artifacts = ArtifactGraph.generate_with_input(&input_with(config, overlay), options());
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert_eq!(
        paths(recipes),
        vec![
            "recipes/runtime.ts",
            "recipes/button.ts",
            "recipes/index.ts"
        ]
    );
    assert_eq!(
        file(recipes, "recipes/index.ts"),
        "export * from './button';"
    );
}

#[test]
fn recipes_all_owned_skips_runtime() {
    let config = recipes_config(&serde_json::json!({
        "button": { "className": "button" },
    }));
    let mut overlay = overlay();
    overlay.owned_recipes = vec!["button".into()];

    let artifacts = ArtifactGraph.generate_with_input(&input_with(config, overlay), options());
    let recipes = artifact(&artifacts, ArtifactId::Recipes);

    assert_eq!(paths(recipes), vec!["recipes/index.ts"]);
    assert_eq!(
        file(recipes, "recipes/index.ts"),
        "export { button } from '@ds/recipes';"
    );
}

#[test]
fn patterns_emits_only_app_delta() {
    let config = patterns_config(&serde_json::json!({
        "stack": { "properties": { "gap": { "property": "gap" } } },
        "grid": { "properties": { "gap": { "property": "gap" } } },
    }));
    let mut overlay = overlay();
    overlay.owned_patterns = vec!["stack".into()];

    let artifacts = ArtifactGraph.generate_with_input(&input_with(config, overlay), options());
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        paths(patterns),
        vec![
            "patterns/runtime.ts",
            "patterns/grid.ts",
            "patterns/index.ts"
        ]
    );
    assert_eq!(
        file(patterns, "patterns/index.ts"),
        indoc! {r"
        export { stack } from '@ds/patterns';
        export * from './grid';
        "}
        .trim()
    );
}

#[test]
fn jsx_reexports_owned_ds_pattern_and_emits_app_delta() {
    let config = patterns_config(&serde_json::json!({
        "stack": { "properties": { "gap": { "property": "gap" } } },
        "grid": { "properties": { "gap": { "property": "gap" } } },
    }));
    let mut overlay = overlay();
    overlay.owned_patterns = vec!["stack".into()];

    let artifacts = ArtifactGraph.generate_with_input(&input_with(config, overlay), options());

    // The generic jsx factory is still emitted locally.
    assert!(
        !artifact(&artifacts, ArtifactId::JsxFactory)
            .files
            .is_empty()
    );

    // Only the app pattern component is emitted; the DS one is re-exported.
    let jsx_patterns = artifact(&artifacts, ArtifactId::JsxPatterns);
    assert_eq!(paths(jsx_patterns), vec!["jsx/grid.ts"]);

    let index = file(artifact(&artifacts, ArtifactId::JsxIndex), "jsx/index.ts");
    assert!(index.contains("export * from './factory';"));
    assert!(index.contains("export * from '@ds/jsx/stack';"));
    assert!(index.contains("export * from './grid';"));
}

#[test]
fn jsx_conflict_keeps_app_component_local() {
    let config = patterns_config(&serde_json::json!({
        "stack": { "properties": { "gap": { "property": "gap" } } },
    }));
    // App redefined `stack`: excluded from owned_patterns, so it stays local.
    let overlay = overlay();

    let artifacts = ArtifactGraph.generate_with_input(&input_with(config, overlay), options());

    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxPatterns)),
        vec!["jsx/stack.ts"]
    );
    let index = file(artifact(&artifacts, ArtifactId::JsxIndex), "jsx/index.ts");
    assert!(index.contains("export * from './stack';"));
    assert!(!index.contains("@ds/jsx/stack"));
}

#[test]
fn pure_consumer_virtualizes_entire_runtime() {
    let mut overlay = overlay();
    overlay.css = "@acme/ui/css".into();
    overlay.helpers = "@acme/ui/helpers".into();
    overlay.virtualize_utils = true;
    overlay.virtualize_conditions = true;
    overlay.virtualize_css = true;

    let files = generate_with(config_with_app_recipe(), overlay);

    assert!(!files.iter().any(|f| f.path == "helpers.ts"));
    assert!(!files.iter().any(|f| f.path == "css/css.ts"));
    assert!(!files.iter().any(|f| f.path == "css/cx.ts"));
    assert!(!files.iter().any(|f| f.path == "css/cva.ts"));
    assert!(!files.iter().any(|f| f.path == "css/sva.ts"));
    assert!(!files.iter().any(|f| f.path == "css/conditions.ts"));

    let css_index = files
        .iter()
        .find(|f| f.path == "css/index.ts")
        .expect("css/index barrel");
    assert!(css_index.code.contains("@acme/ui/css"));
}

#[test]
fn redeclared_conditions_keep_conditions_and_css_local() {
    let mut overlay = overlay();
    overlay.css = "@acme/ui/css".into();
    overlay.helpers = "@acme/ui/helpers".into();
    overlay.virtualize_utils = true;
    overlay.virtualize_conditions = false;
    overlay.virtualize_css = false;

    let files = generate_with(config_with_app_recipe(), overlay);

    assert!(files.iter().any(|f| f.path == "css/conditions.ts"));
    assert!(files.iter().any(|f| f.path == "css/cx.ts"));
    assert!(!files.iter().any(|f| f.path == "helpers.ts"));

    let recipe_runtime = files
        .iter()
        .find(|f| f.path == "recipes/runtime.ts")
        .expect("recipes/runtime should still be emitted locally");
    assert!(recipe_runtime.code.contains("@acme/ui/helpers"));
    assert!(recipe_runtime.code.contains("../css/conditions"));
}
