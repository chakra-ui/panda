use crate::common::{artifact, file, paths};
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::{CodegenFormat, CssSyntaxKind, JsxStylePropsConfig, UserConfig};

fn config(framework: &str, template_literal: bool) -> UserConfig {
    let mut config: UserConfig = serde_json::from_value(serde_json::json!({
        "jsxFramework": framework,
        "jsxFactory": "panda",
        "utilities": {
            "backgroundColor": { "className": "bg", "values": "colors" }
        },
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "jsxElement": "section",
                "properties": {
                    "gap": { "property": "gap" },
                    "direction": { "property": "flexDirection" }
                }
            }
        }
    }))
    .expect("config should deserialize");
    if template_literal {
        config.syntax = CssSyntaxKind::TemplateLiteral;
    }
    config
}

#[test]
fn emits_pattern_jsx_for_non_react_frameworks() {
    for (framework, import_marker, runtime_marker, type_marker) in [
        (
            "preact",
            "from 'preact';",
            "forwardRef(function Stack",
            "import type { FunctionComponent } from 'preact';",
        ),
        (
            "qwik",
            "from '@builder.io/qwik';",
            "function Stack(props)",
            "import type { Component } from '@builder.io/qwik';",
        ),
        (
            "solid",
            "from 'solid-js';",
            "createComponent(panda[\"section\"], mergedProps)",
            "import type { Component } from 'solid-js';",
        ),
        (
            "vue",
            "from 'vue';",
            "defineComponent({",
            "import type { FunctionalComponent } from 'vue';",
        ),
    ] {
        let artifacts = ArtifactGraph
            .generate_with_config(&config(framework, false), GenerateOptions::default());
        let patterns = artifact(&artifacts, ArtifactId::JsxPatterns);

        assert_eq!(paths(patterns), vec!["jsx/stack.mjs", "jsx/stack.d.mts"]);

        let code = file(patterns, "jsx/stack.mjs");
        let dts = file(patterns, "jsx/stack.d.mts");

        assert!(
            code.contains(import_marker),
            "{framework} pattern import missing"
        );
        assert!(
            code.contains(runtime_marker),
            "{framework} pattern runtime missing"
        );
        assert!(code.contains("stackRaw(patternProps)") || code.contains("stackRaw(props)"));
        assert!(!code.starts_with("\"use client\";"));
        assert!(
            dts.contains(type_marker),
            "{framework} pattern type import missing"
        );
        assert!(dts.contains("export declare const Stack"));
    }
}

#[test]
fn emits_recipe_contexts_for_supported_non_react_frameworks() {
    for (framework, recipe_import, recipe_marker, slot_marker, type_marker) in [
        (
            "preact",
            "from 'preact';",
            "forwardRef(function WithContext",
            "forwardRef(function WithProvider",
            "type ElementType = JSX.ElementType",
        ),
        (
            "solid",
            "from 'solid-js/web';",
            "createComponent(StyledComponent, props)",
            "createMemo(() =>",
            "MaybeAccessor",
        ),
        (
            "vue",
            "from 'vue';",
            "const PropsContext = Symbol('PropsContext')",
            "provide(SlotStylesContext, resolvedSlots)",
            "VModelProps",
        ),
    ] {
        let artifacts = ArtifactGraph
            .generate_with_config(&config(framework, false), GenerateOptions::default());
        let recipe = artifact(&artifacts, ArtifactId::JsxCreateRecipeContext);
        let slot_recipe = artifact(&artifacts, ArtifactId::JsxCreateSlotRecipeContext);
        let index = file(artifact(&artifacts, ArtifactId::JsxIndex), "jsx/index.mjs");

        assert_eq!(
            paths(recipe),
            vec![
                "jsx/create-recipe-context.mjs",
                "jsx/create-recipe-context.d.mts"
            ]
        );
        assert_eq!(
            paths(slot_recipe),
            vec![
                "jsx/create-slot-recipe-context.mjs",
                "jsx/create-slot-recipe-context.d.mts"
            ]
        );

        let recipe_code = file(recipe, "jsx/create-recipe-context.mjs");
        let slot_code = file(slot_recipe, "jsx/create-slot-recipe-context.mjs");
        let slot_dts = file(slot_recipe, "jsx/create-slot-recipe-context.d.mts");

        assert!(
            recipe_code.contains(recipe_import),
            "{framework} recipe context import missing"
        );
        assert!(
            recipe_code.contains(recipe_marker),
            "{framework} recipe context runtime missing"
        );
        assert!(
            slot_code.contains(slot_marker),
            "{framework} slot recipe context runtime missing"
        );
        assert!(
            slot_dts.contains(type_marker),
            "{framework} slot recipe context types missing"
        );
        assert!(recipe_code.contains("from './helper'"));
        assert!(slot_code.contains("from './helper'"));
        assert!(
            slot_code.contains("data-slot"),
            "{framework} slot recipe context data-slot missing"
        );
        assert!(index.contains("export * from './create-recipe-context'"));
        assert!(index.contains("export * from './create-slot-recipe-context'"));
        assert!(!recipe_code.starts_with("\"use client\";"));
        assert!(!slot_code.starts_with("\"use client\";"));
    }
}

