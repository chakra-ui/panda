use crate::common::{artifact, file, paths};
use insta::assert_snapshot;
use pandacss_codegen::{ArtifactGraph, ArtifactId, GenerateOptions};
use pandacss_config::{CodegenFormat, PrefixConfig, UserConfig};
use serde_json::json;

#[test]
fn emits_ts_source_view_transition() {
    let artifacts = ArtifactGraph.generate(GenerateOptions {
        format: CodegenFormat::Ts,
        import_extensions: false,
    });
    let vt = artifact(&artifacts, ArtifactId::ViewTransition);

    assert_eq!(paths(vt), vec!["css/view-transition.ts"]);
    assert_snapshot!(file(vt, "css/view-transition.ts"), @"
    import { stableStringify, toHash } from '../helpers';
    import type { SystemStyleObject } from '../types/system';

    export type ViewTransitionStyleObject = { group?: SystemStyleObject; imagePair?: SystemStyleObject; old?: SystemStyleObject; new?: SystemStyleObject };

    export type ViewTransitionFn = (options: ViewTransitionStyleObject) => string;

    export const viewTransition: ViewTransitionFn = (options) => {
      const prefix = null
      if (typeof options === 'string') {
        const base = 'vt_' + options
        return prefix ? prefix + '-' + base : base
      }
      const slots = ['group', 'imagePair', 'old', 'new']
      const filtered = {}
      if (options && typeof options === 'object') {
        for (const key of slots) {
          if (key in options) filtered[key] = options[key]
        }
      }
      const base = 'vt_' + toHash(stableStringify(filtered))
      return prefix ? prefix + '-' + base : base
    }
    ");
}

#[test]
fn emits_prefixed_view_transition_runtime() {
    let config = UserConfig {
        prefix: PrefixConfig::String("p".into()),
        ..Default::default()
    };
    let artifacts = ArtifactGraph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let vt = artifact(&artifacts, ArtifactId::ViewTransition);
    assert_snapshot!(file(vt, "css/view-transition.ts"), @r#"
    import { stableStringify, toHash } from '../helpers';
    import type { SystemStyleObject } from '../types/system';

    export type ViewTransitionStyleObject = { group?: SystemStyleObject; imagePair?: SystemStyleObject; old?: SystemStyleObject; new?: SystemStyleObject };

    export type ViewTransitionFn = (options: ViewTransitionStyleObject) => string;

    export const viewTransition: ViewTransitionFn = (options) => {
      const prefix = "p"
      if (typeof options === 'string') {
        const base = 'vt_' + options
        return prefix ? prefix + '-' + base : base
      }
      const slots = ['group', 'imagePair', 'old', 'new']
      const filtered = {}
      if (options && typeof options === 'object') {
        for (const key of slots) {
          if (key in options) filtered[key] = options[key]
        }
      }
      const base = 'vt_' + toHash(stableStringify(filtered))
      return prefix ? prefix + '-' + base : base
    }
    "#);
}

#[test]
fn types_named_theme_bags_on_view_transition_fn() {
    let mut config = UserConfig::default();
    config.theme.view_transitions.insert(
        "slide".into(),
        json!({ "old": { "opacity": 0 }, "new": { "opacity": 1 } }),
    );
    config.theme.view_transitions.insert(
        "fade".into(),
        json!({ "old": { "opacity": 1 }, "new": { "opacity": 0 } }),
    );
    let artifacts = ArtifactGraph.generate_with_config(
        &config,
        GenerateOptions {
            format: CodegenFormat::Ts,
            import_extensions: false,
        },
    );
    let vt = artifact(&artifacts, ArtifactId::ViewTransition);
    let source = file(vt, "css/view-transition.ts");
    assert!(source.contains(
        "export type ViewTransitionFn = (options: ViewTransitionStyleObject | \"fade\" | \"slide\") => string;"
    ));
}
