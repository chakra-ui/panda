mod common;

use common::create_config;
use indoc::indoc;
use insta::assert_snapshot;
use serde_json::json;

use pandacss_system::System;

fn order_warnings(source: &str) -> String {
    let config = create_config(json!({
        "jsxFramework": "react",
        "utilities": {
            "color": { "className": "c" },
            "background": { "className": "bg", "shorthand": "bg" }
        },
        "conditions": {
            "hover": "&:is(:hover, [data-hover])",
            "active": "&:is(:active, [data-active])"
        },
        "theme": { "breakpoints": { "md": "768px", "lg": "1024px" } }
    }));
    let system = System::new(config.clone()).expect("valid config");
    let result = pandacss_compiler::inspect_file_source(&system, &config, "app.tsx", source);
    result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code == "condition_order_by_text")
        .map(|diagnostic| {
            let span = diagnostic.span.expect("span");
            format!(
                "{}\n  at: {}\n  help: {}",
                diagnostic.message,
                &source[span.start as usize..span.end as usize],
                diagnostic.help.as_deref().unwrap_or_default().join(" ")
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn warns_when_a_later_has_condition_sorts_before_an_earlier_one() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          '&:has(> input[aria-invalid=true])': { color: 'red' },
          '&:has(> input:checked)': { color: 'blue' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"
    `&:has(> input:checked)` doesn't override `&:has(> input[aria-invalid=true])` for `color`. Both have the same specificity, so Panda orders them by selector text and `&:has(> input[aria-invalid=true])` comes last.
      at: color: 'blue'
      help: To make `&:has(> input:checked)` win where both match, nest it inside `&:has(> input[aria-invalid=true])`.
    ");
}

#[test]
fn stays_quiet_when_selector_text_matches_the_written_order() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          '&:has(> input:checked)': { color: 'blue' },
          '&:has(> input[aria-invalid=true])': { color: 'red' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"");
}

#[test]
fn stays_quiet_when_specificity_decides_the_winner() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          '&:has(> input:checked)': { color: 'blue' },
          '&:has(> .error)': { color: 'red' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"");
}

#[test]
fn stays_quiet_when_state_rank_decides_the_winner() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          _active: { color: 'black' },
          _hover: { color: 'blue' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"");
}

#[test]
fn stays_quiet_for_different_properties() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          '&[data-z]': { color: 'red' },
          '&[data-a]': { bg: 'blue' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"");
}

#[test]
fn stays_quiet_when_the_condition_is_nested() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          '&[data-z]': {
            color: 'red',
            '&[data-a]': { color: 'blue' },
          },
        })
    "};
    assert_snapshot!(order_warnings(source), @"");
}

#[test]
fn stays_quiet_across_separate_style_objects() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({ '&[data-z]': { color: 'red' } })
        css({ '&[data-a]': { color: 'blue' } })
    "};
    assert_snapshot!(order_warnings(source), @"");
}

#[test]
fn warns_for_the_same_property_written_as_a_shorthand() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          '&[data-z]': { background: 'red' },
          '&[data-a]': { bg: 'blue' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"
    `&[data-a]` doesn't override `&[data-z]` for `background`. Both have the same specificity, so Panda orders them by selector text and `&[data-z]` comes last.
      at: bg: 'blue'
      help: To make `&[data-a]` win where both match, nest it inside `&[data-z]`.
    ");
}

#[test]
fn warns_for_conditions_on_the_value() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          color: { '&[data-z]': 'red', '&[data-a]': 'blue' },
        })
    "};
    assert_snapshot!(order_warnings(source), @"
    `&[data-a]` doesn't override `&[data-z]` for `color`. Both have the same specificity, so Panda orders them by selector text and `&[data-z]` comes last.
      at: color: { '&[data-z]': 'red', '&[data-a]': 'blue' }
      help: To make `&[data-a]` win where both match, nest it inside `&[data-z]`.
    ");
}

#[test]
fn warns_inside_the_same_breakpoint_only() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({
          md: { '&[data-z]': { color: 'red' }, '&[data-a]': { color: 'blue' } },
          lg: { '&[data-y]': { color: 'red' } },
        })
    "};
    assert_snapshot!(order_warnings(source), @"
    `md &[data-a]` doesn't override `md &[data-z]` for `color`. Both have the same specificity, so Panda orders them by selector text and `md &[data-z]` comes last.
      at: color: 'blue'
      help: To make `md &[data-a]` win where both match, nest it inside `md &[data-z]`.
    ");
}

#[test]
fn warns_for_jsx_style_props() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx'
        const a = <styled.div css={{ '&[data-z]': { color: 'red' }, '&[data-a]': { color: 'blue' } }} />
    "};
    assert_snapshot!(order_warnings(source), @"
    `&[data-a]` doesn't override `&[data-z]` for `color`. Both have the same specificity, so Panda orders them by selector text and `&[data-z]` comes last.
      at: color: 'blue'
      help: To make `&[data-a]` win where both match, nest it inside `&[data-z]`.
    ");
}

#[test]
fn stays_quiet_for_a_base_value_and_one_condition() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        css({ color: { base: 'red', '&[data-a]': 'blue' } })
    "};
    assert_snapshot!(order_warnings(source), @"");
}
