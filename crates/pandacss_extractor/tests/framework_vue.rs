use indoc::indoc;
use insta::assert_yaml_snapshot;
mod common;

use common::{extract_shape, import_shape, panda_config};
use pandacss_extractor::{extract, extract_jsx, match_imports, scan_imports};

#[test]
fn scan_imports_reads_script_setup() {
    let source = indoc! {r#"
        <template>
          <Box color="red" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        import { css } from '@panda/css';
        </script>
    "#};

    let scan = scan_imports(source, "Card.vue");
    assert!(scan.diagnostics.is_empty());
    assert_yaml_snapshot!(import_shape(&scan), @r#"
    - module: "@panda/jsx"
      specifiers:
        - Box:Box
    - module: "@panda/css"
      specifiers:
        - css:css
    "#);
}

#[test]
fn template_calls_and_style_props_extract_together() {
    let source = indoc! {r#"
        <template>
          <Box :color="color" :css="panel" v-bind="layout" />
          <p :class="css({ fontWeight: 'bold' })" />
        </template>
        <script setup lang="ts">
        import { Box } from '@panda/jsx';
        import { css } from '@panda/css';

        const color = 'red'
        const panel = { padding: '4px' }
        const layout = { margin: '8px' }
        </script>
    "#};

    let result = extract(source, "Card.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls:
      - name: css
        data:
          fontWeight: bold
    jsx:
      - name: Box
        data:
          color: red
          padding: 4px
          margin: 8px
    ");
}

#[test]
fn nested_template_branches_emit_component_style_props() {
    let source = indoc! {r#"
        <template>
          <section>
            <template v-if="ok">
              <Box color="red" />
            </template>
            <template v-else>
              <Box padding="4px" />
            </template>
          </section>
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "Nested.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
      - name: Box
        data:
          padding: 4px
    ");
}

#[test]
fn native_tags_do_not_emit_template_style_props() {
    let source = indoc! {r#"
        <template>
          <div color="red" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "Native.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx: []
    ");
}

#[test]
fn staged_extract_jsx_includes_template_style_props() {
    let source = indoc! {r#"
        <template>
          <Box color="red" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let config = panda_config();
    let scan = scan_imports(source, "Card.vue");
    let matched = match_imports(&scan, &config.matchers);
    let result = extract_jsx(source, "Card.vue", &matched, &config);
    let data: Vec<_> = result.jsx.iter().map(|item| item.data.to_json()).collect();

    assert_yaml_snapshot!(data, @r"
    - color: red
    ");
}

#[test]
fn script_setup_aliases_and_template_calls_extract() {
    let source = indoc! {r#"
        <template>
          <Box :class="panda({ color: 'red' })" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        import { css as panda } from '@panda/css';
        </script>
    "#};

    let result = extract(source, "Alias.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn script_and_script_setup_are_both_scanned() {
    let source = indoc! {r#"
        <template>
          <Box color="red" />
        </template>
        <script>
        import { css } from '@panda/css';
        css({ margin: '8px' })
        </script>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "TwoScripts.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls:
      - name: css
        data:
          margin: 8px
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn static_class_attrs_do_not_become_style_props() {
    let source = indoc! {r#"
        <template>
          <Box class="card" color="red" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "StaticClass.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn conditional_bound_style_props_emit_conditional_literals() {
    let source = indoc! {r#"
        <template>
          <Box :color="selected ? 'red' : 'blue'" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        const selected = unknown
        </script>
    "#};

    let result = extract(source, "Conditional.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color:
            kind: conditional
            branches:
              - red
              - blue
    ");
}

#[test]
fn array_css_prop_from_script_constant_extracts() {
    let source = indoc! {r#"
        <template>
          <Box :css="styles" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        const styles = [{ color: 'red' }, { padding: '4px' }]
        </script>
    "#};

    let result = extract(source, "ArrayCss.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          css:
            - color: red
            - padding: 4px
    ");
}

#[test]
fn v_bind_spread_filters_non_style_props() {
    let source = indoc! {r#"
        <template>
          <Box v-bind="{ id: 'x', color: 'red', padding: '4px' }" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "SpreadFilter.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
          padding: 4px
    ");
}

#[test]
fn namespace_component_style_props_extract() {
    let source = indoc! {r#"
        <template>
          <Panda.Box color="red" padding="4px" />
        </template>
        <script setup>
        import * as Panda from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "Namespace.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
          padding: 4px
    ");
}

#[test]
fn dynamic_arg_style_props_are_skipped_but_static_siblings_extract() {
    let source = indoc! {r#"
        <template>
          <Box :[propName]="'red'" color="blue" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        const propName = 'color'
        </script>
    "#};

    let result = extract(source, "DynamicArg.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: blue
    ");
}

#[test]
fn non_html_template_lang_is_skipped_for_template_attrs() {
    let source = indoc! {r#"
        <template lang="pug">
          Box(color="red")
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "Pug.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx: []
    ");
}

#[test]
fn comments_and_tag_like_strings_do_not_break_template_extraction() {
    let source = indoc! {r#"
        <template>
          <!-- <Box color="red" /> -->
          <Box :css="{ content: '</Box>', color: 'blue' }" />
        </template>
        <script setup>
        import { Box } from '@panda/jsx';
        </script>
    "#};

    let result = extract(source, "Comments.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls: []
    jsx:
      - name: Box
        data:
          css:
            content: </Box>
            color: blue
    "#);
}

#[test]
fn larger_vue_sfc_mixes_scripts_templates_calls_and_style_props() {
    let source = indoc! {r#"
        <template>
          <!-- ignored: <Box color="pink" /> -->
          <section>
            <Box :color="color" :css="panel" v-bind="spread" />
            <Panda.Box padding="12px" :css="nestedCss" />

            <div :class="css({ fontWeight: 'bold' })">
              <Box color="green" />
            </div>

            <template v-for="item in items">
              <Box :color="item ? 'teal' : 'orange'" />
            </template>

            <template v-if="ready">
              <Box :class="hstack({ gap: '4px' })" />
            </template>

            <div color="should-not-extract" />
          </section>
        </template>

        <template lang="pug">
          Box(color="purple")
        </template>

        <script setup lang="ts">
        import { Box } from '@panda/jsx';
        import * as Panda from '@panda/jsx';
        import { css } from '@panda/css';
        import { hstack } from '@panda/patterns';

        const color = 'red'
        const panel = { padding: '4px' }
        const spread = { margin: '8px', class: 'ignored' }
        const nestedCss = [{ background: 'blue' }, { borderRadius: '8px' }]
        const items = [1, 2]
        const ready = true
        </script>

        <style scoped>
        .ignored { color: red; }
        </style>
    "#};

    let result = extract(source, "Large.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls:
      - name: css
        data:
          fontWeight: bold
      - name: hstack
        data:
          gap: 4px
    jsx:
      - name: Box
        data:
          color: red
          padding: 4px
          margin: 8px
      - name: Box
        data:
          padding: 12px
          css:
            - background: blue
            - borderRadius: 8px
      - name: Box
        data:
          color: green
      - name: Box
        data:
          color:
            kind: conditional
            branches:
              - teal
              - orange
    ");
}

#[test]
fn slot_templates_and_v_memo_do_not_break_extraction() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';
        </script>

        <template>
          <Box v-memo="[css({ margin: '8px' })]" color="red">
            <template #default="{ item }">
              <Box :css="{ padding: '4px' }" />
            </template>
          </Box>
        </template>
    "#};

    let result = extract(source, "Slots.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls:
      - name: css
        data:
          margin: 8px
    jsx:
      - name: Box
        data:
          color: red
      - name: Box
        data:
          padding: 4px
    ");
}

#[test]
fn script_tag_attrs_with_gt_do_not_break_import_scan() {
    let source = indoc! {r#"
        <script setup lang="ts" generic="T extends Record<string, string>">
        import { Box } from '@panda/jsx';
        </script>

        <template>
          <Box color="red" />
        </template>
    "#};

    let result = extract(source, "Generic.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    jsx:
      - name: Box
        data:
          color: red
    ");
}
