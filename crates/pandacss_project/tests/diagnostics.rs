use crate::common::{create_config, create_project, sorted_atoms};
use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};
use pandacss_encoder::AtomValue;
use pandacss_project::{
    Diagnostic, ExtractedLiteral, ParseTransforms, Project, SourceTransformFn, System,
};
use pandacss_shared::diagnostic_codes;
use serde_json::json;

fn summary(diagnostics: &[Diagnostic]) -> String {
    diagnostics
        .iter()
        .map(|diagnostic| {
            let span = diagnostic
                .span
                .map(|span| format!(" [{}..{}]", span.start, span.end))
                .unwrap_or_default();
            format!(
                "{:?} {} {}{}",
                diagnostic.severity, diagnostic.code, diagnostic.message, span
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

    assert_snapshot!(summary(&report.diagnostics), @"Warning panda_call_unextractable Css call `css` received a dynamic argument, so no static CSS was generated for this call [34..51]");
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
    let mut transform =
        |_prop: &str, _resolved: &AtomValue, _original: &AtomValue| -> Result<_, Diagnostic> {
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

#[test]
fn source_transform_failure_is_output_diagnostic_without_dropping_last_good_styles() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "style.ts",
        "import { css } from '@panda/css'; css({ color: 'red' });",
    );
    project.bump_parse_epoch();
    let mut fail = |_path: &str, _source: &str| {
        Err(Diagnostic::warning(
            diagnostic_codes::TRANSFORM_CALLBACK_FAILED,
            "parser callback failed",
        ))
    };

    project.parse_file_with(
        "style.ts",
        "import { css } from '@panda/css'; css({ color: 'blue' });",
        ParseTransforms {
            source: Some(&mut fail as &mut SourceTransformFn<'_>),
            ..Default::default()
        },
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
    assert_yaml_snapshot!(
        project
            .file_diagnostics()
            .into_iter()
            .map(|diagnostic| (
                diagnostic.code.as_str(),
                diagnostic.file.as_deref(),
                diagnostic.message.as_str(),
            ))
            .collect::<Vec<_>>()
        , @r#"
    - - transform_callback_failed
      - style.ts
      - parser callback failed
    "#
    );

    let mut recover = |_path: &str, source: &str| Ok(Some(source.to_owned()));
    project.parse_file_with(
        "style.ts",
        "import { css } from '@panda/css'; css({ color: 'blue' });",
        ParseTransforms {
            source: Some(&mut recover as &mut SourceTransformFn<'_>),
            ..Default::default()
        },
    );
    assert_yaml_snapshot!(json!({
        "diagnostics": project
            .file_diagnostics()
            .into_iter()
            .map(|diagnostic| diagnostic.code.as_str())
            .collect::<Vec<_>>(),
        "atoms": sorted_atoms(&project),
    }), @r#"
    diagnostics: []
    atoms:
      - prop: color
        value: blue
        conditions: []
    "#);
}

#[test]
fn config_utility_transform_failures_are_reported_and_retried_but_success_is_cached() {
    let user_config = create_config(json!({
        "utilities": {
            "size": {
                "className": "size",
                "transform": { "kind": "js-callback", "id": "utilities.size.transform" }
            }
        },
        "globalCss": {
            "html": { "size": "4px" }
        }
    }));
    let system = System::new(user_config.clone()).expect("valid project config");
    let mut project = Project::new(system);
    let mut calls = 0;
    let mut transform = |_prop: &str, _resolved: &AtomValue, _original: &AtomValue| {
        calls += 1;
        if calls < 3 {
            Err(Diagnostic::warning(
                diagnostic_codes::TRANSFORM_CALLBACK_FAILED,
                "utility callback failed",
            ))
        } else {
            Ok(None::<ExtractedLiteral>)
        }
    };

    let first = project
        .stylesheet_snapshots_with_utility_transform(&user_config, &mut transform)
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.clone())
        .collect::<Vec<_>>();
    let second = project
        .stylesheet_snapshots_with_utility_transform(&user_config, &mut transform)
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.clone())
        .collect::<Vec<_>>();
    let recovered = project
        .stylesheet_snapshots_with_utility_transform(&user_config, &mut transform)
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.clone())
        .collect::<Vec<_>>();
    let cached = project
        .stylesheet_snapshots_with_utility_transform(&user_config, &mut transform)
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.clone())
        .collect::<Vec<_>>();

    assert_yaml_snapshot!(json!({
        "first": first,
        "second": second,
        "recovered": recovered,
        "cached": cached,
        "calls": calls,
    }), @r#"
    first:
      - transform_callback_failed
    second:
      - transform_callback_failed
    recovered: []
    cached: []
    calls: 3
    "#);
}

#[test]
fn static_recipe_utility_transform_failures_are_reported_and_retried() {
    let user_config = create_config(json!({
        "utilities": {
            "size": {
                "className": "size",
                "transform": { "kind": "js-callback", "id": "utilities.size.transform" }
            }
        },
        "theme": {
            "recipes": {
                "button": { "base": { "size": "4px" } }
            }
        },
        "staticCss": { "recipes": "*" }
    }));
    let system = System::new(user_config.clone()).expect("valid project config");
    let mut project = Project::new(system);
    let mut calls = 0;
    let mut transform = |_prop: &str, _resolved: &AtomValue, _original: &AtomValue| {
        calls += 1;
        Err::<Option<ExtractedLiteral>, _>(Diagnostic::warning(
            diagnostic_codes::TRANSFORM_CALLBACK_FAILED,
            "utility callback failed",
        ))
    };

    let first = project
        .stylesheet_snapshots_with_utility_transform(&user_config, &mut transform)
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.clone())
        .collect::<Vec<_>>();
    let second = project
        .stylesheet_snapshots_with_utility_transform(&user_config, &mut transform)
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.code.clone())
        .collect::<Vec<_>>();

    assert_yaml_snapshot!(json!({
        "first": first,
        "second": second,
        "calls": calls,
    }), @r#"
    first:
      - transform_callback_failed
    second:
      - transform_callback_failed
    calls: 2
    "#);
}

#[test]
fn invalid_color_opacity_modifier_emits_warning_with_span() {
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "300": { "value": "#fca5a5" } }
                },
                "opacity": {
                    "half": { "value": "0.5" }
                }
            }
        },
        "utilities": {
            "backgroundColor": {
                "className": "bg",
                "shorthand": "bg",
                "values": "colors"
            }
        }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ bg: 'red/abc' });
        "},
    );

    assert_snapshot!(summary(&report.diagnostics), @"Warning invalid_color_opacity_modifier Color value `red/abc` has an invalid opacity modifier; expected a number (e.g. `40`) or an opacity token (e.g. `half`) [34..56]");
}

