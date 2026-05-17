//! Config-derived project construction behavior.

mod common;

use common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use serde_json::json;

#[test]
fn jsx_names_include_patterns_and_recipes() {
    let mut project = create_project(json!({
        "jsxFactory": "styled",
        "patterns": {
            "stack": {},
            "center": { "jsxName": "Middle" },
            "cluster": { "jsx": ["InlineCluster"] }
        },
        "theme": {
            "recipes": {
                "button": {},
                "card": { "jsx": ["Panel"] }
            },
            "slotRecipes": {
                "checkbox": {}
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Stack, Middle, InlineCluster, Button, Panel, CheckboxRoot } from '@panda/jsx';
            const el = (
              <>
                <Stack color='red' />
                <Middle color='blue' />
                <InlineCluster color='green' />
                <Button color='purple' />
                <Panel color='orange' />
                <CheckboxRoot color='pink' />
              </>
            );
        "},
    );

    assert_eq!(report.jsx_usages, 6);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: green
      conditions: []
    - prop: color
      value: orange
      conditions: []
    - prop: color
      value: pink
      conditions: []
    - prop: color
      value: purple
      conditions: []
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn css_shorthands_are_normalized() {
    let mut project = create_project(json!({
        "utilities": {
            "padding": { "shorthand": "p" },
            "margin": { "shorthand": ["m", "mg"] }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ p: '4', m: '2' });
        "},
    );

    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: margin
      value: "2"
      conditions: []
    - prop: padding
      value: "4"
      conditions: []
    "#);
}

#[test]
fn utility_values_normalize_aliases() {
    let mut project = create_project(json!({
        "utilities": {
            "spacing": {
                "shorthand": "s",
                "values": {
                    "sm": "4px",
                    "md": "8px"
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ spacing: 'sm', _hover: { s: 'md' } });
        "},
    );

    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: spacing
      value: 4px
      conditions: []
    - prop: spacing
      value: 8px
      conditions:
        - _hover
    "#);
}

#[test]
fn jsx_shorthands_are_normalized() {
    let mut project = create_project(json!({
        "utilities": {
            "padding": { "shorthand": "p" }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box p='4' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: padding
      value: "4"
      conditions: []
    "#);
}

#[test]
fn all_jsx_props_filter_valid_props() {
    let mut project = create_project(json!({
        "utilities": {
            "padding": { "shorthand": "p" }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box backgroundColor='red' p='4' madeUp='ignored' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: backgroundColor
      value: red
      conditions: []
    - prop: padding
      value: "4"
      conditions: []
    "#);
}

#[test]
fn conditions_survive_shorthand_normalization() {
    let mut project = create_project(json!({
        "utilities": {
            "padding": { "shorthand": "p" }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ _hover: { p: '4' }, color: 'red' });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: "4"
      conditions:
        - _hover
    "#);
}

#[test]
fn config_conditions_are_encoded_as_conditions() {
    let mut project = create_project(json!({
        "conditions": {
            "cqSm": "@container (min-width: 320px)",
            "supportsGrid": "@supports (display: grid)"
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({
              cqSm: { color: 'red' },
              supportsGrid: { display: 'grid' }
            });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red
      conditions:
        - cqSm
    - prop: display
      value: grid
      conditions:
        - supportsGrid
    "#);
}

#[test]
fn config_breakpoints_are_encoded_as_conditions() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "tablet": "768px",
                "wide": "1440px"
            }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({
              tablet: { color: 'red' },
              wide: { color: 'blue' }
            });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red
      conditions:
        - tablet
    - prop: color
      value: blue
      conditions:
        - wide
    "#);
}

#[test]
fn non_shorthand_props_stay_unchanged() {
    let mut project = create_project(json!({
        "utilities": {
            "size": { "className": "size" }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ size: '4', color: 'red' });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red
      conditions: []
    - prop: size
      value: "4"
      conditions: []
    "#);
}

#[test]
fn minimal_jsx_filters_style_props() {
    let mut project = create_project(json!({
        "jsxStyleProps": "minimal"
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box color='red' css={{ margin: '8px' }} borderCss={{ width: '1px' }} />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: borderCss
      value: 1px
      conditions: []
    - prop: css
      value: 8px
      conditions: []
    ");
}

#[test]
fn minimal_jsx_keeps_pattern_props() {
    let mut project = create_project(json!({
        "jsxStyleProps": "minimal",
        "patterns": {
            "stack": {
                "properties": {
                    "gap": {},
                    "align": {}
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Stack } from '@panda/jsx';
            const el = <Stack gap='4' color='red' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: gap
      value: "4"
      conditions: []
    "#);
}

#[test]
fn none_jsx_keeps_component_props() {
    let mut project = create_project(json!({
        "jsxStyleProps": "none",
        "patterns": {
            "stack": {
                "properties": {
                    "gap": {}
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Stack } from '@panda/jsx';
            const el = <Stack gap='4' color='red' css={{ margin: '8px' }} />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: gap
      value: "4"
      conditions: []
    "#);
}
