use crate::common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use serde_json::json;

#[test]
fn script_setup_and_template_expressions_feed_the_encoder() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Card.vue",
        indoc! {r#"
            <template>
              <section
                :class="css(cardStyles)"
                v-bind="{ class: css({ background: 'blue' }) }"
              >
                {{ css({ margin: '8px' }) }}
              </section>
            </template>
            <script setup lang="ts">
            import { css } from '@panda/css';

            const cardStyles = {
              color: 'red',
              padding: '4px',
            }
            </script>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 3);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn normal_script_blocks_are_preserved() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Panel.vue",
        indoc! {r#"
            <script lang="ts">
            import { css as pandaCss } from '@panda/css';

            const panelClass = pandaCss({
              borderRadius: '4px',
              margin: '8px',
            })
            </script>

            <template>
              <section :class="panelClass" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: borderRadius
      value: 4px
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    ");
}

#[test]
fn dynamic_bind_forms_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Bindings.vue",
        indoc! {r#"
            <script setup>
            import { css } from '@panda/css';
            </script>

            <template>
              <div
                :class="css({ color: 'red' })"
                v-bind:class="css({ padding: '4px' })"
                v-bind="{ class: css({ margin: '8px' }) }"
              />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 3);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn directive_conditionals_and_event_handlers_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Directives.vue",
        indoc! {r#"
            <script setup lang="ts">
            import { css } from '@panda/css';
            const ready = true
            </script>

            <template>
              <button
                v-if="ready && css({ color: 'red' })"
                v-show="css({ padding: '4px' })"
                @click="() => css({ margin: '8px' })"
              />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 3);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn v_for_extracts_only_the_source_expression() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "For.vue",
        indoc! {r#"
            <script setup>
            import { css } from '@panda/css';
            </script>

            <template>
              <div v-for="({ item }, index) of css({ color: 'red' })" :key="index" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn complex_template_expressions_keep_delimiters_inside_strings() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Complex.vue",
        indoc! {r#"
            <script setup>
            import { css } from '@panda/css';
            const ready = true
            </script>

            <template>
              <div :[ready ? 'class' : 'data-class']="ready ? css({ color: 'red' }) : css({ padding: '4px' })">
                {{ css({ margin: '8px' }) + "</div>" + "{{" }}
              </div>
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 3);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn component_style_props_are_extracted_from_template_attrs() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "StyleProps.vue",
        indoc! {r#"
            <script setup>
            import { Box } from '@panda/jsx';
            </script>

            <template>
              <Box color="red" padding="4px" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn component_bound_style_props_and_spreads_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "BoundStyleProps.vue",
        indoc! {r#"
            <script setup>
            import { Box } from '@panda/jsx';
            </script>

            <template>
              <Box
                :color="'red'"
                :css="{ padding: '4px' }"
                v-bind="{ margin: '8px', background: 'blue' }"
              />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn script_setup_constants_resolve_in_template_style_props() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "ResolvedStyleProps.vue",
        indoc! {r#"
            <script setup lang="ts">
            import { Box } from '@panda/jsx';

            const color = 'red'
            const panel = { padding: '4px' }
            const layout = { margin: '8px', background: 'blue' }
            </script>

            <template>
              <Box :color="color" :css="panel" v-bind="layout" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn nested_template_branches_extract_component_style_props() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "NestedBranches.vue",
        indoc! {r#"
            <script setup>
            import { Box } from '@panda/jsx';
            const selected = true
            </script>

            <template>
              <section>
                <template v-if="selected">
                  <Box color="red" />
                </template>
                <template v-else>
                  <Box padding="4px" />
                </template>
              </section>
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 2);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn native_vue_tags_do_not_extract_style_props() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Native.vue",
        indoc! {r#"
            <script setup>
            import { Box } from '@panda/jsx';
            </script>

            <template>
              <div color="red" padding="4px" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 0);
    assert!(project.atoms().is_empty());
}

#[test]
fn template_style_props_follow_minimal_jsx_style_prop_mode() {
    let mut project = create_project(json!({
        "jsxStyleProps": "minimal"
    }));
    let report = project.parse_file(
        "Minimal.vue",
        indoc! {r#"
            <script setup>
            import { Box } from '@panda/jsx';
            </script>

            <template>
              <Box color="red" :css="{ padding: '4px' }" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn namespace_component_style_props_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Namespace.vue",
        indoc! {r#"
            <script setup>
            import * as Panda from '@panda/jsx';
            </script>

            <template>
              <Panda.Box color="red" padding="4px" />
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn comments_are_ignored_without_blocking_real_expressions() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Comments.vue",
        indoc! {r"
            <script setup>
            import { css } from '@panda/css';
            </script>

            <template>
              <!-- {{ css({ color: 'red' }) }} -->
              <div>{{ css({ padding: '4px' }) }}</div>
            </template>
        "},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn non_html_templates_are_skipped() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Pug.vue",
        indoc! {r#"
            <script setup>
            import { css } from '@panda/css';
            </script>

            <template lang="pug">
              div(:class="css({ color: 'red' })")
            </template>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 0);
    assert!(project.atoms().is_empty());
}
