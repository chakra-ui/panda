use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};

use crate::common::{extract_shape, import_shape, panda_config};
use pandacss_extractor::{JsxExtractionConfig, JsxKind};
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
        - "Box:Box"
    - module: "@panda/css"
      specifiers:
        - "css:css"
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
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          fontWeight: bold
    jsx:
      - name: Box
        data:
          color: red
          css:
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
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx:
      - name: Box
        data: {}
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
            content: "</Box>"
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
    assert_yaml_snapshot!(extract_shape(&result), @"
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
          css:
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
      - name: Box
        data: {}
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
    assert_yaml_snapshot!(extract_shape(&result), @"
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
          css:
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
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn spans_point_into_the_original_vue_source() {
    // The mask is a same-length blank-and-copy, so a template expression keeps its
    // original byte offset: the reported span slices the ORIGINAL `.vue` verbatim.
    let source = indoc! {r#"
        <template>
          <p :class="css({ color: 'red' })" />
        </template>
        <script setup lang="ts">
        import { css } from '@panda/css';
        </script>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert_eq!(result.calls.len(), 1);
    let span = &result.calls[0].span;
    assert_snapshot!(&source[span.start as usize..span.end as usize], @"css({ color: 'red' })");
}

#[test]
fn bare_recipe_component_in_template_emits_usage() {
    // A slot-recipe context component used without props (the nuxt sandbox
    // shape: `<Custom.Root>` where `custom.tsx` wraps the config recipe via
    // `createSlotRecipeContext`) must still emit a recipe usage so base +
    // default-variant CSS renders — same `emit_empty` rule as the TSX visitor.
    let source = indoc! {r#"
        <template>
          <Custom.Root>
            <Custom.Label>Hello</Custom.Label>
          </Custom.Root>
        </template>
        <script setup lang="ts">
        import * as Custom from '../components/custom'
        </script>
    "#};

    let mut config = panda_config();
    config.matchers.jsx_kinds = [
        ("Custom.Root".to_owned(), JsxKind::Recipe),
        ("Custom.Label".to_owned(), JsxKind::Recipe),
    ]
    .into_iter()
    .collect();
    let jsx = JsxExtractionConfig {
        component_names: ["Custom.Root".to_owned(), "Custom.Label".to_owned()]
            .into_iter()
            .collect(),
        ..Default::default()
    };
    let config = config.with_jsx(jsx);

    let result = extract(source, "Card.vue", &config);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Custom.Root
        data: {}
      - name: Custom.Label
        data: {}
    ");
}

#[test]
fn bare_unconfigured_component_in_template_is_not_emitted() {
    // The uppercase heuristic alone (no configured jsx name) keeps the old
    // behavior: no extractable attrs, no usage.
    let source = indoc! {r#"
        <template>
          <Sidebar />
        </template>
        <script setup lang="ts">
        import Sidebar from './Sidebar.vue'
        </script>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
}

#[test]
fn multi_statement_event_handler_does_not_break_the_parse() {
    // v-on values may hold multiple statements (`@click="a(); b()"`), which
    // can't survive the parenthesized-expression mask copy — they are dropped
    // instead of producing a bogus parse diagnostic for valid Vue.
    let source = indoc! {r#"
        <template>
          <Box color="red" @click="track(); close()" />
        </template>
        <script setup lang="ts">
        import { Box } from '@panda/jsx';
        </script>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn single_expression_event_handler_still_parses() {
    let source = indoc! {r#"
        <template>
          <Box color="red" @click="count++" />
        </template>
        <script setup lang="ts">
        import { Box } from '@panda/jsx';
        </script>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn same_name_shorthand_resolves_through_script_scope() {
    // Vue 3.4: `:padding` means `:padding="padding"`; kebab args camelize
    // (`:font-size` -> `fontSize`). Both resolve via the script constants.
    let source = indoc! {r#"
        <template>
          <Box :padding :font-size />
        </template>
        <script setup lang="ts">
        import { Box } from '@panda/jsx';
        const padding = '4px'
        const fontSize = '12px'
        </script>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          padding: 4px
          font-size: 12px
    ");
}

#[test]
fn same_name_shorthand_without_binding_is_dropped() {
    // An unresolvable shorthand contributes nothing (it is NOT `true`), but a
    // plain valueless attribute still folds to a boolean.
    let source = indoc! {r#"
        <template>
          <Box :padding disabled color="red" />
        </template>
        <script setup lang="ts">
        import { Box } from '@panda/jsx';
        </script>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          disabled: true
          color: red
    ");
}

#[test]
fn kebab_case_tag_resolves_to_configured_pascal_component() {
    // Vue resolves `<custom-root>` against the PascalCase binding; configured
    // component names match the same way.
    let source = indoc! {r"
        <template>
          <custom-root />
        </template>
    "};
    let mut config = panda_config();
    config.matchers.jsx_kinds = [("CustomRoot".to_owned(), JsxKind::Recipe)]
        .into_iter()
        .collect();
    let jsx = JsxExtractionConfig {
        component_names: ["CustomRoot".to_owned()].into_iter().collect(),
        ..Default::default()
    };
    let config = config.with_jsx(jsx);

    let result = extract(source, "Card.vue", &config);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: CustomRoot
        data: {}
    ");
}

#[test]
fn kebab_case_tag_without_configured_component_is_ignored() {
    let source = indoc! {r#"
        <template>
          <my-widget color="red" />
        </template>
    "#};
    let result = extract(source, "Card.vue", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
}
