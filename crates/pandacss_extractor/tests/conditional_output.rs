//! Ternaries and logical operators whose test isn't static emit every
//! possible value as a `conditional` so each one gets CSS.

use crate::common::{panda_config, panda_jsx_config};
use indoc::{formatdoc, indoc};
use insta::assert_yaml_snapshot;
use pandacss_extractor::{ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_config())
}

fn run_jsx(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_jsx_config())
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
fn ternary_with_one_unresolvable_branch_keeps_the_resolvable_one() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: dark ? maybeFn() : 'black' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: black
      span:
        start: 34
        end: 76
    ");
}

#[test]
fn ternary_with_unresolvable_alternate_keeps_the_consequent() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: dark ? 'red' : maybeFn() });
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
fn ternary_with_equal_branches_collapses_to_a_single_value() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: dark ? 'red' : 'red' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 70
    ");
}

#[test]
fn ternary_with_dynamic_test_and_const_branches_emits_conditional() {
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
fn ternary_in_jsx_attribute_emits_conditional() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const el = <Box color={isDark ? 'white' : 'black'} />;
    "};
    assert_yaml_snapshot!(run_jsx(src).jsx, @"
    - category: jsx
      kind: component
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
fn dynamic_logical_initializers_do_not_make_comparisons_constant() {
    let results: Vec<_> = ["??", "||", "&&"]
        .into_iter()
        .map(|operator| {
            let source = formatdoc! {r"
                import {{ css }} from '@panda/css';

                const count = data.count {operator} 0;
                const alias = count;
                css({{ color: alias > 0 ? 'green' : 'gray' }});
            ", operator = operator};
            let usage = run(&source);

            serde_json::json!({ "operator": operator, "data": usage.calls[0].data })
        })
        .collect();

    assert_yaml_snapshot!(results, @r#"
    - operator: "??"
      data:
        - color:
            kind: conditional
            branches:
              - green
              - gray
    - operator: "||"
      data:
        - color:
            kind: conditional
            branches:
              - green
              - gray
    - operator: "&&"
      data:
        - color:
            kind: conditional
            branches:
              - green
              - gray
    "#);
}

#[test]
fn jsx_ternary_after_a_dynamic_nullish_default_keeps_both_branches() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx';

        export function Badge({ data }: { data: { count?: number } }) {
          const count = data.count ?? 0;

          return <styled.span css={{ bg: count > 0 ? 'green.500' : 'gray.500' }} />;
        }
    "};
    let usage = run_jsx(source);

    assert_yaml_snapshot!(usage.jsx[0].data, @r"
    css:
      bg:
        kind: conditional
        branches:
          - green.500
          - gray.500
    ");
}

#[test]
fn destructured_nullish_defaults_do_not_make_comparisons_constant() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const { count } = { count: data.count ?? 0, display: 'flex' };
        css({ color: count > 0 ? 'green' : 'gray' });
    "};
    let usage = run(source);

    assert_yaml_snapshot!(usage.calls[0].data, @r"
    - color:
        kind: conditional
        branches:
          - green
          - gray
    ");
}

#[test]
fn dynamic_logical_style_bindings_still_extract_the_fallback() {
    let results: Vec<_> = ["??", "||", "&&"]
        .into_iter()
        .map(|operator| {
            let source = formatdoc! {r"
                import {{ css }} from '@panda/css';

                const color = data.color {operator} 'gray';
                css({{ color }});
            ", operator = operator};
            let usage = run(&source);

            serde_json::json!({ "operator": operator, "data": usage.calls[0].data })
        })
        .collect();

    assert_yaml_snapshot!(results, @r#"
    - operator: "??"
      data:
        - color: gray
    - operator: "||"
      data:
        - color: gray
    - operator: "&&"
      data:
        - color: gray
    "#);
}

#[test]
fn static_nullish_defaults_still_fold_with_javascript_semantics() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const count = null ?? 3;
        const zero = 0 ?? 3;
        const flag = false ?? true;
        const empty = '' ?? 'fallback';
        const missing = undefined ?? 'block';

        css({
          color: count > 0 ? 'green' : 'gray',
          bg: zero > 0 ? 'green' : 'gray',
          opacity: flag ? 1 : 0,
          content: empty,
          display: missing,
        });
    "};
    let usage = run(source);

    assert_yaml_snapshot!(usage.calls[0].data, @r#"
    - color: green
      bg: gray
      opacity: 0
      content: ""
      display: block
    "#);
}

#[test]
fn logical_and_with_unresolvable_left_emits_right_operand() {
    // `isFocused && focusColor` — `isFocused` is the dynamic condition, not a
    // style alternative. The extractable style is the right operand (matches
    // node, which evaluates this to the right side).
    let src = indoc! {r"
        import { css } from '@panda/css';
        const focusColor = 'red';
        css({ color: isFocused && focusColor });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 60
        end: 99
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
fn logical_or_with_unresolvable_left_emits_right_operand() {
    // `maybeColor || fallback` — dynamic left, so emit the right operand.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const fallback = 'gray';
        css({ color: maybeColor || fallback });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: gray
      span:
        start: 59
        end: 97
    ");
}

#[test]
fn nullish_coalesce_with_unresolvable_left_emits_right_operand() {
    // Same as `&&`: a dynamic left isn't a style alternative; emit the right
    // operand (the fallback), matching node.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const fallback = 'gray';
        css({ color: maybeColor ?? fallback });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: gray
      span:
        start: 59
        end: 97
    ");
}

// --- conditional spreads ---

#[test]
fn logical_and_spread_merges_the_right_operand_object() {
    // `...(unk && { padding: '1' })` — node always extracts the spread object;
    // the `&&` resolves to its right operand, which merges into the parent.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: 'red', ...(unk && { padding: '1' }) });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding: "1"
      span:
        start: 34
        end: 85
    "#);
}

#[test]
fn logical_or_spread_merges_the_right_operand_object() {
    // `...(unk || { padding: '1' })` — same: emit the right operand and merge.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: 'red', ...(unk || { padding: '1' }) });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding: "1"
      span:
        start: 34
        end: 85
    "#);
}

#[test]
fn ternary_spread_with_same_key_emits_conditional_value() {
    // `...(cond ? { padding: '1' } : { padding: '2' })` — node tracks each branch
    // as a separate spreadCondition; the union is both values, so the key folds
    // to a Conditional the encoder expands.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: 'red', ...(unk ? { padding: '1' } : { padding: '2' }) });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding:
            kind: conditional
            branches:
              - "1"
              - "2"
      span:
        start: 34
        end: 103
    "#);
}

#[test]
fn ternary_spread_with_distinct_keys_merges_both_branches() {
    // Distinct keys: each branch contributes its own key unconditionally (both
    // are separately applicable).
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: 'red', ...(unk ? { padding: '1' } : { margin: '2' }) });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding: "1"
          margin: "2"
      span:
        start: 34
        end: 102
    "#);
}

#[test]
fn ternary_spread_colliding_with_static_parent_unions_all_values() {
    // The static `padding: '0'` is overridden at runtime, but Panda's static
    // extraction conservatively emits every possibly-applied value, so the
    // union is 0, 1, 2 (matches node's raw + spreadConditions).
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ padding: '0', ...(unk ? { padding: '1' } : { padding: '2' }) });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - padding:
            kind: conditional
            branches:
              - "0"
              - "1"
              - "2"
      span:
        start: 34
        end: 103
    "#);
}

#[test]
fn ternary_spread_before_a_colliding_static_key_still_unions_all_values() {
    // Spread *before* the static override of the same key: at runtime `padding`
    // is always '0', but static extraction is order-independent and emits every
    // possibly-applied value (0, 1, 2), matching node's separate spreadConditions.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ ...(unk ? { padding: '1' } : { padding: '2' }), padding: '0' });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - padding:
            kind: conditional
            branches:
              - "0"
              - "1"
              - "2"
      span:
        start: 34
        end: 103
    "#);
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
fn nested_ternary_with_static_tests_folds_to_one_branch() {
    // Both tests are statically known, so the chain folds to a single value
    // (the middle branch) — no Conditional.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: false ? 'a' : true ? 'b' : 'c' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: b
      span:
        start: 34
        end: 80
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

#[test]
fn nested_const_spread_keeps_conditional_encode_data() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const styles = {
          _hover: {
            ...(isActive ? { color: 'red' } : { color: 'blue' }),
          },
        };
        css({ ...styles });
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - _hover:
            color:
              kind: conditional
              branches:
                - red
                - blue
      span:
        start: 129
        end: 147
    ");
}

#[test]
fn array_mid_slot_ternary_projects_conditional_at_index() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ padding: [2, condensed ? 2 : 3, 4] });
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - padding:
            - 2
            - kind: conditional
              branches:
                - 2
                - 3
            - 4
      span:
        start: 34
        end: 77
    ");
}

#[test]
fn member_hop_projects_nested_conditional() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const styles = { hover: { color: isActive ? 'red' : 'blue' } };
        css({ ...styles.hover });
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
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
        start: 98
        end: 122
    ");
}

// --- tests that read a value set by a dynamic ternary ---

#[test]
fn comparing_a_ternary_initialized_variable_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        css({ bg: tone === 'quiet' ? 'blue.500' : 'orange.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - blue.500
          - orange.500
    ");
}

#[test]
fn loosely_comparing_a_ternary_initialized_variable_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        css({ bg: tone != 'quiet' ? 'orange.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - orange.500
          - blue.500
    ");
}

#[test]
fn ordering_a_ternary_initialized_number_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const size = large ? 2 : 1;
        css({ p: size > 1 ? '8' : '4' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @r#"
    - p:
        kind: conditional
        branches:
          - "8"
          - "4"
    "#);
}

#[test]
fn a_boolean_set_by_a_ternary_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = active ? true : false;
        css({ bg: flag ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn negating_a_boolean_set_by_a_ternary_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = active ? true : false;
        css({ bg: !flag ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn a_boolean_with_one_dynamic_branch_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = a ? !b : false;
        css({ bg: flag ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn a_boolean_with_one_dynamic_branch_first_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = a ? false : !b;
        css({ bg: flag ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn a_jsx_ternary_on_a_ternary_initialized_variable_keeps_both_branches() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx';

        export const App = ({ loud }: { loud?: boolean }) => {
          const tone = loud ? 'loud' : 'quiet';
          return <styled.div bg={tone === 'quiet' ? 'blue.500' : 'orange.500'} />;
        };
    "};
    assert_yaml_snapshot!(run_jsx(source).jsx[0].data, @"
    bg:
      kind: conditional
      branches:
        - blue.500
        - orange.500
    ");
}

#[test]
fn a_test_every_branch_agrees_on_still_picks_one_branch() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        css({ bg: tone ? 'blue.500' : 'orange.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"- bg: blue.500");
}

#[test]
fn a_style_value_with_one_dynamic_branch_still_extracts_the_static_one() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const color = active ? 'red.500' : props.color;
        css({ color });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"- color: red.500");
}

#[test]
fn nullish_default_on_a_value_that_may_be_null_keeps_both_values() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const color = active ? null : 'red.500';
        css({ color: color ?? 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - color:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn or_default_on_a_value_that_may_be_empty_keeps_both_values() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const size = compact ? '' : 'lg';
        css({ fontSize: size || 'md' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - fontSize:
        kind: conditional
        branches:
          - lg
          - md
    ");
}

#[test]
fn and_guard_on_a_boolean_set_by_a_ternary_keeps_the_style() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const show = active ? true : false;
        css({ color: show && 'red.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"- color: red.500");
}

#[test]
fn double_negating_a_boolean_set_by_a_ternary_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = active ? 1 : 0;
        css({ bg: !!flag ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn loosely_comparing_a_ternary_boolean_to_true_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = active ? true : false;
        css({ bg: flag == true ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn a_nested_ternary_whose_branches_all_agree_still_picks_one_branch() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const level = a ? (b ? 1 : 2) : 3;
        css({ bg: level > 0 ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"- bg: red.500");
}

#[test]
fn a_nested_ternary_whose_branches_disagree_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const level = a ? (b ? 1 : 2) : 3;
        css({ bg: level > 1 ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn comparing_two_ternary_initialized_variables_keeps_both_branches() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const left = a ? 'x' : 'y';
        const right = b ? 'x' : 'z';
        css({ bg: left === right ? 'red.500' : 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn a_chain_of_comparisons_on_a_ternary_initialized_variable_keeps_every_branch() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        css({ bg: tone === 'loud' ? 'red.500' : tone === 'quiet' ? 'blue.500' : 'gray.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - red.500
          - kind: conditional
            branches:
              - blue.500
              - gray.500
    ");
}

#[test]
fn an_and_spread_guarded_by_a_ternary_boolean_keeps_the_spread() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = active ? true : false;
        css({ bg: 'gray.500', ...(flag && { color: 'red.500' }) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg: gray.500
      color: red.500
    ");
}

#[test]
fn a_ternary_spread_tested_on_a_ternary_boolean_keeps_both_spreads() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const flag = active ? true : false;
        css({ ...(flag ? { color: 'red.500' } : { color: 'blue.500' }) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - color:
        kind: conditional
        branches:
          - red.500
          - blue.500
    ");
}

#[test]
fn a_helper_called_with_a_ternary_initialized_argument_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const pad = (size: string) => (size === 'lg' ? '8' : '4');
        const size = big ? 'lg' : 'sm';
        css({ p: pad(size) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @r#"
    - p:
        kind: conditional
        branches:
          - "8"
          - "4"
    "#);
}

#[test]
fn a_recipe_prop_tested_on_a_ternary_initialized_variable_keeps_both_variants() {
    let source = indoc! {r"
        import { button } from '@panda/recipes';

        const tone = loud ? 'loud' : 'quiet';
        button({ size: tone === 'quiet' ? 'sm' : 'lg' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - size:
        kind: conditional
        branches:
          - sm
          - lg
    ");
}

#[test]
fn nullish_default_on_a_value_null_on_every_path_picks_the_default() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const color = active ? null : undefined;
        css({ color: color ?? 'blue.500' });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"- color: blue.500");
}

#[test]
fn a_helper_with_too_many_argument_combinations_is_left_unknown() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const pick = (a, b, c, d, e, f, g) => `${a}${b}${c}${d}${e}${f}${g}px`;
        const v = x ? 1 : 2;
        css({ p: pick(v, v, v, v, v, v, v) });
    "};
    assert_yaml_snapshot!(run(source).calls, @"[]");
}

#[test]
fn a_helper_branching_on_one_of_many_ternary_arguments_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const pick = (a, b, c, d, e, f, g) => (a === 1 ? '8' : '4');
        const v = x ? 1 : 2;
        css({ p: pick(v, v, v, v, v, v, v) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @r#"
    - p:
        kind: conditional
        branches:
          - "8"
          - "4"
    "#);
}

#[test]
fn a_helper_within_the_argument_combination_limit_keeps_every_result() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const pick = (a, b) => (a === b ? '8' : '4');
        const left = x ? 1 : 2;
        const right = y ? 1 : 3;
        css({ p: pick(left, right) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @r#"
    - p:
        kind: conditional
        branches:
          - "8"
          - "4"
    "#);
}

#[test]
fn a_helper_reading_a_captured_ternary_variable_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        const color = () => (tone === 'quiet' ? 'blue.500' : 'orange.500');
        css({ bg: color() });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - orange.500
          - blue.500
    ");
}

#[test]
fn a_helper_function_copying_a_captured_ternary_into_a_local_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        function color() {
          const current = tone;
          return current === 'quiet' ? 'blue.500' : 'orange.500';
        }
        css({ bg: color() });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - orange.500
          - blue.500
    ");
}

#[test]
fn a_helper_reading_a_ternary_inside_a_captured_object_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const theme = { tone: loud ? 'loud' : 'quiet' };
        const color = () => (theme.tone === 'quiet' ? 'blue.500' : 'orange.500');
        css({ bg: color() });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - orange.500
          - blue.500
    ");
}

#[test]
fn a_helper_calling_a_helper_that_reads_a_captured_ternary_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        const base = () => (tone === 'quiet' ? 'blue.500' : 'orange.500');
        const color = () => base();
        css({ bg: color() });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - orange.500
          - blue.500
    ");
}

#[test]
fn a_helper_given_an_object_with_a_ternary_field_keeps_both_results() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const pad = ({ size }) => (size === 'lg' ? '8' : '4');
        css({ p: pad({ size: big ? 'lg' : 'sm' }) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @r#"
    - p:
        kind: conditional
        branches:
          - "8"
          - "4"
    "#);
}

#[test]
fn a_helper_reading_a_captured_ternary_and_a_ternary_argument_keeps_every_result() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'loud' : 'quiet';
        const color = (strong) => (tone === 'quiet' ? (strong ? 'blue.700' : 'blue.500') : 'orange.500');
        css({ bg: color(bold ? true : false) });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - orange.500
          - blue.700
          - blue.500
    ");
}

#[test]
fn a_helper_returning_a_captured_ternary_unchanged_keeps_both_values() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        const tone = loud ? 'blue.500' : 'orange.500';
        const color = () => tone;
        css({ bg: color() });
    "};
    assert_yaml_snapshot!(run(source).calls[0].data, @"
    - bg:
        kind: conditional
        branches:
          - blue.500
          - orange.500
    ");
}
