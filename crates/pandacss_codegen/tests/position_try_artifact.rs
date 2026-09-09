use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::{CodegenFormat, UserConfig};
use serde_json::json;

#[test]
fn emits_ts_source_position_try() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    let pt = artifact(&artifacts, ArtifactId::PositionTry);

    assert_eq!(paths(pt), vec!["css/position-try.ts"]);
    assert_snapshot!(file(pt, "css/position-try.ts"), @"
    import { stableStringify, toHash } from '../helpers';
    import type { SystemStyleObject } from '../types/system';

    export type PositionTryFn = (options: SystemStyleObject) => string;

    export const positionTry: PositionTryFn = (options) => {
      const prefix = null
      const wrap = (base) => '--' + (prefix ? prefix + '-' + base : base)
      if (typeof options === 'string') {
        return wrap('pt_' + options)
      }
      const block = options && typeof options === 'object' ? options : {}
      return wrap('pt_' + toHash(stableStringify(block)))
    }
    ");
}

#[test]
fn types_named_theme_bags_on_position_try_fn() {
    let mut config = UserConfig::default();
    config
        .theme
        .position_try
        .insert("bottom".into(), json!({ "top": "anchor(bottom)" }));
    config
        .theme
        .position_try
        .insert("top".into(), json!({ "bottom": "anchor(top)" }));
    let artifacts = ArtifactGraph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let pt = artifact(&artifacts, ArtifactId::PositionTry);
    let source = file(pt, "css/position-try.ts");
    assert!(source.contains(
        "export type PositionTryFn = (options: SystemStyleObject | \"bottom\" | \"top\") => string;"
    ));
}
