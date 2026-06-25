use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};

use crate::common::{extract_shape, import_shape, panda_config, panda_jsx_config};
use pandacss_extractor::{extract, extract_jsx, match_imports, scan_imports};

#[test]
fn scan_imports_reads_script_blocks() {
    let source = indoc! {r#"
        <script lang="ts">
        import { Box } from '@panda/jsx';
        import { css } from '@panda/css';
        </script>

        <Box color="red" />
    "#};

    let scan = scan_imports(source, "Card.svelte");
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
        <script lang="ts">
        import { Box } from '@panda/jsx';
        import { css } from '@panda/css';

        const color = 'red'
        const panel = { padding: '4px' }
        const layout = { margin: '8px' }
        </script>

        <Box color={color} css={panel} {...layout} />
        <p class={css({ fontWeight: 'bold' })} />
    "#};

    let result = extract(source, "Card.svelte", &panda_jsx_config());
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
fn native_tags_do_not_emit_template_style_props() {
    let source = indoc! {r#"
        <script>
        import { Box } from '@panda/jsx';
        </script>

        <div color="red" />
    "#};

    let result = extract(source, "Native.svelte", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx: []
    ");
}

#[test]
fn staged_extract_jsx_includes_template_style_props() {
    let source = indoc! {r#"
        <script>
        import { Box } from '@panda/jsx';
        </script>

        <Box color="red" />
    "#};

    let config = panda_config().with_jsx_framework(true);
    let scan = scan_imports(source, "Card.svelte");
    let matched = match_imports(&scan, &config.matchers);
    let result = extract_jsx(source, "Card.svelte", &matched, &config);
    let data: Vec<_> = result.jsx.iter().map(|item| item.data.to_json()).collect();

    assert_yaml_snapshot!(data, @r"
    - color: red
    ");
}

#[test]
fn aliased_css_calls_extract_from_markup() {
    let source = indoc! {r"
        <script>
        import { css as panda } from '@panda/css';
        </script>

        <p class={panda({ color: 'red' })} />
    "};

    let result = extract(source, "Alias.svelte", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn module_and_instance_scripts_are_both_scanned() {
    let source = indoc! {r#"
        <script module>
        import { css } from '@panda/css';
        css({ margin: '8px' })
        </script>
        <script>
        import { Box } from '@panda/jsx';
        </script>

        <Box color="red" />
    "#};

    let result = extract(source, "TwoScripts.svelte", &panda_jsx_config());
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
        <script>
        import { Box } from '@panda/jsx';
        </script>

        <Box class="card" color="red" />
    "#};

    let result = extract(source, "StaticClass.svelte", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn conditional_style_props_emit_conditional_literals() {
    let source = indoc! {r"
        <script>
        import { Box } from '@panda/jsx';
        const selected = unknown
        </script>

        <Box color={selected ? 'red' : 'blue'} />
    "};

    let result = extract(source, "Conditional.svelte", &panda_jsx_config());
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
    let source = indoc! {r"
        <script>
        import { Box } from '@panda/jsx';
        const styles = [{ color: 'red' }, { padding: '4px' }]
        </script>

        <Box css={styles} />
    "};

    let result = extract(source, "ArrayCss.svelte", &panda_jsx_config());
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
fn spread_filters_non_style_props() {
    let source = indoc! {r"
        <script>
        import { Box } from '@panda/jsx';
        const props = { id: 'x', color: 'red', padding: '4px' }
        </script>

        <Box {...props} />
    "};

    let result = extract(source, "SpreadFilter.svelte", &panda_jsx_config());
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
        <script>
        import * as Panda from '@panda/jsx';
        </script>

        <Panda.Box color="red" padding="4px" />
    "#};

    let result = extract(source, "Namespace.svelte", &panda_jsx_config());
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
fn svelte_directive_attrs_are_ignored_but_static_siblings_extract() {
    let source = indoc! {r#"
        <script>
        import { Box } from '@panda/jsx';
        const active = true
        </script>

        <Box class:active={active} bind:this={ref} color="red" />
    "#};

    let result = extract(source, "Directives.svelte", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
    ");
}

#[test]
fn comments_inside_tags_are_ignored() {
    let source = indoc! {r#"
        <script>
        import { Box } from '@panda/jsx';
        </script>

        <Box
          // color="red"
          /* padding="4px" */
          margin="8px"
        />
    "#};

    let result = extract(source, "Comments.svelte", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @r"
    calls: []
    jsx:
      - name: Box
        data:
          margin: 8px
    ");
}

#[test]
fn await_and_each_blocks_do_not_break_component_style_props() {
    let source = indoc! {r#"
        <script>
        import { Box } from '@panda/jsx';
        const promise = Promise.resolve([])
        </script>

        {#await promise}
          <Box color="red" />
        {:then items}
          {#each items as item}
            <Box padding="4px" />
          {/each}
        {/await}
    "#};

    let result = extract(source, "Blocks.svelte", &panda_jsx_config());
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
fn larger_svelte_file_mixes_scripts_blocks_calls_and_style_props() {
    let source = indoc! {r#"
        <script module>
        import { css } from '@panda/css';
        css({ color: 'red' })
        </script>

        <script lang="ts">
        import { Box } from '@panda/jsx';
        import * as Panda from '@panda/jsx';
        import { css as panda } from '@panda/css';

        const color = 'blue'
        const panel = { padding: '4px' }
        const spread = { margin: '8px', class: 'ignored' }
        const items = [1, 2]
        const active = unknown

        $: {
          panda({ borderRadius: '8px' })
        }
        </script>

        <!-- ignored: <Box color="pink" /> -->
        <section>
          <Box color={color} css={panel} {...spread} />
          <Panda.Box padding="12px" />

          {#if active}
            <Box color={active ? 'teal' : 'orange'} />
          {:else}
            <div color="should-not-extract" />
          {/if}

          {#each items as item}
            <Box css={[{ background: 'blue' }]} />
          {/each}

          <p class={panda({ fontWeight: 'bold' })} />
          {@const generated = panda({ opacity: 0.5 })}
        </section>

        <style>
        .ignored { color: {panda({ color: 'purple' })}; }
        </style>
    "#};

    let result = extract(source, "Large.svelte", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          borderRadius: 8px
      - name: css
        data:
          fontWeight: bold
      - name: css
        data:
          opacity: 0.5
    jsx:
      - name: Box
        data:
          color: blue
          css:
            padding: 4px
          margin: 8px
      - name: Box
        data:
          padding: 12px
      - name: Box
        data:
          color:
            kind: conditional
            branches:
              - teal
              - orange
      - name: Box
        data:
          css:
            - background: blue
    ");
}

#[test]
fn snippets_render_and_key_blocks_are_tolerated() {
    let source = indoc! {r#"
        <script>
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';
        const id = 'card'
        </script>

        {#snippet row(item)}
          <Box color="red" />
        {/snippet}

        {#key id}
          <Box padding="4px" />
        {/key}

        {@render row(css({ margin: '8px' }))}
    "#};

    let result = extract(source, "Snippets.svelte", &panda_jsx_config());
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
fn typescript_assertions_in_markup_style_props_fold() {
    let source = indoc! {r#"
        <script lang="ts">
        import { Box } from '@panda/jsx';
        const color = 'red'
        const spacing = '4px'
        </script>

        <Box color={color as string} padding={spacing!} />
    "#};

    let result = extract(source, "TypeScriptMarkup.svelte", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx:
      - name: Box
        data:
          color: red
          padding: 4px
    ");
}

#[test]
fn spans_point_into_the_original_svelte_source() {
    // The mask is a same-length blank-and-copy, so a markup expression keeps its
    // original byte offset: the reported span slices the ORIGINAL `.svelte` verbatim.
    let source = indoc! {r#"
        <script lang="ts">
        import { css } from '@panda/css';
        </script>

        <p class={css({ color: 'red' })} />
    "#};
    let result = extract(source, "Card.svelte", &panda_config());
    assert_eq!(result.calls.len(), 1);
    let span = &result.calls[0].span;
    assert_snapshot!(&source[span.start as usize..span.end as usize], @"css({ color: 'red' })");
}

#[test]
fn jsx_extraction_requires_jsx_framework() {
    let source = indoc! {r#"
        <script>
          import { Box } from '@panda/jsx'
          import Image from 'some-image-lib'
        </script>
        <Box color="red" />
        <Image width="900" height="800" />
    "#};
    let result = extract(source, "Card.svelte", &panda_config());
    let names: Vec<&str> = result.jsx.iter().map(|j| j.name.as_str()).collect();
    assert!(names.is_empty());
}

#[test]
fn uppercase_component_extracts_with_jsx_framework() {
    let source = indoc! {r#"
        <script>
          import { css } from '@panda/css'
          import Image from 'some-image-lib'
          const _ = css({ color: 'red' })
        </script>
        <Image width="900" height="800" />
    "#};
    let result = extract(source, "Card.svelte", &panda_jsx_config());
    let image: Vec<_> = result.jsx.iter().filter(|j| j.name == "Image").collect();
    assert_eq!(image.len(), 1);
    assert_eq!(image[0].data.to_json()["width"], "900");
}
