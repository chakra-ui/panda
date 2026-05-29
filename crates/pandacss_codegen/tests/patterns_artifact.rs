mod common;

use common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{
    ArtifactGraph, ArtifactId, CodegenInput, GenerateOptions, ModuleSpecifierPolicy,
    PatternCodegenMeta,
};
use pandacss_config::{CodegenFormat, UserConfig};
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
        config: config(),
        patterns,
    }
}

#[test]
fn emits_ts_source() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Ts,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        paths(patterns),
        vec!["patterns/stack.ts", "patterns/index.ts"]
    );
    assert_eq!(
        file(patterns, "patterns/stack.ts"),
        indoc! {r#"
        import { getPatternStyles, patternFns } from '../helpers';

        const stackConfig: Record<string, any> = {
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
          align?: any
          direction?: any
          gap?: any
          justify?: any
          className?: string
        }

        interface StackStyles extends StackProperties, Record<string, any> {}

        interface StackPatternFn {
          (styles?: StackStyles): Record<string, any>
          raw: (styles?: StackStyles) => Record<string, any>
        }

        export function stackRaw(styles?: StackProperties): Record<string, any> {
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
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        paths(patterns),
        vec![
            "patterns/stack.js",
            "patterns/stack.d.ts",
            "patterns/index.js",
            "patterns/index.d.ts"
        ]
    );
    assert_eq!(
        file(patterns, "patterns/stack.js"),
        indoc! {r#"
        import { getPatternStyles, patternFns } from '../helpers';

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
        indoc! {r"
        export interface StackProperties {
          /**
           * Align items
           */
          align?: any
          direction?: any
          gap?: any
          justify?: any
          className?: string
        }

        interface StackStyles extends StackProperties, Record<string, any> {}

        interface StackPatternFn {
          (styles?: StackStyles): Record<string, any>
          raw: (styles?: StackStyles) => Record<string, any>
        }

        export declare function stackRaw(styles?: StackProperties): Record<string, any>;

        export declare const stack: StackPatternFn;
        "}
        .trim()
    );
}

#[test]
fn can_emit_extensioned_specifiers() {
    let graph = ArtifactGraph;
    let artifacts = graph.generate_with_input(
        &input(),
        GenerateOptions {
            format: CodegenFormat::Mjs,
            specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
        },
    );
    let patterns = artifact(&artifacts, ArtifactId::Patterns);

    assert_eq!(
        file(patterns, "patterns/stack.mjs"),
        indoc! {r#"
        import { getPatternStyles, patternFns } from '../helpers.mjs';

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
