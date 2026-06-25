//! Config-derived pattern behavior.

use crate::common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::Literal;
use pandacss_project::ParseTransforms;
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

    let report = project.parse_file_with(
        "fixture.tsx",
        indoc! {r"
            import { stack } from '@panda/patterns';
            import { Stack } from '@panda/jsx';

            stack({});
            const el = <Stack />;
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
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

    project.parse_file_with(
        "fixture.ts",
        indoc! {r"
            import { stack } from '@panda/patterns';
            stack({ gap: '8px' });
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: gap
      value: 8px
      conditions: []
    ");
}

#[test]
fn pattern_raw_result_spread_uses_transformed_styles_in_nested_css() {
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "direction": { "type": "string" },
                    "gap": { "type": "string" }
                },
                "defaultValues": { "direction": "column" }
            }
        }
    }));
    let mut transform = |name: &str, styles: &Literal| {
        assert_eq!(name, "stack");
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            (
                "flexDirection".to_owned(),
                object_value(styles, "direction")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
            (
                "gap".to_owned(),
                object_value(styles, "gap")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
        ])))
    };

    project.parse_file_with(
        "fixture.ts",
        indoc! {r"
            import { css } from '@panda/css';
            import { stack } from '@panda/patterns';

            const list = stack.raw({ gap: '0.8rem' });
            css({
              bg: 'blue.100',
              '& ul': {
                ...list,
              },
              '& li': {
                bg: 'blue.200',
              },
            });
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    let nested_atoms: Vec<_> = sorted_atoms(&project)
        .into_iter()
        .filter(|atom| atom.conditions().len() == 1 && atom.conditions()[0].as_ref() == "& ul")
        .collect();
    assert_yaml_snapshot!(nested_atoms, @r#"
    - prop: display
      value: flex
      conditions:
        - "& ul"
    - prop: flexDirection
      value: column
      conditions:
        - "& ul"
    - prop: gap
      value: 0.8rem
      conditions:
        - "& ul"
    "#);
}

#[test]
fn inline_pattern_raw_spread_uses_transformed_styles_in_nested_css() {
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "direction": { "type": "string" },
                    "gap": { "type": "string" }
                },
                "defaultValues": { "direction": "column" }
            }
        }
    }));
    let mut transform = |name: &str, styles: &Literal| {
        assert_eq!(name, "stack");
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            (
                "flexDirection".to_owned(),
                object_value(styles, "direction")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
            (
                "gap".to_owned(),
                object_value(styles, "gap")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
        ])))
    };

    project.parse_file_with(
        "fixture.ts",
        indoc! {r"
            import { css } from '@panda/css';
            import { stack } from '@panda/patterns';

            css({
              bg: 'blue.100',
              '& ul': {
                ...stack.raw({ gap: '0.8rem' }),
              },
              '& li': {
                bg: 'blue.200',
              },
            });
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    let nested_atoms: Vec<_> = sorted_atoms(&project)
        .into_iter()
        .filter(|atom| atom.conditions().len() == 1 && atom.conditions()[0].as_ref() == "& ul")
        .collect();
    assert_yaml_snapshot!(nested_atoms, @r#"
    - prop: display
      value: flex
      conditions:
        - "& ul"
    - prop: flexDirection
      value: column
      conditions:
        - "& ul"
    - prop: gap
      value: 0.8rem
      conditions:
        - "& ul"
    "#);
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

    project.parse_file_with(
        "fixture.tsx",
        indoc! {r"
            import { Panel } from '@panda/jsx';
            const el = <Panel tone='info' color='red' css={{ bg: 'blue' }} />;
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
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

    project.parse_file_with(
        "fixture.tsx",
        indoc! {r"
            import { Panel } from '@panda/jsx';
            const el = <Panel tone='info' color='red' backgroundColor='blue' />;
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
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

#[test]
fn pattern_local_import_alias_routes_to_export_pattern() {
    // Preset-base models `stack` and `hstack` as separate patterns — not a jsx
    // alias on one entry. A local rename (`hstack as aliased`) must still hit
    // the `hstack` pattern transform, matching output.test.ts extraction names.
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "align": { "type": "string" }
                },
                "defaultValues": { "direction": "column", "gap": "8px" }
            },
            "hstack": {
                "properties": {
                    "justify": { "type": "string" }
                },
                "defaultValues": { "gap": "8px" }
            }
        }
    }));
    let mut names = Vec::new();
    let mut transform = |name: &str, styles: &Literal| {
        names.push(name.to_owned());
        match name {
            "stack" => Ok(Some(Literal::Object(vec![
                ("display".to_owned(), Literal::String("flex".to_owned())),
                (
                    "flexDirection".to_owned(),
                    Literal::String("column".to_owned()),
                ),
                (
                    "alignItems".to_owned(),
                    object_value(styles, "align")
                        .cloned()
                        .unwrap_or(Literal::Null),
                ),
            ]))),
            "hstack" => Ok(Some(Literal::Object(vec![
                ("display".to_owned(), Literal::String("flex".to_owned())),
                (
                    "flexDirection".to_owned(),
                    Literal::String("row".to_owned()),
                ),
                (
                    "justifyContent".to_owned(),
                    object_value(styles, "justify")
                        .cloned()
                        .unwrap_or(Literal::Null),
                ),
            ]))),
            other => panic!("unexpected pattern name: {other}"),
        }
    };

    project.parse_file_with(
        "fixture.tsx",
        indoc! {r"
            import { stack, hstack as aliased } from '@panda/patterns';
            stack({ align: 'center' });
            aliased({ justify: 'flex-end' });
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    assert_eq!(names, ["stack", "hstack"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: alignItems
      value: center
      conditions: []
    - prop: display
      value: flex
      conditions: []
    - prop: flexDirection
      value: column
      conditions: []
    - prop: flexDirection
      value: row
      conditions: []
    - prop: justifyContent
      value: flex-end
      conditions: []
    ");
}

#[test]
fn pattern_function_and_jsx_share_transform_with_default_values() {
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "properties": {
                    "gap": { "type": "string" }
                },
                "defaultValues": { "gap": "8px", "direction": "column" }
            }
        }
    }));
    let mut transform = |name: &str, styles: &Literal| {
        assert_eq!(name, "stack");
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            (
                "flexDirection".to_owned(),
                object_value(styles, "direction")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("column".to_owned())),
            ),
            (
                "gap".to_owned(),
                object_value(styles, "gap")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
        ])))
    };

    let report = project.parse_file_with(
        "fixture.tsx",
        indoc! {r"
            import { stack } from '@panda/patterns';
            import { Stack } from '@panda/jsx';
            stack({});
            const el = <Stack />;
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    assert_eq!(report.css_calls, 0);
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: display
      value: flex
      conditions: []
    - prop: flexDirection
      value: column
      conditions: []
    - prop: gap
      value: 8px
      conditions: []
    ");
}

#[test]
fn pattern_conditional_props_produce_conditioned_atoms() {
    let mut project = create_project(json!({
        "conditions": {
            "hover": "&:hover"
        },
        "patterns": {
            "stack": {
                "properties": {
                    "gap": { "type": "string" }
                }
            }
        }
    }));
    let mut transform = |_name: &str, styles: &Literal| {
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

    project.parse_file_with(
        "fixture.ts",
        indoc! {r"
            import { stack } from '@panda/patterns';
            stack({ gap: { base: '4px', _hover: '8px' } });
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: display
      value: flex
      conditions: []
    - prop: gap
      value: 4px
      conditions: []
    - prop: gap
      value: 8px
      conditions:
        - _hover
    ");
}

#[test]
fn pattern_raw_composes_into_css_raw_spread() {
    let mut project = create_project(json!({
        "patterns": {
            "stack": {
                "properties": {
                    "gap": { "type": "string" }
                },
                "defaultValues": { "direction": "column" }
            }
        }
    }));
    let mut transform = |name: &str, styles: &Literal| {
        assert_eq!(name, "stack");
        Ok(Some(Literal::Object(vec![
            ("display".to_owned(), Literal::String("flex".to_owned())),
            (
                "flexDirection".to_owned(),
                object_value(styles, "direction")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
            (
                "gap".to_owned(),
                object_value(styles, "gap")
                    .cloned()
                    .unwrap_or_else(|| Literal::String("missing".to_owned())),
            ),
        ])))
    };

    project.parse_file_with(
        "fixture.ts",
        indoc! {r"
            import { css } from '@panda/css';
            import { stack } from '@panda/patterns';

            const list = stack.raw({ gap: '1rem' });
            const layout = css.raw({
              ...list,
              padding: '8px',
            });
            css({ color: 'red', ...layout });
        "},
        ParseTransforms {
            source: None,
            pattern: Some(&mut transform),
            utility: None,
        },
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: display
      value: flex
      conditions: []
    - prop: flexDirection
      value: column
      conditions: []
    - prop: gap
      value: 1rem
      conditions: []
    - prop: padding
      value: 8px
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

#[test]
fn extracted_jsx_carries_kind_from_config() {
    let project = create_project(json!({
        "jsxFramework": "react",
        "patterns": {
            "stack": { "jsxName": "Stack", "properties": { "gap": { "type": "string" } } }
        },
        "theme": {
            "recipes": {
                "button": { "base": {}, "variants": { "size": { "sm": {} } } }
            }
        }
    }));

    let result = project.extract(
        "fixture.tsx",
        indoc! {r"
            import { styled, Stack, Button } from '@panda/jsx';

            const a = <styled.div color='red' />;
            const b = <Stack gap='4' />;
            const c = <Button size='sm' />;
            const d = <Panel color='red' />;
        "},
    );

    let kinds: Vec<(String, String)> = result
        .jsx
        .iter()
        .map(|j| (j.name.clone(), format!("{:?}", j.kind)))
        .collect();

    assert_eq!(
        kinds,
        vec![
            ("styled.div".to_owned(), "Factory".to_owned()),
            ("Stack".to_owned(), "Pattern".to_owned()),
            ("Button".to_owned(), "Recipe".to_owned()),
            ("Panel".to_owned(), "Component".to_owned()),
        ]
    );
}
