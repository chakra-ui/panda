use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_system::System;
use serde_json::{Value, json};

use crate::common::{create_config, create_project, sorted_atoms};

fn project_with_rules(rules: &Value) -> pandacss_project::Project {
    create_project(json!({
        "jsxFramework": "react",
        "utilities": {
            "color": { "className": "c" },
            "padding": { "className": "p" },
            "columns": { "className": "columns" }
        },
        "jsxMatchTag": rules
    }))
}

fn regex(source: &str) -> Value {
    json!({ "kind": "regex", "source": source, "flags": "" })
}

#[test]
fn ignoring_a_package_skips_every_component_imported_from_it() {
    let mut project =
        project_with_rules(&json!([{ "from": "@tanstack/react-table", "ignore": true }]));

    project.parse_file(
        "app.tsx",
        indoc! {r"
            import { DataTable } from '@tanstack/react-table';
            import { Card } from './card';
            const table = <DataTable columns={3} />;
            const card = <Card color='red' />;
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn ignoring_a_namespace_import_skips_its_member_components() {
    let mut project = project_with_rules(&json!([{ "from": "@acme/ui", "ignore": true }]));

    project.parse_file(
        "app.tsx",
        indoc! {r"
            import * as UI from '@acme/ui';
            const card = <UI.Card color='red' />;
        "},
    );

    assert!(sorted_atoms(&project).is_empty());
}

#[test]
fn ignoring_a_component_by_name_overrides_panda_detection() {
    let mut project = project_with_rules(&json!([{ "tag": "styled.div", "ignore": true }]));

    project.parse_file(
        "app.tsx",
        indoc! {r"
            import { styled } from '@panda/jsx';
            const box = <styled.div color='red' />;
            const span = <styled.span padding='2' />;
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: padding
      value: "2"
      conditions: []
    "#);
}

#[test]
fn a_later_rule_includes_one_component_from_an_ignored_package() {
    let mut project = project_with_rules(&json!([
        { "from": "@acme/ui", "ignore": true },
        { "from": "@acme/ui", "tag": "Box" }
    ]));

    project.parse_file(
        "app.tsx",
        indoc! {r"
            import { Box, Card } from '@acme/ui';
            const box = <Box color='red' />;
            const card = <Card padding='2' />;
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn matching_components_by_pattern_limits_them_to_listed_props() {
    let mut project = project_with_rules(&json!([{ "tag": regex("Button$"), "props": ["color"] }]));

    project.parse_file(
        "app.tsx",
        indoc! {r"
            const icon = <IconButton color='red' padding='2' />;
            const card = <Card color='blue' padding='4' />;
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: "4"
      conditions: []
    "#);
}

#[test]
fn compiled_jsx_calls_follow_the_same_rules() {
    let mut project = project_with_rules(&json!([{ "from": "@acme/ui", "ignore": true }]));

    project.parse_file(
        "app.js",
        indoc! {r"
            import { jsx } from 'react/jsx-runtime';
            import { Card } from '@acme/ui';
            import { Box } from './box';
            const card = jsx(Card, { color: 'red' });
            const box = jsx(Box, { padding: '2' });
        "},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: padding
      value: "2"
      conditions: []
    "#);
}

#[test]
fn a_rule_without_tag_or_from_is_a_config_error() {
    let config = create_config(json!({ "jsxMatchTag": [{ "ignore": true }] }));
    let error = System::new(config).err().expect("invalid rule").to_string();
    assert_eq!(error, "Config error: jsxMatchTag[0] needs `tag` or `from`");
}

#[test]
fn a_rule_with_props_and_ignore_is_a_config_error() {
    let config = create_config(
        json!({ "jsxMatchTag": [{ "tag": "Card", "props": ["color"], "ignore": true }] }),
    );
    let error = System::new(config).err().expect("invalid rule").to_string();
    assert_eq!(
        error,
        "Config error: jsxMatchTag[0] can't set both `props` and `ignore`"
    );
}

#[test]
fn vue_templates_follow_the_same_rules() {
    let mut project = create_project(json!({
        "jsxFramework": "vue",
        "utilities": {
            "color": { "className": "c" },
            "padding": { "className": "p" }
        },
        "jsxMatchTag": [{ "from": "@acme/ui", "ignore": true }]
    }));

    project.parse_file(
        "App.vue",
        indoc! {r#"
            <template>
              <Card color="red" />
              <Panel padding="2" />
            </template>
            <script setup lang="ts">
            import { Card } from '@acme/ui';
            import Panel from './Panel.vue';
            </script>
        "#},
    );

    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: padding
      value: "2"
      conditions: []
    "#);
}
