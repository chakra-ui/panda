//! Config-derived pattern behavior.

mod common;

use common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::Literal;
use serde_json::json;

#[test]
fn pattern_defaults_apply_before_transform() {
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "properties": {
                    "gap": { "type": "string" }
                },
                "defaultValues": { "gap": "4px" }
            }
        }
    }));
    let mut names = Vec::new();
    let mut transform = |name: &str, styles: &Literal| {
        names.push(name.to_owned());
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            (
                "gap".to_owned(),
                object_value(styles, "gap")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
        ])))
    };

    let report = project.parse_file_with_pattern_transforms(
        "fixture.tsx",
        indoc! {r"
            import { stack } from '@panda/patterns';
            import { Stack } from '@panda/jsx';

            stack({});
            const el = <Stack />;
        "},
        &mut transform,
    );

    assert_eq!(report.jsx_usages, 1);
    assert_eq!(names, ["stack", "stack"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: display
      value: flex
      conditions: []
    - prop: gap
      value: 4px
      conditions: []
    ");
}

#[test]
fn pattern_props_override_default_values() {
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "gap": { "type": "string" }
                },
                "defaultValues": { "gap": "4px" }
            }
        }
    }));
    let mut transform = |_name: &str, styles: &Literal| {
        Ok(Some(Literal::Object(vec![(
            "gap".to_owned(),
            object_value(styles, "gap")
                .cloned()
                .unwrap_or_else(|| Literal::String("missing".to_owned())),
        )])))
    };

    project.parse_file_with_pattern_transforms(
        "fixture.ts",
        indoc! {r"
            import { stack } from '@panda/patterns';
            stack({ gap: '8px' });
        "},
        &mut transform,
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: gap
      value: 8px
      conditions: []
    ");
}

#[test]
fn strict_pattern_components_only_extract_pattern_props() {
    let mut project = create_project(json!({
        "patterns": {
            "panel": {
                "jsxName": "Panel",
                "strict": true,
                "properties": {
                    "tone": { "type": "string" }
                }
            }
        }
    }));
    let mut transform = |_name: &str, styles: &Literal| Ok(Some(styles.clone()));

    project.parse_file_with_pattern_transforms(
        "fixture.tsx",
        indoc! {r"
            import { Panel } from '@panda/jsx';
            const el = <Panel tone='info' color='red' css={{ bg: 'blue' }} />;
        "},
        &mut transform,
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: tone
      value: info
      conditions: []
    ");
}

#[test]
fn pattern_blocklist_filters_style_props() {
    let mut project = create_project(json!({
        "patterns": {
            "panel": {
                "jsxName": "Panel",
                "blocklist": ["color"],
                "properties": {
                    "tone": { "type": "string" }
                }
            }
        }
    }));
    let mut transform = |_name: &str, styles: &Literal| Ok(Some(styles.clone()));

    project.parse_file_with_pattern_transforms(
        "fixture.tsx",
        indoc! {r"
            import { Panel } from '@panda/jsx';
            const el = <Panel tone='info' color='red' backgroundColor='blue' />;
        "},
        &mut transform,
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: backgroundColor
      value: blue
      conditions: []
    - prop: tone
      value: info
      conditions: []
    ");
}

fn object_value<'a>(literal: &'a Literal, key: &str) -> Option<&'a Literal> {
    let Literal::Object(entries) = literal else {
        return None;
    };
    entries
        .iter()
        .find(|(name, _)| name == key)
        .map(|(_, value)| value)
}