#[test]
fn skips_recipe_contexts_for_qwik() {
    let artifacts =
        ArtifactGraph.generate_with_config(&config("qwik", false), GenerateOptions::default());
    let recipe = artifact(&artifacts, ArtifactId::JsxCreateRecipeContext);
    let slot_recipe = artifact(&artifacts, ArtifactId::JsxCreateSlotRecipeContext);
    let index = file(artifact(&artifacts, ArtifactId::JsxIndex), "jsx/index.mjs");

    assert!(paths(recipe).is_empty());
    assert!(paths(slot_recipe).is_empty());
    assert!(!index.contains("create-recipe-context"));
    assert!(!index.contains("create-slot-recipe-context"));
}

#[test]
fn non_react_slot_recipe_contexts_preserve_style_prop_modes() {
    for (framework, marker) in [
        ("preact", "css.raw(slotStyles, restProps.css)"),
        ("solid", "css.raw(slotStyles, restProps.css)"),
        ("vue", "css.raw(slotStyles, restProps.css)"),
    ] {
        let mut config = config(framework, false);
        config.jsx_style_props = Some(JsxStylePropsConfig::Minimal);
        let artifacts = ArtifactGraph.generate_with_config(&config, GenerateOptions::default());
        let code = file(
            artifact(&artifacts, ArtifactId::JsxCreateSlotRecipeContext),
            "jsx/create-slot-recipe-context.mjs",
        );

        assert!(
            code.contains(marker),
            "{framework} slot recipe context style prop mode missing"
        );
    }
}

#[test]
fn solid_slot_recipe_context_supports_function_default_props() {
    let artifacts =
        ArtifactGraph.generate_with_config(&config("solid", false), GenerateOptions::default());
    let code = file(
        artifact(&artifacts, ArtifactId::JsxCreateSlotRecipeContext),
        "jsx/create-slot-recipe-context.mjs",
    );

    assert!(code.contains("const createDefaultProps = (options) => {"));
    assert!(code.contains("const defaults = options?.defaultProps"));
    assert!(
        code.contains("typeof defaults === 'function' ? createMemo(defaults) : () => defaults")
    );
    assert!(code.contains("const propsWithClass = defaults ? { ...defaults, ...propsWithoutChildren } : propsWithoutChildren"));
    assert!(code.contains("const slots = resolvedSlots()"));
    assert!(code.contains("const resolved = resolveProps(propsWithClass, slots[slot])"));
    assert!(code.contains("return local.children ?? defaultProps()?.children"));
    assert!(code.contains("const forwardedProps = {}"));
    assert!(code.contains("Object.defineProperty(forwardedProps, key, { get: () => variantProps[key], enumerable: true })"));
    assert!(code.contains("mergeProps(resolvedProps, forwardedProps, {"));
    assert!(code.contains("if (!isConfigRecipe) styles._classNameMap = slotRecipeFn.classNameMap"));
    assert!(code.contains("resolved.class = cx(resolved.class, slots._classNameMap?.[slot])"));
    assert!(
        code.contains("resolved.class = cx(resolved.class, resolvedSlots._classNameMap?.[slot])")
    );
    assert!(!code.contains("options?.defaultProps?.class"));
}

