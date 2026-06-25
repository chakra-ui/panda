//! UserConfig-derived project construction behavior.

use crate::common::{create_config, create_project, sorted_atoms};
use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};
use pandacss_project::{Project, System};
use serde_json::json;

#[test]
fn config_builds_system_and_project() {
    let config = create_config(json!({
        "theme": {
            "breakpoints": {
                "sm": "640px"
            }
        }
    }));

    let system = System::new(config.clone()).expect("valid system config");
    let project = Project::new(system);

    assert!(project.is_empty());
    let system = System::new(config).expect("valid project config");
    assert!(Project::new(system).is_empty());
}

#[test]
fn invalid_serialized_jsx_regex_returns_error() {
    let config = create_config(json!({
        "patterns": {
            "stack": {
                "jsx": [
                    {
                        "kind": "regex",
                        "source": "[",
                        "flags": ""
                    }
                ]
            }
        }
    }));

    let error = match System::new(config) {
        Ok(system) => {
            let _project = Project::new(system);
            panic!("invalid regex should fail config build")
        }
        Err(error) => error,
    };

    assert_eq!(
        error.to_string(),
        "Regex error at patterns.stack.jsx[0]: /[/"
    );
}

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
fn css_shorthands_can_be_disabled() {
    let mut project = create_project(json!({
        "shorthands": false,
        "utilities": {
            "padding": { "shorthand": "p" }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ p: '4', padding: '8' });
        "},
    );

    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: p
      value: "4"
      conditions: []
    - prop: padding
      value: "8"
      conditions: []
    "#);
}

#[test]
fn utility_values_normalize_aliases() {
    let mut project = create_project(json!({
        "conditions": {
            "hover": "&:hover"
        },
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
      value: sm
      conditions: []
    - prop: spacing
      value: md
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
fn generated_color_palette_utility_is_a_valid_jsx_prop() {
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box colorPalette='red' color='colorPalette.500' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: colorPalette.500
      conditions: []
    - prop: colorPalette
      value: red
      conditions: []
    "#);
}

#[test]
fn disabled_color_palette_generation_omits_jsx_prop_support() {
    let mut project = create_project(json!({
        "theme": {
            "colorPalette": {
                "enabled": false
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box colorPalette='red' color='red.500' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red.500
      conditions: []
    "#);
}

#[test]
fn conditions_survive_shorthand_normalization() {
    let mut project = create_project(json!({
        "conditions": {
            "hover": "&:hover"
        },
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
              _cqSm: { color: 'red' },
              _supportsGrid: { display: 'grid' }
            });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: red
      conditions:
        - _cqSm
    - prop: display
      value: grid
      conditions:
        - _supportsGrid
    "#);
}

#[test]
fn config_validation_warnings_are_project_diagnostics() {
    let project = create_project(json!({
        "conditions": {
            "pinkTheme": "[data-theme=pink]"
        }
    }));

    assert_yaml_snapshot!(project.diagnostics(), @r#"
    - code: config_condition_selector_invalid
      message: "Selectors should contain the `&` character: `[data-theme=pink]`"
      severity: warning
    "#);
}

#[test]
fn config_validation_error_fails_project_construction() {
    let result = System::new(
        serde_json::from_value::<pandacss_config::UserConfig>(json!({
            "validation": "error",
            "conditions": {
                "pinkTheme": "[data-theme=pink]"
            }
        }))
        .expect("valid typed config"),
    );

    let Err(error) = result else {
        panic!("expected validation error");
    };
    assert_snapshot!(error.to_string(), @r"
Config error: Invalid config:
- [config_condition_selector_invalid] Selectors should contain the `&` character: `[data-theme=pink]`
");
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
fn responsive_arrays_use_config_breakpoint_order() {
    let mut project = create_project(json!({
        "theme": {
            "breakpoints": {
                "wide": "1440px",
                "tablet": "768px"
            }
        }
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: ['red', 'blue', 'green'] });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: color
      value: blue
      conditions:
        - tablet
    - prop: color
      value: green
      conditions:
        - wide
    ");
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
fn implicit_uppercase_jsx_components_extract_valid_style_props() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "utilities": {
            "padding": { "shorthand": "p" }
        }
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            const el = <Card backgroundColor='red' p='4' madeUp='ignored' />;
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
fn implicit_uppercase_jsx_components_without_style_props_are_ignored() {
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            const el = <Card madeUp='ignored' />;
        "},
    );

    assert_eq!(report.jsx_usages, 0);
    assert!(sorted_atoms(&project).is_empty());
}

#[test]
fn lowercase_jsx_tags_stay_ignored_for_style_props() {
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            const el = <div color='red' />;
        "},
    );

    assert_eq!(report.jsx_usages, 0);
    assert!(sorted_atoms(&project).is_empty());
}

#[test]
fn implicit_uppercase_jsx_components_follow_minimal_style_prop_mode() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxStyleProps": "minimal"
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            const el = <Card color='red' css={{ margin: '8px' }} borderCss={{ width: '1px' }} />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: margin
      value: 8px
      conditions: []
    - prop: width
      value: 1px
      conditions: []
    ");
}

#[test]
fn local_factory_alias_extracts_as_implicit_uppercase_component() {
    let mut project = create_project(json!({
        "jsxFactory": "panda",
        "jsxFramework": "react"
    }));

    let report = project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { panda } from '@panda/jsx';
            const JsxPanel = panda.div;
            const el = <JsxPanel display='grid' gap='4' />;
        "},
    );

    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: display
      value: grid
      conditions: []
    - prop: gap
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
    - prop: margin
      value: 8px
      conditions: []
    - prop: width
      value: 1px
      conditions: []
    ");
}

#[test]
fn jsx_css_prop_arrays_are_processed_as_style_objects() {
    let mut project = create_project(json!({
        "jsxStyleProps": "minimal"
    }));

    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box css={[{ color: 'red' }, { margin: '8px' }]} />;
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
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
