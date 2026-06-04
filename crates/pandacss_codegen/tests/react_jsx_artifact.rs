mod common;

use common::{artifact, file, paths};
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::UserConfig;

fn react_config() -> UserConfig {
    serde_json::from_value(serde_json::json!({
        "jsxFramework": "react",
        "jsxFactory": "panda",
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "jsxElement": "section",
                "properties": {
                    "gap": { "property": "gap" },
                    "direction": { "property": "flexDirection" }
                }
            }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        }
                    }
                }
            },
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root", "label"],
                    "variants": {
                        "tone": {
                            "neutral": {
                                "root": { "background": "gray" },
                                "label": { "color": "black" }
                            }
                        }
                    }
                }
            }
        }
    }))
    .expect("config should deserialize")
}

#[test]
fn emits_react_jsx_artifacts() {
    let artifacts = ArtifactGraph.generate_with_config(&react_config(), GenerateOptions::default());

    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxIsValidProp)),
        vec!["jsx/is-valid-prop.mjs", "jsx/is-valid-prop.d.mts"]
    );
    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxFactory)),
        vec!["jsx/factory.mjs", "jsx/factory.d.mts"]
    );
    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxPatterns)),
        vec!["jsx/stack.mjs", "jsx/stack.d.mts"]
    );
    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxCreateRecipeContext)),
        vec![
            "jsx/create-recipe-context.mjs",
            "jsx/create-recipe-context.d.mts"
        ]
    );
    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxCreateSlotRecipeContext)),
        vec![
            "jsx/create-slot-recipe-context.mjs",
            "jsx/create-slot-recipe-context.d.mts"
        ]
    );
    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::JsxIndex)),
        vec!["jsx/index.mjs", "jsx/index.d.mts"]
    );
    assert_eq!(
        paths(artifact(&artifacts, ArtifactId::Types)),
        vec![
            "types/tokens.d.mts",
            "types/system.d.mts",
            "types/pattern.d.mts",
            "types/recipe.d.mts",
            "types/jsx.d.mts",
            "types/index.d.mts"
        ]
    );
}

#[test]
fn react_jsx_index_exports_split_context_helpers_only() {
    let artifacts = ArtifactGraph.generate_with_config(&react_config(), GenerateOptions::default());
    let index = file(artifact(&artifacts, ArtifactId::JsxIndex), "jsx/index.mjs");

    assert!(index.contains("export * from './factory'"));
    assert!(index.contains("export * from './create-recipe-context'"));
    assert!(index.contains("export * from './create-slot-recipe-context'"));
    assert!(index.contains("export * from './stack'"));
    assert!(!index.contains("create-style-context"));
    assert!(!index.contains("createStyleContext"));
}

#[test]
fn react_runtime_modules_are_client_boundaries() {
    let artifacts = ArtifactGraph.generate_with_config(&react_config(), GenerateOptions::default());

    for (artifact_id, path) in [
        (ArtifactId::JsxFactory, "jsx/factory.mjs"),
        (
            ArtifactId::JsxCreateRecipeContext,
            "jsx/create-recipe-context.mjs",
        ),
        (
            ArtifactId::JsxCreateSlotRecipeContext,
            "jsx/create-slot-recipe-context.mjs",
        ),
        (ArtifactId::JsxIndex, "jsx/index.mjs"),
        (ArtifactId::JsxPatterns, "jsx/stack.mjs"),
    ] {
        let code = file(artifact(&artifacts, artifact_id), path);
        assert!(code.starts_with("\"use client\";"));
    }
}

#[test]
fn create_recipe_context_delegates_to_factory() {
    let artifacts = ArtifactGraph.generate_with_config(&react_config(), GenerateOptions::default());
    let code = file(
        artifact(&artifacts, ArtifactId::JsxCreateRecipeContext),
        "jsx/create-recipe-context.mjs",
    );

    assert!(code.contains("import * as recipes from '../recipes/index'"));
    assert!(code.contains("import { getDisplayName } from './factory'"));
    assert!(code.contains("const StyledComponent = panda(Component, recipe, options)"));
    assert!(code.contains("Object.assign({}, propsContext, inProps)"));
    assert!(!code.contains("createStyleContext"));
}

#[test]
fn create_slot_recipe_context_preserves_style_prop_modes() {
    let mut config = react_config();
    config.jsx_style_props = Some(pandacss_config::JsxStylePropsConfig::Minimal);
    let artifacts = ArtifactGraph.generate_with_config(&config, GenerateOptions::default());
    let code = file(
        artifact(&artifacts, ArtifactId::JsxCreateSlotRecipeContext),
        "jsx/create-slot-recipe-context.mjs",
    );

    assert!(code.contains("css.raw(slotStyles, restProps.css)"));
    assert!(code.contains("const StyledComponent = panda(Component, {}, options)"));
    assert!(!code.contains("createStyleContext"));
}

#[test]
fn react_types_include_jsx_factory_surface() {
    let artifacts = ArtifactGraph.generate_with_config(&react_config(), GenerateOptions::default());
    let jsx = file(artifact(&artifacts, ArtifactId::Types), "types/jsx.d.mts");
    let index = file(artifact(&artifacts, ArtifactId::Types), "types/index.d.mts");

    assert!(jsx.contains("export type HTMLPandaProps<T extends ElementType>"));
    assert!(jsx.contains("export type Panda = JsxFactory & JsxElements"));
    assert!(jsx.contains("export type StyledVariantProps"));
    assert!(jsx.contains("T extends keyof JSX.IntrinsicElements"));
    assert!(jsx.contains("ComponentProps<T> & UnstyledProps & AsProps & DataAttrs"));
    assert!(!jsx.contains("ComponentPropsWithRef"));
    assert!(!jsx.contains("LibraryManagedAttributes"));
    assert!(index.contains("export * from './jsx'"));
}

#[test]
fn factory_owns_jsx_helpers() {
    let artifacts = ArtifactGraph.generate_with_config(&react_config(), GenerateOptions::default());
    let code = file(
        artifact(&artifacts, ArtifactId::JsxFactory),
        "jsx/factory.mjs",
    );

    assert!(code.contains("const defaultShouldForwardProp ="));
    assert!(code.contains("const composeShouldForwardProps ="));
    assert!(code.contains("const composeCvaFn ="));
    assert!(code.contains("export const getDisplayName ="));
    assert!(!code.contains("factory-helper"));
}
