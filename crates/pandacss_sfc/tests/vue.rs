mod common;

use common::{masked, show};
use indoc::indoc;
use insta::{assert_debug_snapshot, assert_snapshot};
use pandacss_sfc::vue;

#[test]
fn script_setup_is_copied_and_markup_is_blanked() {
    let source = indoc! {r#"
        <template><p class="a">hi</p></template>
        <script setup lang="ts">
        import { css } from '@panda/css';
        </script>
        <style>.a { color: red }</style>
    "#};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |
    |import { css } from '@panda/css';
    |
    |
    |
    ");
}

#[test]
fn bound_attributes_and_interpolations_are_copied_in_parentheses() {
    let source = indoc! {r#"
        <template>
          <p :class="css({ color: 'red' })" v-bind:title="label">{{ count + 1 }}</p>
        </template>
    "#};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |           ;(css({ color: 'red' }))             ;(label);(  count + 1 )
    |
    |
    ");
}

#[test]
fn v_for_copies_only_the_iterated_source() {
    let source = indoc! {r#"
        <template>
          <li v-for="(item, index) in items" :key="item.id">{{ item.name }}</li>
        </template>
    "#};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |           ;(                 items)     ;(item.id);(  item.name )
    |
    |
    ");
}

#[test]
fn an_interpolation_ends_at_the_first_closing_braces_like_vue() {
    let source = indoc! {r"
        <template>
          <p>{{ count }}}}</p>
        </template>
    "};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |    ;(  count )
    |
    |
    ");
}

#[test]
fn a_pug_template_is_not_scanned() {
    let source = indoc! {r#"
        <template lang="pug">
        p(:class="css({ color: 'red' })") hi
        </template>
    "#};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |
    |
    |
    ");
}

#[test]
fn a_script_inside_a_comment_is_not_copied() {
    let source = indoc! {r"
        <!-- <script>const hidden = 1</script> -->
        <script>const shown = 1</script>
    "};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |        const shown = 1
    |
    ");
}

#[test]
fn a_comment_marker_in_an_attribute_does_not_hide_the_script() {
    let source = indoc! {r#"
        <template><div title="<!--">x</div></template>
        <script>const shown = 1</script>
    "#};
    assert_snapshot!(show(&masked(source, vue::mask(source))), @"
    |
    |        const shown = 1
    |
    ");
}

#[test]
fn nested_templates_stay_inside_the_root_template_block() {
    let source = indoc! {r#"
        <template>
          <template v-if="ok"><p/></template>
          <p/>
        </template>
        <script>const a = 1</script>
    "#};
    let blocks: Vec<_> = vue::template_blocks(source)
        .iter()
        .map(|block| &source[block.content_start..block.content_end])
        .collect();
    assert_debug_snapshot!(blocks, @r#"
    [
        "\n  <template v-if=\"ok\"><p/></template>\n  <p/>\n",
    ]
    "#);
}

#[test]
fn quoted_expressions_report_each_bound_attribute_and_its_quote() {
    let source = indoc! {r#"
        <template>
          <p :class="css({ color: 'red' })" :title='label' v-if="ok">x</p>
        </template>
    "#};
    let quoted: Vec<_> = vue::quoted_expressions(source)
        .iter()
        .map(|expression| {
            (
                &source[expression.start..expression.end],
                char::from(expression.quote),
            )
        })
        .collect();
    assert_debug_snapshot!(quoted, @r#"
    [
        (
            "css({ color: 'red' })",
            '"',
        ),
        (
            "label",
            '\'',
        ),
        (
            "ok",
            '"',
        ),
    ]
    "#);
}
