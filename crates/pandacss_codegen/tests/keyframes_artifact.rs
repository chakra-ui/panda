use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::CodegenFormat;

#[test]
fn emits_ts_source_keyframes() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    let kf = artifact(&artifacts, ArtifactId::Keyframes);

    assert_eq!(paths(kf), vec!["css/keyframes.ts"]);
    assert_snapshot!(file(kf, "css/keyframes.ts"), @"
    import { stableStringify, toHash } from '../helpers';
    import type { CssKeyframes } from '../types/system';

    export type KeyframesFn = (keyframe: CssKeyframes[string]) => string;

    export const keyframes: KeyframesFn = (keyframe) => {
      const prefix = null
      const wrap = (base) => (prefix ? prefix + '-' + base : base)
      const block = keyframe && typeof keyframe === 'object' ? keyframe : {}
      return wrap('kf_' + toHash(stableStringify(block)))
    }
    ");
}
