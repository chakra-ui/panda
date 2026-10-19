mod common;

use common::{masked, show};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_sfc::svelte;

#[test]
fn script_is_copied_and_style_is_blanked() {
    let source = indoc! {r"
        <script>
        import { css } from '@panda/css';
        </script>
        <p>hi</p>
        <style>.a { color: red }</style>
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |
    |import { css } from '@panda/css';
    |
    |
    |
    |
    ");
}

#[test]
fn attribute_and_text_expressions_are_copied_in_parentheses() {
    let source = indoc! {r"
        <p class={css({ color: 'red' })} {...rest}>{count + 1}</p>
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |        ;(css({ color: 'red' }));(   rest);(count + 1)
    |
    ");
}

#[test]
fn block_tags_copy_only_their_expression() {
    let source = indoc! {r"
        {#if open}<b/>{:else if size > 2}<i/>{/if}
        {#each items as item}<li/>{/each}
        {@html markup}
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |(    open)   ;(         size > 2)        ;
    |(      items        )           ;
    |(      markup)
    |
    ");
}

#[test]
fn a_closer_followed_by_markup_on_the_same_line_does_not_start_a_regex() {
    let source = indoc! {r"
        {#if open}<span>x</span>{/if}<div class={css({ color: 'red' })}>a</div>
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |(    open)                             ;(css({ color: 'red' }))
    |
    ");
}

#[test]
fn a_regex_at_the_start_of_an_attribute_expression_is_kept() {
    let source = indoc! {r"
        <p class={/\}/.test(value) ? css({ color: 'red' }) : ''} />
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @r"
    |        ;(/\}/.test(value) ? css({ color: 'red' }) : '')
    |
    ");
}

#[test]
fn division_after_a_postfix_increment_stays_in_the_expression() {
    let source = indoc! {r"
        <div class={css({ opacity: n++ / 2 })}/>
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |          ;(css({ opacity: n++ / 2 }))
    |
    ");
}

#[test]
fn a_script_inside_a_comment_is_not_copied() {
    let source = indoc! {r"
        <!-- <script>const hidden = 1</script> -->
        <script>const shown = 1</script>
    "};
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |
    |        const shown = 1
    |
    ");
}

#[test]
fn adjacent_expressions_share_one_sequence() {
    let source = "<p>{a}{b}{css({ color: 'red' })}</p>\n";
    assert_snapshot!(show(&masked(source, svelte::mask(source))), @"
    |  ;(a, b, css({ color: 'red' }))
    |
    ");
}
