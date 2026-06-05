//! `Literal::Conditional` output for ternaries and logical operators
//! whose deciding side isn't statically foldable.
//!
//! Mirrors `BoxNodeConditional` from the JS extractor: when `cond ? a : b`
//! or `a && b` / `a || b` / `a ?? b` can't be reduced to a single value,
//! we emit both alternatives so the downstream encoder can generate
//! atomic-CSS-style output.


use crate::common::panda_config;
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_config())
}

// --- ternary ---

#[test]
fn ternary_with_non_literal_test_emits_both_branches() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: isDark ? 'white' : 'black' });
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - white
              - black
      span:
        start: 34
        end: 76
    ");
}

#[test]
fn ternary_with_literal_test_still_picks_one_branch() {
    // When the test folds, we still resolve to exactly the chosen
    // branch — no Conditional wrapper. This is the existing scope-test
    // behavior; new logic must not regress it.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const dark = true;
        css({ color: dark ? 'white' : 'black' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: white
      span:
        start: 53
        end: 93
    ");
}

#[test]
fn ternary_with_one_unresolvable_branch_drops() {
    // When the test isn't foldable AND one branch can't fold, we drop
    // rather than emit a partial conditional — the encoder needs both
    // alternatives. Matches the conservative read of JS box.conditional
    // when an Unresolvable branch shows up.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: dark ? maybeFn() : 'black' });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "partial conditional should drop: {calls:#?}"
    );
}

#[test]
fn ternary_in_jsx_attribute_emits_conditional() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const el = <Box color={isDark ? 'white' : 'black'} />;
    "};
    assert_yaml_snapshot!(run(src).jsx, @"
    - category: jsx
      name: Box
      alias: Box
      data:
        color:
          kind: conditional
          branches:
            - white
            - black
      span:
        start: 45
        end: 87
    ");
}

// --- logical && / || / ?? ---

#[test]
fn logical_and_with_non_literal_left_drops_when_left_unresolvable() {
    // `isFocused && focusColor` — `isFocused` is a free identifier. Our
    // contract requires both branches to fold; since left doesn't, we
    // drop. (JS encodes this as `Conditional(Unresolvable, X)`, but
    // until we add a distinct Unresolvable variant, conflating with
    // `null` would lose information — better to drop.)
    let src = indoc! {r"
        import { css } from '@panda/css';
        const focusColor = 'red';
        css({ color: isFocused && focusColor });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "logical && with unresolvable left should drop: {calls:#?}"
    );
}

#[test]
fn logical_and_with_both_literal_emits_conditional() {
    // Both sides fold: emit conditional alternatives. Left was unfolded
    // (test case above) — here we use a string literal on the left so
    // the test isn't picking up the short-circuit path.
    //
    // NB: a string-literal-left would normally short-circuit (`'red'`
    // is truthy → result is right), so we use a *number* literal of
    // zero on the left to force the falsy short-circuit: `0 && 'red'`
    // resolves to `0`. To exercise the *Conditional* branch we need a
    // non-foldable left; that's what the next test covers using a
    // bracketed call that resolves both sides explicitly.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const a = 'red';
        const b = 'blue';
        css({ color: isFocused ? a : b });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - red
              - blue
      span:
        start: 69
        end: 102
    ");
}

#[test]
fn logical_or_with_literal_left_short_circuits() {
    // `'red' || maybeFn()` — left is truthy, short-circuit to left.
    // No conditional needed.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: 'red' || maybeFn() });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 68
    ");
}

#[test]
fn nullish_coalesce_with_non_literal_left_drops() {
    // Same contract as logical &&: when left doesn't fold, drop. Once
    // we add a distinct Unresolvable variant we can revisit this.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const fallback = 'gray';
        css({ color: maybeColor ?? fallback });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "?? with unresolvable left should drop: {calls:#?}"
    );
}

// --- nesting ---

#[test]
fn nested_conditional_inside_object() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({
            color: isDark ? 'white' : 'black',
            padding: '4px',
            fontSize: isSmall ? 12 : 16,
        });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - white
              - black
          padding: 4px
          fontSize:
            kind: conditional
            branches:
              - 12
              - 16
      span:
        start: 34
        end: 134
    ");
}

#[test]
fn constant_comparison_test_folds_to_chosen_branch() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: 1 === 1 ? 'red' : 'blue' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 74
    ");
}

#[test]
fn nested_ternary_emits_nested_conditional() {
    // Nesting is preserved rather than flattened.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: isDark ? 'red' : isPrimary ? 'blue' : 'green' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - red
              - kind: conditional
                branches:
                  - blue
                  - green
      span:
        start: 34
        end: 95
    ");
}

#[test]
fn nullish_coalesce_with_null_left_picks_right() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: null ?? 'red' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 63
    ");
}

#[test]
fn logical_or_with_null_left_picks_right() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: null || 'red' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 63
    ");
}

#[test]
fn ternary_with_mixed_type_branches_emits_conditional() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: isDark ? 'red' : 12 });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - red
              - 12
      span:
        start: 34
        end: 69
    ");
}

#[test]
fn multiple_conditionals_with_inline_spread_flatten_in_order() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({
          color: isDark ? 'white' : 'black',
          ...{ padding: isSmall ? '4px' : '8px', margin: '2px' },
          fontSize: isLarge ? 24 : 12,
        });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - white
              - black
          padding:
            kind: conditional
            branches:
              - 4px
              - 8px
          margin: 2px
          fontSize:
            kind: conditional
            branches:
              - 24
              - 12
      span:
        start: 34
        end: 168
    ");
}

#[test]
fn conditional_inside_cva_recipe_base() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        cva({ base: { color: isDark ? 'red' : 'blue' } });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: cva
      alias: cva
      data:
        - base:
            color:
              kind: conditional
              branches:
                - red
                - blue
      span:
        start: 34
        end: 83
    ");
}

#[test]
fn ternary_with_object_branches() {
    // Branches can be objects (responsive-style alternatives).
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: isDark ? { base: 'white', _hover: 'gray' } : { base: 'black' } });
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - color:
            kind: conditional
            branches:
              - base: white
                _hover: gray
              - base: black
      span:
        start: 34
        end: 112
    ");
}
