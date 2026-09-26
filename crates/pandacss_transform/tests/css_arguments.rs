//! Multi-argument `css()` calls and constant ternaries in the source transform.

use pandacss_project::Project;
use pandacss_system::System;
use pandacss_transform::{TransformOptions, TransformOutput, transform_source};
use serde_json::json;

use crate::common::create_config;

fn project_with_config(overrides: serde_json::Value) -> Project {
    Project::new(System::new(create_config(overrides)).expect("config"))
}

fn transform_css(source: &str) -> TransformOutput {
    let project = project_with_config(json!({
        "utilities": {
            "color": { "className": "c" },
            "padding": { "className": "p" },
            "width": { "className": "w" }
        }
    }));
    transform_source(
        project.system(),
        "file.ts",
        source,
        &TransformOptions::default(),
    )
}

#[test]
fn dynamic_prop_in_the_last_css_argument_stays_in_a_runtime_call() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: 'red' }, { width: props.width, padding: '4px' });",
    );
    assert!(output.changed, "{}", output.code);
    assert!(output.code.contains("css({ width: props.width })"));
    assert!(output.code.contains("__pcx"));
}

#[test]
fn dynamic_prop_in_the_first_css_argument_stays_in_a_runtime_call() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ width: props.width }, { color: 'red' });",
    );
    assert!(output.changed, "{}", output.code);
    assert!(output.code.contains("css({ width: props.width })"));
    assert!(output.code.contains("__pcx"));
}

#[test]
fn identical_ternary_arms_still_evaluate_a_member_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: state.ready ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("state.ready"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn identical_ternary_arms_still_evaluate_a_call_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: readReady() ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("readReady()"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn identical_ternary_arms_still_evaluate_an_undeclared_identifier_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: missing ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("missing"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn identical_ternary_arms_still_evaluate_a_negated_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: !state.ready ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("!state.ready"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn conditional_first_css_argument_lowers_with_the_static_second_argument() {
    let output = transform_css(
        "import { css } from '@panda/css'; const cls = css({color: state.ready ? 'red' : 'blue'}, {padding: '4px'});",
    );
    assert!(output.changed);
    assert_eq!(
        output.code.trim(),
        "const cls = (state.ready ? \"c_red\" : \"c_blue\") + \" \" + \"p_4px\";"
    );
}