#[test]
fn emits_object_jsx_factory_for_non_react_frameworks() {
    for (framework, import_marker, runtime_marker, type_marker) in [
        (
            "preact",
            "from 'preact';",
            "forwardRef(function PandaComponent",
            "import type { ComponentProps, JSX } from 'preact';",
        ),
        (
            "qwik",
            "from '@builder.io/qwik';",
            "function PandaComponent(props)",
            "import type { Component, QwikIntrinsicElements } from '@builder.io/qwik';",
        ),
        (
            "solid",
            "from 'solid-js';",
            "createComponent(",
            "import type { Accessor, Component, ComponentProps, JSX } from 'solid-js';",
        ),
        (
            "vue",
            "from 'vue';",
            "defineComponent({",
            "import type { Component, FunctionalComponent, NativeElements } from 'vue';",
        ),
    ] {
        let artifacts = ArtifactGraph
            .generate_with_config(&config(framework, false), GenerateOptions::default());
        let factory = artifact(&artifacts, ArtifactId::JsxFactory);
        let helper = artifact(&artifacts, ArtifactId::JsxHelper);
        let types = artifact(&artifacts, ArtifactId::Types);

        assert_eq!(paths(factory), vec!["jsx/factory.mjs", "jsx/factory.d.mts"]);
        assert_eq!(paths(helper), vec!["jsx/helper.mjs", "jsx/helper.d.mts"]);
        let code = file(factory, "jsx/factory.mjs");
        let helper_code = file(helper, "jsx/helper.mjs");
        let jsx = file(types, "types/jsx.d.mts");

        assert!(
            code.contains(import_marker),
            "{framework} factory import missing"
        );
        assert!(
            code.contains(runtime_marker),
            "{framework} runtime marker missing"
        );
        assert!(code.contains("from './helper'"));
        assert!(
            helper_code.contains("function splitJsxProps")
                || helper_code.contains("function splitStyleProps")
        );
        assert!(helper_code.contains("serializeSplitStyles"));
        assert!(code.contains("__getCompoundVariantClasses__"));
        assert!(jsx.contains(type_marker), "{framework} type import missing");
        assert!(jsx.contains("export type Panda = JsxFactory & JsxElements"));
    }
}

#[test]
fn emits_template_literal_jsx_factory_for_non_react_frameworks() {
    for (framework, import_marker, runtime_marker, type_marker) in [
        (
            "preact",
            "from 'preact';",
            "forwardRef(function PandaComponent",
            "(args: { raw: readonly string[] | ArrayLike<string> })",
        ),
        (
            "qwik",
            "from '@builder.io/qwik';",
            "const PandaComponent = (props) =>",
            "(args: { raw: readonly string[] | ArrayLike<string> })",
        ),
        (
            "solid",
            "from 'solid-js';",
            "createComponent(\n        Dynamic,",
            "(args: { raw: readonly string[] | ArrayLike<string> })",
        ),
        (
            "vue",
            "from 'vue';",
            "defineComponent({",
            "FunctionalComponent<ComponentPropsOf<T> & AsProps>",
        ),
    ] {
        let artifacts = ArtifactGraph
            .generate_with_config(&config(framework, true), GenerateOptions::default());
        let factory = artifact(&artifacts, ArtifactId::JsxFactory);
        let helper = artifact(&artifacts, ArtifactId::JsxHelper);
        let types = artifact(&artifacts, ArtifactId::Types);

        assert_eq!(paths(factory), vec!["jsx/factory.mjs", "jsx/factory.d.mts"]);
        assert_eq!(paths(helper), vec!["jsx/helper.mjs", "jsx/helper.d.mts"]);
        let code = file(factory, "jsx/factory.mjs");
        let helper_code = file(helper, "jsx/helper.mjs");
        let jsx = file(types, "types/jsx.d.mts");

        assert!(
            code.contains(import_marker),
            "{framework} template import missing"
        );
        assert!(
            code.contains(runtime_marker),
            "{framework} template runtime marker missing"
        );
        assert!(code.contains("const staticClassName = css(styles)"));
        assert!(code.contains("css.raw("));
        assert!(code.contains("from './helper'"));
        assert!(helper_code.contains("getDisplayName"));
        assert!(!helper_code.contains("splitJsxProps"));
        assert!(!code.contains("cva"));
        assert!(!code.contains("isCssProperty"));
        assert!(
            jsx.contains(type_marker),
            "{framework} template type marker missing"
        );
    }
}

#[test]
fn types_index_reexports_jsx_for_non_react_frameworks() {
    for framework in ["preact", "qwik", "solid", "vue"] {
        let artifacts = ArtifactGraph.generate_with_config(
            &config(framework, false),
            GenerateOptions {
                format: CodegenFormat::Ts,
                ..GenerateOptions::default()
            },
        );
        let types = artifact(&artifacts, ArtifactId::Types);

        assert!(
            file(types, "types/index.ts").contains("export type * from './jsx';"),
            "types/index.ts should re-export ./jsx for {framework}"
        );
    }
}
