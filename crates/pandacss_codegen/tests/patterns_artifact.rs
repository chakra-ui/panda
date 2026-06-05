use crate::common::{artifact, file, paths};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions, PatternCodegenMeta,
};
use pandacss_config::{
    CodegenFormat, PrimitiveType, TypeData, UserConfig, UtilityPropertyTypeData, UtilityTypeData,
    ValueAliasTypeData, ValueTypePart,
};
use std::collections::BTreeMap;

fn config() -> UserConfig {
    serde_json::from_value(serde_json::json!({
        "patterns": {
            "stack": {
                "defaultValues": { "gap": "4" },
                "properties": {
                    "align": { "property": "alignItems", "description": "Align items" },
                    "direction": { "property": "flexDirection" },
                    "gap": { "property": "gap" },
                    "justify": { "property": "justifyContent" }
                }
            }
        }
    }))
    .expect("config should deserialize")
}

fn input() -> CodegenInput {
    let config = config();
    let mut patterns = BTreeMap::new();
    patterns.insert(
        "stack".into(),
        PatternCodegenMeta {
            config_source: indoc! {r#"
            {
              transform(props, helpers) {
                return {
                  display: "flex",
                  gap: props.gap,
                  alignItems: props.align,
                  flexDirection: props.direction,
                  justifyContent: props.justify,
                }
              },
              defaultValues: {"gap":"4"}
            }
            "#}
            .trim()
            .into(),
        },
    );

    CodegenInput {
        types: type_data(&config),
        config,
        patterns,
        ..CodegenInput::default()
    }
}

fn type_data(config: &UserConfig) -> TypeData {
    TypeData {
        patterns: config.pattern_type_data(),
        utilities: utility_type_data(),
        ..TypeData::default()
    }
}

fn utility_type_data() -> UtilityTypeData {
    let string_value = ValueAliasTypeData {
        name: "StringValue".into(),
        parts: vec![
            ValueTypePart::Primitive(PrimitiveType::String),
            ValueTypePart::CssVars,
            ValueTypePart::AnyString,
        ],
    };

    let spacing_value = ValueAliasTypeData {
        name: "SpacingValue".into(),
        parts: vec![
            ValueTypePart::TokenCategory("spacing".into()),
            ValueTypePart::CssProperty("gap".into()),
            ValueTypePart::CssVars,
            ValueTypePart::AnyString,
            ValueTypePart::AnyNumber,
        ],
    };

    let properties = ["alignItems", "flexDirection", "justifyContent"]
        .into_iter()
        .map(|name| {
            (
                name.to_owned(),
                UtilityPropertyTypeData {
                    name: name.to_owned(),
                    css_property: Some(name.to_owned()),
                    alias: "StringValue".into(),
                    ..UtilityPropertyTypeData::default()
                },
            )
        })
        .chain(std::iter::once((
            "gap".into(),
            UtilityPropertyTypeData {
                name: "gap".into(),
                css_property: Some("gap".into()),
                token_category: Some("spacing".into()),
                alias: "SpacingValue".into(),
                ..UtilityPropertyTypeData::default()
            },
        )))
        .collect();

    UtilityTypeData {
        properties,
        aliases: BTreeMap::from([
            ("SpacingValue".into(), spacing_value),
            ("StringValue".into(), string_value),
        ]),
        ..UtilityTypeData::default()
    }
}

#[test]
fn emits_ts_source() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        paths(patterns),
        vec![
            "patterns/runtime.ts",
            "patterns/stack.ts",
            "patterns/index.ts"
        ]
    );
    assert_snapshot!(file(patterns, "patterns/runtime.ts"), @r#"
    import { mapObject, withDefaults } from '../helpers';

    export function isCssFunction(v: unknown): boolean {
      return typeof v === "string" && /^(min|max|clamp|calc)\(.*\)/.test(v)
    }

    export function isCssVar(v: unknown): boolean {
      return typeof v === "string" && /^var\(--.+\)$/.test(v)
    }

    export function isCssUnit(v: unknown): boolean {
      return typeof v === "string" && /^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?(?:cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/.test(v)
    }

    export const patternFns: Record<string, (...args: any[]) => any> = { map: mapObject, isCssFunction, isCssVar, isCssUnit }

    export function getPatternStyles(pattern: Record<string, any>, styles: Record<string, any>): Record<string, any> {
      if (!pattern?.defaultValues) return styles
      const defaults = typeof pattern.defaultValues === "function" ? pattern.defaultValues(styles) : pattern.defaultValues
      return withDefaults(defaults, styles)
    }
    "#);
    assert_eq!(
        file(patterns, "patterns/stack.ts"),
        indoc! {r#"
        import { getPatternStyles, patternFns } from './runtime';
        import type { PatternRuntimeConfig } from '../types/pattern';
        import type { SystemProperties, SystemStyleObject } from '../types/system';

        const stackConfig: PatternRuntimeConfig<StackProperties> = {
          transform(props, helpers) {
            return {
              display: "flex",
              gap: props.gap,
              alignItems: props.align,
              flexDirection: props.direction,
              justifyContent: props.justify,
            }
          },
          defaultValues: {"gap":"4"}
        }

        export interface StackProperties {
          /**
           * Align items
           */
          align?: SystemProperties["alignItems"]
          direction?: SystemProperties["flexDirection"]
          gap?: SystemProperties["gap"]
          justify?: SystemProperties["justifyContent"]
          className?: string
        }

        type StackRestStyles = Omit<SystemStyleObject, keyof StackProperties>

        interface StackStyles extends StackProperties, StackRestStyles {}

        interface StackPatternFn {
          (styles?: StackStyles): SystemStyleObject
          raw: (styles?: StackStyles) => SystemStyleObject
        }

        export function stackRaw(styles?: StackStyles): SystemStyleObject {
          const s = getPatternStyles(stackConfig, styles || {})
          return stackConfig.transform(s, patternFns)
        }

        export const stack: StackPatternFn = Object.assign(function stack(styles = {}) {
          return stackRaw(styles)
        }, { raw: stackRaw })
        "#}
        .trim()
    );
    assert_eq!(
        file(patterns, "patterns/index.ts"),
        indoc! {r"
        export * from './stack';
        "}
        .trim()
    );
}

#[test]
fn emits_js_runtime_and_declarations() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Js,
            import_extensions: false,
        },
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        paths(patterns),
        vec![
            "patterns/runtime.js",
            "patterns/stack.js",
            "patterns/stack.d.ts",
            "patterns/index.js",
            "patterns/index.d.ts"
        ]
    );
    assert_snapshot!(file(patterns, "patterns/runtime.js"), @r#"
    import { mapObject, withDefaults } from '../helpers';

    export function isCssFunction(v) {
      return typeof v === "string" && /^(min|max|clamp|calc)\(.*\)/.test(v)
    }

    export function isCssVar(v) {
      return typeof v === "string" && /^var\(--.+\)$/.test(v)
    }

    export function isCssUnit(v) {
      return typeof v === "string" && /^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?(?:cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/.test(v)
    }

    export const patternFns = { map: mapObject, isCssFunction, isCssVar, isCssUnit }

    export function getPatternStyles(pattern, styles) {
      if (!pattern?.defaultValues) return styles
      const defaults = typeof pattern.defaultValues === "function" ? pattern.defaultValues(styles) : pattern.defaultValues
      return withDefaults(defaults, styles)
    }
    "#);
    assert_eq!(
        file(patterns, "patterns/stack.js"),
        indoc! {r#"
        import { getPatternStyles, patternFns } from './runtime';

        const stackConfig = {
          transform(props, helpers) {
            return {
              display: "flex",
              gap: props.gap,
              alignItems: props.align,
              flexDirection: props.direction,
              justifyContent: props.justify,
            }
          },
          defaultValues: {"gap":"4"}
        }

        export function stackRaw(styles) {
          const s = getPatternStyles(stackConfig, styles || {})
          return stackConfig.transform(s, patternFns)
        }

        export const stack = Object.assign(function stack(styles = {}) {
          return stackRaw(styles)
        }, { raw: stackRaw })
        "#}
        .trim()
    );
    assert_eq!(
        file(patterns, "patterns/stack.d.ts"),
        indoc! {r#"
        import type { PatternRuntimeConfig } from '../types/pattern';
        import type { SystemProperties, SystemStyleObject } from '../types/system';

        export interface StackProperties {
          /**
           * Align items
           */
          align?: SystemProperties["alignItems"]
          direction?: SystemProperties["flexDirection"]
          gap?: SystemProperties["gap"]
          justify?: SystemProperties["justifyContent"]
          className?: string
        }

        type StackRestStyles = Omit<SystemStyleObject, keyof StackProperties>

        interface StackStyles extends StackProperties, StackRestStyles {}

        interface StackPatternFn {
          (styles?: StackStyles): SystemStyleObject
          raw: (styles?: StackStyles) => SystemStyleObject
        }

        export declare function stackRaw(styles?: StackStyles): SystemStyleObject;

        export declare const stack: StackPatternFn;
        "#}
        .trim()
    );
}

#[test]
fn can_emit_import_extensions() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            import_extensions: true,
        },
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        file(patterns, "patterns/stack.mjs"),
        indoc! {r#"
        import { getPatternStyles, patternFns } from './runtime.mjs';

        const stackConfig = {
          transform(props, helpers) {
            return {
              display: "flex",
              gap: props.gap,
              alignItems: props.align,
              flexDirection: props.direction,
              justifyContent: props.justify,
            }
          },
          defaultValues: {"gap":"4"}
        }

        export function stackRaw(styles) {
          const s = getPatternStyles(stackConfig, styles || {})
          return stackConfig.transform(s, patternFns)
        }

        export const stack = Object.assign(function stack(styles = {}) {
          return stackRaw(styles)
        }, { raw: stackRaw })
        "#}
        .trim()
    );
    assert_eq!(
        file(patterns, "patterns/index.mjs"),
        indoc! {r"
        export * from './stack.mjs';
        "}
        .trim()
    );
    assert_eq!(
        file(patterns, "patterns/index.d.mts"),
        indoc! {r"
        export * from './stack.d.mts';
        "}
        .trim()
    );
}
