use super::common::{
    create_config, patterns_only_options, project_with_pattern, transform_jsx_patterns,
    transform_patterns, transform_with_project,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_extractor::{Diagnostic, Literal};
use pandacss_project::{ParseTransforms, Project, System};
use pandacss_project::{TransformOptions, transform_source};
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
fn rewrites_pattern_with_multiple_mapped_properties() {
    let source = indoc! {r#"
        import { grid } from '@panda/patterns';
        export const cls = grid({ gap: '2', columnGap: '4' });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "column-gap_4 gap_2";"#);
}

#[test]
fn rewrites_pattern_call_with_condition_value() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: { base: '2px', _hover: '4px' } });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "padding_2px hover:padding_4px";"#);
}

#[test]
fn rewrites_two_pattern_calls_in_one_file() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const a = box({ padding: '2px' });
        export const b = box({ padding: '8px' });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const a = "padding_2px";
    export const b = "padding_8px";
    "#);
}

#[test]
fn rewrites_pattern_jsx_element_to_intrinsic_tag() {
    let source = indoc! {r#"
        import { Stack } from '@panda/jsx';
        export const El = () => <Stack gap="3">hi</Stack>;
    "#};

    let output = transform_jsx_patterns("src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const El = () => <div className="gap_3">hi</div>;"#);
}

#[test]
fn leaves_pattern_call_with_dynamic_value_unchanged() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: props.value });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_pattern_with_js_transform_unchanged_without_callback() {
    let project = stack_project();
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
fn inlines_js_transform_pattern_when_transform_callback_is_supplied() {
    let project = stack_project();
    let source = indoc! {r#"
        import { stack } from '@panda/patterns';
        export const cls = stack({ gap: '4px' });
    "#};

    // Stand in for the JS pattern transform the binding layer supplies.
    let mut stack_transform =
        |_name: &str, styles: &Literal| -> Result<Option<Literal>, Diagnostic> {
            let mut out = vec![("display".to_string(), Literal::String("flex".to_string()))];
            if let Literal::Object(entries) = styles {
                for (key, value) in entries {
                    if key == "gap" {
                        out.push(("gap".to_string(), value.clone()));
                    }
                }
            }
            Ok(Some(Literal::Object(out)))
        };

    let output = project.transform_source_with(
        "src/layout.tsx",
        source,
        &TransformOptions {
            targets: patterns_only_options().targets,
            ..TransformOptions::default()
        },
        ParseTransforms {
            pattern: Some(&mut stack_transform),
            ..Default::default()
        },
    );

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "d_flex gap_4px";"#);
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

/// `stack` pattern requiring a JS transform, like preset-base `stack`/`hstack`.
fn stack_project() -> Project {
    Project::new(
        System::new(create_config(json!({
            "utilities": {
                "display": { "className": "d" },
                "gap": {}
            },
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
    )
}