#[test]
fn css_color_function_slash_alpha_does_not_warn() {
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "300": { "value": "#fca5a5" } }
                }
            }
        },
        "utilities": {
            "backgroundColor": {
                "className": "bg",
                "shorthand": "bg",
                "values": "colors"
            }
        }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ bg: 'rgb(251 146 60 / 0.3)' });
        "},
    );

    assert_snapshot!(summary(&report.diagnostics), @"");
}

#[test]
fn unknown_underscore_condition_warns_with_suggestion() {
    let mut project = create_project(json!({
        "conditions": { "hover": "&:hover" },
        "utilities": { "color": { "className": "c" } }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ _hovr: { color: 'red' } });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @"Warning unknown_condition unknown condition `_hovr`, did you mean `_hover`? [34..66]");
}

#[test]
fn unknown_underscore_condition_without_close_match_omits_suggestion() {
    let mut project = create_project(json!({
        "conditions": { "hover": "&:hover" },
        "utilities": { "color": { "className": "c" } }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ _zzzzz: { color: 'red' } });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @"Warning unknown_condition unknown condition `_zzzzz` [34..67]");
}

#[test]
fn known_underscore_condition_is_not_diagnosed() {
    let mut project = create_project(json!({
        "conditions": { "hover": "&:hover" },
        "utilities": { "color": { "className": "c" } }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ _hover: { color: 'red' } });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @"");
}

#[test]
fn bare_condition_name_is_not_an_unknown_condition() {
    let mut project = create_project(json!({
        "conditions": { "print": "@media print" },
        "utilities": { "display": { "className": "d" } }
    }));
    let report = project.parse_file(
        "style.ts",
        indoc! {r"
            import { css } from '@panda/css';
            css({ print: { display: 'none' } });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @"");
}
