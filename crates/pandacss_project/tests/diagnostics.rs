use crate::common::create_project;
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_encoder::AtomValue;
use pandacss_project::{Diagnostic, ParseTransforms};
use pandacss_shared::diagnostic_codes;
use serde_json::json;

fn summary(diagnostics: &[Diagnostic]) -> String {
    diagnostics
        .iter()
        .map(|diagnostic| {
            format!(
                "{:?} {} {}",
                diagnostic.severity, diagnostic.code, diagnostic.message
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn dynamic_call_argument_is_not_diagnosed_when_jsx_is_configured() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css(props.styles);
        "},
    );

    assert_snapshot!(summary(&report.diagnostics), @"");
}

#[test]
fn dynamic_call_argument_is_diagnosed_without_jsx_framework() {
    let mut project = create_project(json!({
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css(props.styles);
        "},
    );

    assert_snapshot!(summary(&report.diagnostics), @"Warning panda_call_unextractable Css call `css` received a dynamic argument, so no static CSS was generated for this call");
}

#[test]
fn utility_callback_failure_includes_target_context() {
    let mut project = create_project(json!({
        "utilities": {
            "color": {
                "className": "c",
                "transform": { "kind": "js-callback", "id": "color" }
            }
        }
    }));
    let mut transform = |_prop: &str, _value: &AtomValue| -> Result<_, Diagnostic> {
        Err(Diagnostic::warning(
            diagnostic_codes::TRANSFORM_CALLBACK_FAILED,
            "transform callback failed",
        ))
    };
    let report = project.parse_file_with(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red' });
        "},
        ParseTransforms {
            utility: Some(&mut transform),
            ..Default::default()
        },
    );

    assert_snapshot!(summary(&report.diagnostics), @"Warning transform_callback_failed transform callback failed (utility `color` with value `red`)");
}
