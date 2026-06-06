use crate::common::{artifact, file, paths};
use indoc::indoc;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
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
            },
            "containers": {
                "md": "32rem"
            },
            "containerNames": ["card"]
        }
    }))
    .expect("valid config");

    let artifacts = graph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let conditions = artifact(&artifacts, ArtifactId::Conditions);
    assert_eq!(paths(conditions), vec!["css/conditions.ts"]);
    assert_eq!(
        file(conditions, "css/conditions.ts"),
        indoc! {r#"
        import { withoutSpace } from '../helpers';

        const conditions = new Set("@/md,@/mdDown,@/mdOnly,@card/md,@card/mdDown,@card/mdOnly,_hover,_supportsGrid,base,md,mdDown,mdOnly,sm,smDown,smOnly,smToMd".split(','))
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
            import_extensions: false,
        },
    );
    let conditions = artifact(&artifacts, ArtifactId::Conditions);
    assert_eq!(
        paths(conditions),
        vec!["css/conditions.js", "css/conditions.d.ts"]
    );
    assert_eq!(
        file(conditions, "css/conditions.js"),
        indoc! {r#"
        import { withoutSpace } from '../helpers';

        const conditions = new Set("_hover,_supportsGrid,base,md,mdDown,mdOnly,sm,smDown,smOnly,smToMd".split(','))
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
        file(conditions, "css/conditions.d.ts"),
        indoc! {r"
        export declare function isCondition(v: string): boolean;

        export declare function finalizeConditions(paths: string[]): string[];

        export declare function sortConditions(paths: string[]): string[];
        "}
        .trim()
    );
}

#[test]
fn can_emit_import_extensions() {
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
            import_extensions: true,
        },
    );
    let conditions = artifact(&artifacts, ArtifactId::Conditions);

    assert_eq!(
        file(conditions, "css/conditions.js")
            .lines()
            .next()
            .expect("import line"),
        "import { withoutSpace } from '../helpers.js';"
    );
    assert!(!file(conditions, "css/conditions.d.ts").contains("../types/system"));
}
