use crate::common::create_project;
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_encoder::AtomValue;
use pandacss_project::Project;
use serde_json::json;

#[allow(clippy::format_collect, reason = "test display helper")]
fn atoms(project: &Project) -> String {
    let mut lines: Vec<String> = project
        .atoms()
        .iter()
        .map(|a| {
            let value = match a.value() {
                AtomValue::String(s) | AtomValue::Number(s) => s.to_string(),
                AtomValue::Bool(true) => "true".to_owned(),
                AtomValue::Bool(false) => "false".to_owned(),
                AtomValue::Null => "null".to_owned(),
            };
            let conditions = a
                .conditions()
                .iter()
                .map(|c| format!(" @{}", c.as_ref()))
                .collect::<String>();
            format!("{}: {value}{conditions}", a.prop())
        })
        .collect();
    lines.sort();
    lines.join("\n")
}

#[test]
fn text_style_reference_emits_atom() {
    let mut project = create_project(json!({
        "theme": {
            "textStyles": {
                "heading": {
                    "h1": { "value": { "fontSize": "2xl", "lineHeight": "tight" } }
                }
            }
        }
    }));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ textStyle: 'heading.h1' });
        "},
    );
    assert_snapshot!(atoms(&project), @"textStyle: heading.h1");
}

#[test]
fn nested_paths_flatten_to_dot_notation() {
    let mut project = create_project(json!({
        "theme": {
            "textStyles": {
                "display": {
                    "large": { "value": { "fontSize": "6xl" } },
                    "small": { "value": { "fontSize": "lg" } }
                }
            }
        }
    }));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ textStyle: 'display.large' });
            css({ textStyle: 'display.small' });
        "},
    );
    assert_snapshot!(atoms(&project), @r"
    textStyle: display.large
    textStyle: display.small
    ");
}

#[test]
fn layer_style_and_animation_style_register_independently() {
    let mut project = create_project(json!({
        "theme": {
            "layerStyles": {
                "card": { "value": { "background": "white", "borderRadius": "md" } }
            },
            "animationStyles": {
                "fadeIn": { "value": { "animationName": "fadeIn", "animationDuration": "300ms" } }
            }
        }
    }));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ layerStyle: 'card' });
            css({ animationStyle: 'fadeIn' });
        "},
    );
    assert_snapshot!(atoms(&project), @r"
    animationStyle: fadeIn
    layerStyle: card
    ");
}

#[test]
fn no_composition_section_means_no_textstyle_property() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ textStyle: 'heading.h1' });
        "},
    );
    // No textStyles defined → no synthetic utility → atom still flows
    // through but with no resolved styles. Confirm atom exists; the
    // stylesheet integration test covers emitted CSS shape.
    assert_snapshot!(atoms(&project), @"textStyle: heading.h1");
}
