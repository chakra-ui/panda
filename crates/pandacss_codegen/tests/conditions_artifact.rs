mod common;

use common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions, ModuleSpecifierPolicy};
use pandacss_config::CodegenFormat;
use serde_json::json;

#[test]
fn uses_config_conditions_and_breakpoints_for_ts_source() {
    let graph = ArtifactGraph;
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "conditions": {
            "hover": "&:hover",
            "supportsGrid": "@supports (display: grid)"
        },
        "theme": {
            "breakpoints": {
                "md": "768px",
                "sm": "640px"
            }
        }
    }))
    .expect("valid config");

    let artifacts = graph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Ts,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );
    let conditions = artifact(&artifacts, ArtifactId::Conditions);
    assert_eq!(paths(conditions), vec!["conditions.ts"]);
    assert_eq!(
        file(conditions, "conditions.ts"),
        indoc! {r#"
        import { withoutSpace } from '../helpers';

        import type { AnySelector, Selectors } from './selectors';

        const conditions = new Set("_hover,_supportsGrid,base,md,sm".split(','))
        const conditionRe = /^@|&/
        const underscoreRe = /^_/
        const selectorRe = /&|@/

        export function isCondition(v: string): boolean {
          return conditions.has(v) || conditionRe.test(v)
        }

        export function finalizeConditions(paths: string[]): string[] {
          return paths.map((p) => {
            if (conditions.has(p)) {
              return p.replace(underscoreRe, '')
            }
            if (selectorRe.test(p)) {
              return `[${withoutSpace(p.trim())}]`
            }
            return p
          })
        }

        export function sortConditions(paths: string[]): string[] {
          return paths.sort((a, b) => {
            const aa = isCondition(a)
            const bb = isCondition(b)
            return aa && !bb ? 1 : !aa && bb ? -1 : 0
          })
        }

        export interface Conditions {
          /**
           * `&:hover`
           */
          "_hover": string
          /**
           * `@supports (display: grid)`
           */
          "_supportsGrid": string
          /**
           * The base (=no conditions) styles to apply 
           */
          "base": string
          "md": string
          "sm": string
        }

        export type ConditionalValue<V> =
          | V
          | Array<V | null>
          | {
              [K in keyof Conditions]?: ConditionalValue<V>
            }

        export type Nested<P> = P & {
          [K in Selectors]?: Nested<P>
        } & {
          [K in AnySelector]?: Nested<P>
        } & {
          [K in keyof Conditions]?: Nested<P>
        }
        "#}
        .trim()
    );
}

#[test]
fn emits_js_runtime_and_declarations() {
    let graph = ArtifactGraph;
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "conditions": {
            "hover": "&:hover",
            "supportsGrid": "@supports (display: grid)"
        },
        "theme": {
            "breakpoints": {
                "md": "768px",
                "sm": "640px"
            }
        }
    }))
    .expect("valid config");

    let artifacts = graph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Js,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );
    let conditions = artifact(&artifacts, ArtifactId::Conditions);
    assert_eq!(paths(conditions), vec!["conditions.js", "conditions.d.ts"]);
    assert_eq!(
        file(conditions, "conditions.js"),
        indoc! {r#"
        import { withoutSpace } from '../helpers';

        const conditions = new Set("_hover,_supportsGrid,base,md,sm".split(','))
        const conditionRe = /^@|&/
        const underscoreRe = /^_/
        const selectorRe = /&|@/

        export function isCondition(v) {
          return conditions.has(v) || conditionRe.test(v)
        }

        export function finalizeConditions(paths) {
          return paths.map((p) => {
            if (conditions.has(p)) {
              return p.replace(underscoreRe, '')
            }
            if (selectorRe.test(p)) {
              return `[${withoutSpace(p.trim())}]`
            }
            return p
          })
        }

        export function sortConditions(paths) {
          return paths.sort((a, b) => {
            const aa = isCondition(a)
            const bb = isCondition(b)
            return aa && !bb ? 1 : !aa && bb ? -1 : 0
          })
        }
        "#}
        .trim()
    );
    assert_eq!(
        file(conditions, "conditions.d.ts"),
        indoc! {r#"
        import type { AnySelector, Selectors } from './selectors';

        export declare function isCondition(v: string): boolean;

        export declare function finalizeConditions(paths: string[]): string[];

        export declare function sortConditions(paths: string[]): string[];

        export interface Conditions {
          /**
           * `&:hover`
           */
          "_hover": string
          /**
           * `@supports (display: grid)`
           */
          "_supportsGrid": string
          /**
           * The base (=no conditions) styles to apply 
           */
          "base": string
          "md": string
          "sm": string
        }

        export type ConditionalValue<V> =
          | V
          | Array<V | null>
          | {
              [K in keyof Conditions]?: ConditionalValue<V>
            }

        export type Nested<P> = P & {
          [K in Selectors]?: Nested<P>
        } & {
          [K in AnySelector]?: Nested<P>
        } & {
          [K in keyof Conditions]?: Nested<P>
        }
        "#}
        .trim()
    );
}

#[test]
fn can_emit_extensioned_specifiers() {
    let graph = ArtifactGraph;
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "conditions": {
            "hover": "&:hover"
        }
    }))
    .expect("valid config");

    let artifacts = graph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Js,
            specifiers: ModuleSpecifierPolicy::RuntimeAndTypes,
        },
    );
    let conditions = artifact(&artifacts, ArtifactId::Conditions);

    assert_eq!(
        file(conditions, "conditions.js")
            .lines()
            .next()
            .expect("import line"),
        "import { withoutSpace } from '../helpers.js';"
    );
    assert_eq!(
        file(conditions, "conditions.d.ts")
            .lines()
            .next()
            .expect("import line"),
        "import type { AnySelector, Selectors } from './selectors.d.ts';"
    );
}
