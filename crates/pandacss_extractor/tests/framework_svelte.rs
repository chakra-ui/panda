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
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
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
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls:
      - name: css
        data:
          color: red
    jsx:
      - name: Image
        data:
          width: "900"
          height: "800"
    "#);
}

#[test]
fn script_tag_inside_an_html_comment_is_not_a_block() {
    let source = indoc! {r#"
        <!-- <script> -->
        <script lang="ts">
        import { css } from '@panda/css';
        type Log = { id: number };
        const a = css({ color: 'red' });
        </script>
    "#};
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn closing_brace_inside_a_regex_does_not_end_the_expression() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>

        <p>{'a}b'.replace(/}/g, '')}</p>
        <p class={css({ color: 'red' })}>x</p>
    "};
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn comment_marker_inside_script_does_not_hide_the_markup() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        const marker = '<!--';
        const a = css({ color: 'red' });
        </script>

        <p class={css({ color: 'blue' })}>x</p>

        <style>
          .a { color: red }
        </style>
    "};
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          color: blue
    jsx: []
    ");
}

#[test]
fn style_call_after_a_closed_if_block_on_the_same_line_extracts() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>

        {#if open}<span>x</span>{/if}<div class={css({ color: 'red' })}>a</div>
        {#each items as item}<li>{item}</li>{/each}
    "};
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
    jsx: []
    ");
}

#[test]
fn division_after_a_postfix_increment_keeps_the_style_call() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        let n = 1;
        </script>

        <div class={css({ color: 'red', opacity: n++ / 2 })}/>
        <div class={css({ color: 'blue' })}/>
    "};
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          color: blue
    jsx: []
    ");
}

#[test]
fn regex_brace_at_the_start_of_an_attribute_expression_keeps_the_style_call() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>

        <p class={/\}/.test(value) ? css({ color: 'red' }) : ''} />
        <p class={css({ color: 'blue' })} />
    "};
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls:
      - name: css
        data:
          color: red
      - name: css
        data:
          color: blue
    jsx: []
    ");
}

fn svelte_calls(source: &str) -> Vec<String> {
    let result = extract(source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    result
        .calls
        .iter()
        .map(|call| source[call.span.start as usize..call.span.end as usize].to_owned())
        .collect()
}

#[test]
fn negated_attribute_expression_keeps_its_style_call() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>

        <button disabled={!ready} class={!ready ? css({ opacity: 0.5 }) : ''}>go</button>
    "};
    assert_eq!(svelte_calls(source), ["css({ opacity: 0.5 })"]);
}

#[test]
fn declaration_tags_extract_their_style_calls() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>

        {#if open}
          {const panel = css({ padding: '4' })}
          {let count = $state(0), doubled = $derived(count * 2)}
          <div class={panel}>{doubled}</div>
        {/if}
    "};
    assert_eq!(svelte_calls(source), ["css({ padding: '4' })"]);
}

#[test]
fn comment_before_an_expression_is_not_a_block_closer() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>

        <p>{/** @type {any} */ (value).name}</p>
        <p class={css({ color: 'red' })}>x</p>
    "};
    assert_eq!(svelte_calls(source), ["css({ color: 'red' })"]);
}

#[test]
fn script_in_svelte_head_is_page_markup_not_component_code() {
    let source = indoc! {r#"
        <script>
        import { css } from '@panda/css';
        </script>

        <svelte:head>
          <script type="application/ld+json">{ "@type": "Thing" }</script>
        </svelte:head>
        <p class={css({ color: 'red' })}>x</p>
    "#};
    assert_eq!(svelte_calls(source), ["css({ color: 'red' })"]);
}

#[test]
fn angle_bracket_type_assertion_in_the_script_parses_as_typescript() {
    let source = indoc! {r"
        <script lang='ts'>
        import { css } from '@panda/css';
        const flag = <boolean>true;
        </script>

        <p class={flag ? css({ color: 'red' }) : ''}>x</p>
    "};
    assert_eq!(svelte_calls(source), ["css({ color: 'red' })"]);
}

#[test]
fn style_close_tag_with_whitespace_still_ends_the_style() {
    let source = "<script>\nimport { css } from '@panda/css';\n</script>\n<style>\n.a { color: red }\n</style   \n>\n<p class={css({ color: 'red' })}>x</p>\n";
    assert_eq!(svelte_calls(source), ["css({ color: 'red' })"]);
}

#[test]
fn unclosed_brace_stops_reading_without_hanging() {
    let source = format!(
        "<script>\nimport {{ css }} from '@panda/css';\n</script>\n<p class={{css({{ color: 'red' }})}}>x</p>\n{}",
        "<p>{ a </p>".repeat(20_000)
    );
    let result = extract(&source, "Card.svelte", &panda_config());
    assert_eq!(result.calls.len(), 1);
}

#[test]
fn thousands_of_expressions_extract_without_nesting_into_a_call_chain() {
    let source = format!(
        "<script>\nimport {{ css }} from '@panda/css';\n</script>\n{}<p class={{css({{ color: 'red' }})}}>x</p>\n",
        "<p>{a}{b}</p> {c}".repeat(20_000)
    );
    let result = extract(&source, "Card.svelte", &panda_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 1);
}

#[test]
fn quote_inside_a_comment_does_not_hide_the_each_separator() {
    let source = indoc! {r#"
        <script>import { css } from '@panda/css';</script>
        {#each [css({ color: 'red' })] /* " */ as {x = 1}}
          <p>{x}</p>
        {/each}
    "#};
    assert_eq!(svelte_calls(source), ["css({ color: 'red' })"]);
}

#[test]
fn block_keywords_inside_comments_and_regexes_are_not_separators() {
    let source = indoc! {r#"
        <script>import { css } from '@panda/css';</script>
        {#each items.filter((i) => /"/.test(i)) /* as nope */ as item}
          <p class={css({ color: 'red' })}>{item}</p>
        {/each}
        {#await load(/* then */ css({ color: 'blue' })) then value}<p>{value}</p>{/await}
        {#each items as item}{@const { a = '=' } = css({ color: 'green' })}<p>{a}</p>{/each}
    "#};
    assert_eq!(
        svelte_calls(source),
        [
            "css({ color: 'red' })",
            "css({ color: 'blue' })",
            "css({ color: 'green' })"
        ]
    );
}

#[test]
fn style_props_after_a_block_closer_on_the_same_line_extract() {
    let source = indoc! {r#"
        <script>
        import { Box } from '@panda/jsx';
        </script>

        {#if open}<span>a</span>{/if}<Box color="red" />
        {#each items as item}<b>{item}</b>{/each}<Box color="blue" />
    "#};
    let result = extract(source, "Card.svelte", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    let colors: Vec<_> = result
        .jsx
        .iter()
        .map(|jsx| format!("{:?}", jsx.data))
        .collect();
    assert_eq!(colors.len(), 2, "{colors:?}");
}

#[test]
fn member_keyword_before_division_does_not_hide_the_each_separator() {
    let source = "<script>import { css } from '@panda/css'; const obj = {of: 2};</script>\n{#each obj.of / 2 ? [css({color:'red'})] : [] as {x = 1}}<p>{x}</p>{/each}";
    assert_eq!(svelte_calls(source), ["css({color:'red'})"]);
}
