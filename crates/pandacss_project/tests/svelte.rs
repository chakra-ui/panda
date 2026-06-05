use crate::common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use serde_json::json;

#[test]
fn script_and_markup_expressions_feed_the_encoder() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Card.svelte",
        indoc! {r#"
            <script lang="ts">
              import { css } from '@panda/css';
            </script>

            <section class={css({ color: 'red', margin: '8px' })}>
              {css({ padding: '4px' })}
            </section>
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 2);
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
fn module_and_instance_scripts_are_preserved() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Scripts.svelte",
        indoc! {r"
            <script module>
              import { css as pandaCss } from '@panda/css';
              const root = pandaCss({ color: 'red' })
            </script>

            <script>
              import { css } from '@panda/css';
              const child = css({ padding: '4px' })
            </script>

            <section class={root}>
              <span class={child}>Hello</span>
            </section>
        "},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 2);
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
fn comments_styles_and_control_blocks_do_not_extract() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Ignored.svelte",
        indoc! {r"
            <script>
              import { css } from '@panda/css';
              const ready = true
            </script>

            <style>
              .ignored { color: {css({ color: 'red' })}; }
            </style>

            <!-- {css({ margin: '8px' })} -->
            {#if ready}
              <div>{css({ padding: '4px' })}</div>
            {:else}
              <div>empty</div>
            {/if}
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
fn block_header_expressions_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Blocks.svelte",
        indoc! {r"
            <script>
              import { css } from '@panda/css';
              const ready = true
            </script>

            {#if ready && css({ color: 'red' })}
              <div>ready</div>
            {:else if css({ padding: '4px' })}
              <div>fallback</div>
            {/if}

            {#each css({ margin: '8px' }) as item}
              <span>{item}</span>
            {/each}
        "},
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
fn event_action_class_and_special_tag_expressions_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Expressions.svelte",
        indoc! {r#"
            <script lang="ts">
              import { css } from '@panda/css';
              const action = () => {}
            </script>

            <button
              class:active={css({ color: 'red' })}
              use:action={css({ padding: '4px' })}
              on:click={(event: MouseEvent) => {
                css({ margin: '8px' })
              }}
            />

            {@const generated = css({ background: 'blue' })}
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 4);
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
fn component_style_props_are_extracted_from_markup_attrs() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "StyleProps.svelte",
        indoc! {r#"
            <script>
              import { Box } from '@panda/jsx';
            </script>

            <Box color="red" padding="4px" />
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
fn component_expression_style_props_and_spreads_are_extracted() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "ExpressionStyleProps.svelte",
        indoc! {r#"
            <script lang="ts">
              import { Box } from '@panda/jsx';
            </script>

            <Box
              color={'red'}
              css={{ padding: '4px' }}
              {...{ margin: '8px', background: 'blue' }}
            />
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
fn script_constants_resolve_in_markup_style_props() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "ResolvedStyleProps.svelte",
        indoc! {r#"
            <script lang="ts">
              import { Box } from '@panda/jsx';

              const color = 'red'
              const panel = { padding: '4px' }
              const layout = { margin: '8px', background: 'blue' }
            </script>

            <Box color={color} css={panel} {...layout} />
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
fn module_reactive_await_and_special_tags_are_tolerated() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "LegacySyntax.svelte",
        indoc! {r#"
            <script context="module">
              import { css } from '@panda/css';
              let moduleStyle = css({ color: 'red' })
            </script>

            <script>
              import { css as localCss } from '@panda/css';
              const promise = Promise.resolve('ok')
              $: {
                localCss({ padding: '4px' })
              }
            </script>

            {@html post.content}
            {@debug}

            {#await promise}
              <p class={localCss({ margin: '8px' })}>pending</p>
            {:then value}
              <p>{value}</p>
            {:catch error}
              <p class={localCss({ background: 'blue' })}>{error.message}</p>
            {/await}
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 4);
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
fn native_svelte_tags_do_not_extract_style_props() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Native.svelte",
        indoc! {r#"
            <script>
              import { Box } from '@panda/jsx';
            </script>

            <div color="red" padding="4px" />
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.jsx_usages, 0);
    assert!(project.atoms().is_empty());
}

#[test]
fn markup_style_props_follow_minimal_jsx_style_prop_mode() {
    let mut project = create_project(json!({
        "jsxStyleProps": "minimal"
    }));
    let report = project.parse_file(
        "Minimal.svelte",
        indoc! {r#"
            <script>
              import { Box } from '@panda/jsx';
            </script>

            <Box color="red" css={{ padding: '4px' }} />
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
        "Namespace.svelte",
        indoc! {r#"
            <script>
              import * as Panda from '@panda/jsx';
            </script>

            <Panda.Box color="red" padding="4px" />
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
fn js_style_comments_in_markup_tags_are_ignored() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "TagComments.svelte",
        indoc! {r"
            <script>
              import { css } from '@panda/css';
            </script>

            <div
              // {css({ color: 'red' })}
              /* {css({ margin: '8px' })} */
              class={css({ padding: '4px' })}
            />
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
fn nested_braces_inside_strings_do_not_close_markup_expressions() {
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "Nested.svelte",
        indoc! {r#"
            <script>
              import { css } from '@panda/css';
            </script>

            <div class={css({
              color: 'red',
              padding: '4px',
            }) + "{not a block}"} />
        "#},
    );

    assert!(report.diagnostics.is_empty());
    assert_eq!(report.css_calls, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}
