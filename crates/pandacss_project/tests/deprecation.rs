use crate::common::create_project;
use indoc::indoc;
use insta::assert_snapshot;
use serde_json::json;

fn summary(diagnostics: &[pandacss_project::Diagnostic]) -> String {
    diagnostics
        .iter()
        .map(|d| {
            let span = d
                .span
                .map(|s| format!(" [{}..{}]", s.start, s.end))
                .unwrap_or_default();
            format!("{:?} {} {}{}", d.severity, d.code, d.message, span)
        })
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn deprecated_utility_use_emits_one_warning_per_call_site() {
    let mut project = create_project(json!({
        "utilities": {
            "color":   { "className": "c" },
            "padding": { "className": "p", "deprecated": true }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ padding: '4' });
            css({ color: 'red' });
            css({ padding: '8' });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @r#"
    Warning deprecated_utility_used utility "padding" is deprecated [34..55]
    Warning deprecated_utility_used utility "padding" is deprecated [80..101]
    "#);
}

#[test]
fn shorthand_use_reports_canonical_prop_name() {
    let mut project = create_project(json!({
        "utilities": {
            "backgroundColor": {
                "className": "bg",
                "shorthand": "bg",
                "deprecated": true
            }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ bg: 'red' });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @r#"Warning deprecated_utility_used utility "backgroundColor" is deprecated [34..52]"#);
}

#[test]
fn non_deprecated_props_produce_no_diagnostics() {
    let mut project = create_project(json!({
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red' });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @"");
}

#[test]
fn deprecated_prop_inside_a_condition_is_still_flagged() {
    let mut project = create_project(json!({
        "conditions": { "hover": "&:hover" },
        "utilities": {
            "padding": { "className": "p", "deprecated": true }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ _hover: { padding: '4' } });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @r#"Warning deprecated_utility_used utility "padding" is deprecated [34..67]"#);
}

#[test]
fn multiple_deprecated_props_in_one_call_each_emit_a_warning() {
    let mut project = create_project(json!({
        "utilities": {
            "padding": { "className": "p", "deprecated": true },
            "margin":  { "className": "m", "deprecated": true }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ padding: '4', margin: '8' });
        "},
    );
    let codes: Vec<&str> = report.diagnostics.iter().map(|d| d.code.as_str()).collect();
    assert_snapshot!(format!("{codes:?}"), @r#"["deprecated_utility_used", "deprecated_utility_used"]"#);
}

#[test]
fn jsx_usage_emits_warning_at_element_span() {
    let mut project = create_project(json!({
        "utilities": {
            "color": { "className": "c", "deprecated": true }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box color='red' />;
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @r#"Warning deprecated_utility_used utility "color" is deprecated [45..64]"#);
}

#[test]
fn deprecated_token_resolution_emits_token_warning() {
    // `token()` calls are folded by the literal evaluator only when their
    // result is actually consumed downstream — a bare `const a = token(...)`
    // is dead code and resolves nothing. Use the value inside a css() call
    // so the evaluator runs and the deprecation check fires.
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "legacy": { "value": "#f00", "deprecated": true },
                    "fresh":  { "value": "#0f0" }
                }
            }
        },
        "utilities": { "color": { "className": "c" } }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            import { token } from '@panda/tokens';
            css({ color: token('colors.legacy') });
            css({ color: token('colors.fresh') });
        "},
    );
    let codes: Vec<&str> = report.diagnostics.iter().map(|d| d.code.as_str()).collect();
    assert_snapshot!(format!("{codes:?}"), @r#"["deprecated_token_used"]"#);
}

#[test]
fn token_used_inside_css_call_emits_token_warning_not_utility_warning() {
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "legacy": { "value": "#f00", "deprecated": true }
                }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            import { token } from '@panda/tokens';
            css({ color: token('colors.legacy') });
        "},
    );
    let codes: Vec<&str> = report.diagnostics.iter().map(|d| d.code.as_str()).collect();
    assert_snapshot!(format!("{codes:?}"), @r#"["deprecated_token_used"]"#);
}

#[test]
fn no_deprecated_anything_produces_no_diagnostics() {
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": { "fresh": { "value": "#0f0" } }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            import { token } from '@panda/tokens';
            css({ color: token('colors.fresh') });
        "},
    );
    assert_snapshot!(summary(&report.diagnostics), @"");
}
