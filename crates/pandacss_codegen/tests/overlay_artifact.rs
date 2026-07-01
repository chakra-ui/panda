use crate::common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, CodegenInput, CodegenOverlay, GenerateOptions};
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
    assert!(!artifact(&artifacts, ArtifactId::JsxFactory).files.is_empty());

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

    assert_eq!(paths(artifact(&artifacts, ArtifactId::JsxPatterns)), vec!["jsx/stack.ts"]);
    let index = file(artifact(&artifacts, ArtifactId::JsxIndex), "jsx/index.ts");
    assert!(index.contains("export * from './stack';"));
    assert!(!index.contains("@ds/jsx/stack"));
}
