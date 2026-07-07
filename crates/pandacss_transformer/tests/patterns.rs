use crate::common::{
    create_config, patterns_only_options, project_with_pattern, transform_patterns,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{Project, System};
use pandacss_transformer::{TransformOptions, transform_source};
use serde_json::json;

#[test]
fn rewrites_property_pattern_without_transform() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: '4px' });
    "#};

    let output = transform_patterns("src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "padding_4px";"#);
}

#[test]
fn leaves_pattern_with_js_transform_unchanged() {
    let project = Project::new(
        System::new(create_config(json!({
            "patterns": {
                "stack": {
                    "transform": { "kind": "js", "id": "stack" },
                    "properties": {
                        "gap": { "type": "property", "property": "gap" }
                    }
                }
            }
        })))
        .expect("config"),
    );
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const cls = stack({ gap: '4px' });
    "#};

    let output = transform_source(
        &project,
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: patterns_only_options().targets,
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn pattern_target_does_not_rewrite_css_calls() {
    let project = project_with_pattern();
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_source(
        &project,
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: patterns_only_options().targets,
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}
