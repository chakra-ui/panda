//! Phase 5 scope-resolution tests.
//!
//! Exercises identifier / member-access / destructuring resolution and
//! function-parameter shadowing — the surfaces that flipped on with
//! `oxc_semantic` integration. These tests use the combined `extract()`
//! entrypoint so the resolver is always present.

use crate::common::{panda_config, panda_jsx_config};
use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};
use pandacss_extractor::{ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_config())
}

fn run_jsx(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_jsx_config())
}

// --- identifier reference resolution ---

#[test]
fn const_string_identifier_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const w = '5px';
        css({ width: w });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - width: 5px
      span:
        start: 51
        end: 68
    ");
}

#[test]
fn const_object_identifier_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const styles = { color: 'red', padding: '4px' };
        css(styles);
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding: 4px
      span:
        start: 83
        end: 94
    ");
}

#[test]
fn chained_identifiers_resolve_transitively() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const w = '5px';
        const styles = { width: w };
        css(styles);
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - width: 5px
      span:
        start: 80
        end: 91
    ");
}

#[test]
fn chained_css_raw_spreads_resolve_transitively() {
    // Grounded in JS `css-raw-spread.test.ts` › "handles spreading across
    // multiple files": sharedStyles → buttonStyles (spreads shared) → button
    // (spreads buttonStyles, incl. a nested `_hover` re-spread). Each `css.raw`
    // const folds and merges through the chain.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const sharedStyles = css.raw({
          fontFamily: 'sans-serif',
          lineHeight: 1.5
        })
        export const buttonStyles = css.raw({
          ...sharedStyles,
          padding: '8px 16px',
          borderRadius: '4px'
        })
        const button = css({
          ...buttonStyles,
          backgroundColor: 'blue.500',
          _hover: {
            ...buttonStyles,
            backgroundColor: 'blue.600'
          }
        })
    "};
    // Assert the final css() call's merged data (the JS fixture's 3rd entry).
    // Key order is source-insertion order here vs. the JS snapshot's sorted
    // keys — same keys/values.
    let calls = run(src).calls;
    let last = calls.last().expect("final css() call");
    assert_yaml_snapshot!(last.data, @"
    - fontFamily: sans-serif
      lineHeight: 1.5
      padding: 8px 16px
      borderRadius: 4px
      backgroundColor: blue.500
      _hover:
        fontFamily: sans-serif
        lineHeight: 1.5
        padding: 8px 16px
        borderRadius: 4px
        backgroundColor: blue.600
    ");
}

#[test]
fn css_raw_spread_in_cva_base_folds() {
    // Grounded in JS `css-raw-variants.test.ts` › "spreads css.raw in cva base
    // styles": the css.raw const spreads into the cva `base` before extraction.
    let src = indoc! {r"
        import { css, cva } from '@panda/css';
        const baseStyles = css.raw({ display: 'flex', alignItems: 'center', gap: '2' });
        const button = cva({
          base: { ...baseStyles, padding: '2', borderRadius: 'md' },
          variants: { size: { sm: { fontSize: 'sm' }, lg: { fontSize: 'lg' } } }
        });
    "};
    let calls = run(src).calls;
    let recipe = calls.iter().find(|c| c.name == "cva").expect("cva call");
    assert_yaml_snapshot!(recipe.data, @r#"
    - base:
        display: flex
        alignItems: center
        gap: "2"
        padding: "2"
        borderRadius: md
      variants:
        size:
          sm:
            fontSize: sm
          lg:
            fontSize: lg
    "#);
}

#[test]
fn css_raw_spread_in_arbitrary_selectors_folds() {
    // Grounded in JS `css-raw-spread.test.ts` › "handles spreading css.raw in
    // arbitrary selectors": resetStyles spreads at top level and into `& li`,
    // a nested `&:hover`, and a `[data-selected]` selector object.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const resetStyles = css.raw({ margin: 0, padding: 0, boxSizing: 'border-box' });
        const listStyles = css({
          ...resetStyles,
          listStyle: 'none',
          '& li': {
            ...resetStyles,
            display: 'block',
            '&:hover': { ...resetStyles, background: 'gray.50' }
          },
          '[data-selected]': { ...resetStyles, fontWeight: 'bold' }
        });
    "};
    let calls = run(src).calls;
    let last = calls.last().expect("final css() call");
    assert_yaml_snapshot!(last.data, @r#"
    - margin: 0
      padding: 0
      boxSizing: border-box
      listStyle: none
      "& li":
        margin: 0
        padding: 0
        boxSizing: border-box
        display: block
        "&:hover":
          margin: 0
          padding: 0
          boxSizing: border-box
          background: gray.50
      "[data-selected]":
        margin: 0
        padding: 0
        boxSizing: border-box
        fontWeight: bold
    "#);
}

#[test]
fn let_unmutated_resolves() {
    // `let` is fine for static folding when not reassigned — same call
    // ts-evaluator makes.
    let src = indoc! {r"
        import { css } from '@panda/css';
        let color = 'red';
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 53
        end: 67
    ");
}

#[test]
fn let_mutated_drops_resolution() {
    // Mutation invalidates folding: the value at the call site isn't the
    // initializer. We bail rather than guess.
    let src = indoc! {r"
        import { css } from '@panda/css';
        let color = 'red';
        color = 'blue';
        css({ color });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "mutated `let` must not extract; got {calls:#?}"
    );
}

#[test]
fn var_unmutated_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        var color = 'red';
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 53
        end: 67
    ");
}

// --- shorthand property assignment ---

#[test]
fn shorthand_property_resolves_via_resolver() {
    // `{ color }` is `{ color: color }` — the value side is an Identifier
    // which the resolver folds.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const color = 'red';
        css({ color, padding: '4px' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding: 4px
      span:
        start: 55
        end: 85
    ");
}

// --- property access ---

#[test]
fn static_member_access_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { colors: { red: '#f00' } };
        css({ color: tokens.colors.red });
    "};
    assert_yaml_snapshot!(run(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#f00"
      span:
        start: 78
        end: 111
    "##);
}

#[test]
fn missing_member_drops_call() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { colors: { red: '#f00' } };
        css({ color: tokens.colors.blue });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "missing member should not yield a partial call: {calls:#?}"
    );
}

// --- element / computed access ---

#[test]
fn computed_string_key_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const colors = { red: '#f00', blue: '#00f' };
        css({ color: colors['red'] });
    "};
    assert_yaml_snapshot!(run(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#f00"
      span:
        start: 80
        end: 109
    "##);
}

#[test]
fn computed_identifier_key_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const colors = { red: '#f00' };
        const key = 'red';
        css({ color: colors[key] });
    "};
    assert_yaml_snapshot!(run(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#f00"
      span:
        start: 85
        end: 112
    "##);
}

#[test]
fn computed_style_object_key_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const prop = 'color';
        css({ [prop]: 'red' });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_snapshot!(serde_json::to_string_pretty(&json).unwrap(), @r#"
    {
      "color": "red"
    }
    "#);
}

#[test]
fn computed_style_object_key_resolves_inside_condition() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const condition = '_hover';
        const prop = 'color';
        css({ [condition]: { [prop]: 'red' } });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_snapshot!(serde_json::to_string_pretty(&json).unwrap(), @r#"
    {
      "_hover": {
        "color": "red"
      }
    }
    "#);
}

#[test]
fn array_numeric_index_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const sizes = ['4px', '8px', '12px'];
        css({ padding: sizes[1] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - padding: 8px
      span:
        start: 72
        end: 98
    ");
}

#[test]
fn inline_array_literal_numeric_index_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: ['red', 'blue'][0] });
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
fn inline_array_literal_indexed_by_identifier_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const i = 1;
        css({ color: ['red', 'blue'][i] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: blue
      span:
        start: 47
        end: 81
    ");
}

#[test]
fn array_string_numeric_index_resolves() {
    // A string index that names a numeric position (`"1"`) reads the element.
    let src = indoc! {r#"
        import { css } from '@panda/css';
        css({ color: ['red', 'blue']["1"] });
    "#};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: blue
      span:
        start: 34
        end: 70
    ");
}

#[test]
fn inline_object_literal_element_access_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: ({ a: 'red' })['a'] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 69
    ");
}

#[test]
fn element_access_with_concatenated_key_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const m = { ab: 'red' };
        css({ color: m['a' + 'b'] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 59
        end: 87
    ");
}

#[test]
fn element_access_with_template_key_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const m = { ab: 'red' };
        css({ color: m[`a${'b'}`] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 59
        end: 87
    ");
}

#[test]
fn element_access_with_key_from_another_object_resolves() {
    // The access key is itself a member access (`w.k` -> "a").
    let src = indoc! {r"
        import { css } from '@panda/css';
        const m = { a: 'red' };
        const w = { k: 'a' };
        css({ color: m[w.k] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 80
        end: 102
    ");
}

// --- destructuring ---

#[test]
fn object_destructure_resolves_member() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { color: 'red', padding: '4px' };
        const { color } = tokens;
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 109
        end: 123
    ");
}

#[test]
fn object_destructure_with_rename_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { primary: 'red' };
        const { primary: color } = tokens;
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 104
        end: 118
    ");
}

#[test]
fn object_destructure_rest_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { color: 'red', padding: '4px', margin: '8px' };
        const { color, ...space } = tokens;
        css(space);
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - padding: 4px
          margin: 8px
      span:
        start: 134
        end: 144
    ");
}

#[test]
fn object_destructure_computed_key_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { primary: 'red' };
        const key = 'primary';
        const { [key]: color } = tokens;
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 125
        end: 139
    ");
}

#[test]
fn array_destructure_resolves_index() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const sizes = ['4px', '8px'];
        const [small, medium] = sizes;
        css({ padding: medium });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - padding: 8px
      span:
        start: 95
        end: 119
    ");
}

// --- spread merging via resolved sources ---

#[test]
fn object_spread_of_local_identifier_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const base = { color: 'red' };
        css({ ...base, padding: '4px' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          padding: 4px
      span:
        start: 65
        end: 97
    ");
}

#[test]
fn object_alias_chain_resolves_whole_object() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const base = { color: 'red' };
        const button = base;
        const primary = button;
        css(primary);
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_snapshot!(serde_json::to_string_pretty(&json).unwrap(), @r#"
    {
      "color": "red"
    }
    "#);
}

// --- function parameter shadowing ---

#[test]
fn function_parameter_shadows_css_import() {
    // The local `css` parameter is *not* the import. Even though the name
    // matches a Panda alias, scope says it's a local — drop the extraction.
    let src = indoc! {r"
        import { css } from '@panda/css';
        function f(css) {
          css({ color: 'red' });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "shadowed import must not extract: {calls:#?}"
    );
}

#[test]
fn arrow_parameter_shadows_css_import() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = (css) => css({ color: 'red' });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "arrow-param shadow must not extract: {calls:#?}"
    );
}

#[test]
fn block_scoped_const_shadows_outer() {
    // Inner `css` is a local const, not the import.
    let src = indoc! {r"
        import { css } from '@panda/css';
        {
          const css = (x: any) => x;
          css({ color: 'red' });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "block-scoped shadow must not extract: {calls:#?}"
    );
}

#[test]
fn shadowed_call_does_not_block_outer_call() {
    // Outer `css(...)` is the import; inner one is shadowed. Only the
    // outer should extract.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ padding: '4px' });
        function f(css) {
          css({ color: 'red' });
        }
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - padding: 4px
      span:
        start: 34
        end: 57
    "#);
}

// --- JSX scope behavior ---

#[test]
fn jsx_attribute_resolves_identifier() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const w = '5px';
        const el = <Box width={w} />;
    "};
    assert_yaml_snapshot!(run_jsx(src).jsx, @"
    - category: jsx
      kind: component
      name: Box
      alias: Box
      data:
        width: 5px
      span:
        start: 62
        end: 79
    ");
}

#[test]
fn jsx_spread_of_local_identifier_resolves() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const base = { color: 'red' };
        const el = <Box {...base} padding='4px' />;
    "};
    assert_yaml_snapshot!(run_jsx(src).jsx, @"
    - category: jsx
      kind: component
      name: Box
      alias: Box
      data:
        color: red
        padding: 4px
      span:
        start: 76
        end: 107
    ");
}

#[test]
fn jsx_tag_shadowed_by_param_is_not_extracted() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        function f(Box: any) {
          return <Box color='red' />;
        }
    "};
    let jsx = run_jsx(src).jsx;
    assert!(
        jsx.is_empty(),
        "shadowed JSX tag must not extract: {jsx:#?}"
    );
}

// --- caching / cycle safety ---

#[test]
fn self_referential_const_does_not_panic() {
    // `const a = a` is a TDZ error in JS, but oxc still parses it. Our
    // resolver must not infinite-loop or panic — it should drop the call.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const a = a;
        css({ color: a });
    "};
    let _ = run(src); // just confirm no panic; assertion on output is not the point
}

#[test]
fn cyclic_idents_drop_safely() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const a = b;
        const b = a;
        css({ color: a });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "cyclic idents must drop, not infinite-loop: {calls:#?}"
    );
}

// --- ts-evaluator parity scenarios ---

#[test]
fn binary_with_identifier_operand_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const n = 4;
        css({ padding: n + 'px' });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - padding: 4px
      span:
        start: 47
        end: 73
    ");
}

#[test]
fn template_literal_with_identifier_interpolation_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const n = 4;
        css({ padding: `${n}px` });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - padding: 4px
      span:
        start: 47
        end: 73
    ");
}

#[test]
fn template_literal_with_member_interpolation_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const o = { p: 'red' };
        css({ color: `${o.p}` });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 58
        end: 82
    ");
}

// --- pure call folding ---

#[test]
fn local_function_call_return_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = () => 'red';
        css({ color: f() });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 57
        end: 76
    ");
}

#[test]
fn iife_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: (() => 'red')() });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 34
        end: 65
    ");
}

#[test]
fn local_function_declaration_call_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function getColor() {
          return 'yellow.700';
        }
        css({ color: getColor() });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: yellow.700
      span:
        start: 81
        end: 107
    ");
}

#[test]
fn pure_helper_param_template_folds_as_computed_key() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const groupHover = (name: string) => `.${name}:is(:hover, [data-hover]) &`;
        css({ [groupHover('cool')]: { color: 'red' } });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - ".cool:is(:hover, [data-hover]) &":
            color: red
      span:
        start: 110
        end: 157
    "#);
}

#[test]
fn pure_helper_array_index_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const pickSecond = (arr: string[]) => arr[1];
        const colors = ['never', 'purple.900'];
        css({ color: pickSecond(colors) });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: purple.900
      span:
        start: 120
        end: 154
    ");
}

#[test]
fn pure_helper_boolean_index_does_not_fold() {
    // Mirrors `literal.rs`'s `computed_member_to_literal`: `obj[true]` is
    // valid JS but not real Panda usage, so it drops instead of coercing the
    // boolean to a string key — the pure-fn body evaluator shares this rule
    // via `literal_to_property_key` rather than the looser `coerce_to_string`.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const pick = (flag: boolean) => ({ true: 'red', false: 'blue' })[flag];
        css({ color: pick(true) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn impure_math_random_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        css({ color: pick(['a', 'b']) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn pure_helper_object_return_spreads_into_css() {
    // v1: `getColorConfig()` via ts-evaluator → BoxNodeObject, then spread.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const getColorConfig = () => ({ color: 'teal.600', backgroundColor: 'teal.650' });
        css({ ...getColorConfig(), padding: '4px' });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_eq!(json["color"], "teal.600");
    assert_eq!(json["backgroundColor"], "teal.650");
    assert_eq!(json["padding"], "4px");
}

#[test]
fn pure_helper_object_return_spreads_into_jsx() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const getColorConfig = () => ({ color: 'teal.600', backgroundColor: 'teal.650' });
        const el = <Box {...getColorConfig()} padding='4px' />;
    "};
    let json = serde_json::to_value(&run_jsx(src).jsx[0].data).unwrap();
    assert_eq!(json["color"], "teal.600");
    assert_eq!(json["backgroundColor"], "teal.650");
    assert_eq!(json["padding"], "4px");
}

#[test]
fn pure_helper_body_object_spread_does_not_fold() {
    // Object spread inside the pure body is out of IR scope (v1 folded via VM).
    // Outer static siblings still extract (lenient object / spread skip).
    let src = indoc! {r"
        import { css } from '@panda/css';
        const base = { color: 'red' };
        const getStyles = () => ({ ...base, padding: '20px' });
        css({ ...getStyles(), margin: '8px' });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_eq!(json["margin"], "8px");
    assert!(json.get("color").is_none());
    assert!(json.get("padding").is_none());
}

#[test]
fn pure_helper_default_and_multi_args_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tone = (base: string, shade: string = '500') => `${base}.${shade}`;
        css({ color: tone('purple'), bg: tone('blue', '700') });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_eq!(json["color"], "purple.500");
    assert_eq!(json["bg"], "blue.700");
}

#[test]
fn pure_helper_local_alias_does_not_fold() {
    // `g` aliases `f`; lookup only lowers direct arrow/function initializers.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = () => 'red';
        const g = f;
        css({ color: g() });
    "};
    assert!(
        run(src).calls.is_empty(),
        "aliased pure callable should not fold yet"
    );
}

#[test]
fn nested_pure_call_in_body_does_not_fold() {
    // Nested calls are rejected even when the callee is itself pure.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const inner = () => 'red';
        const outer = () => inner();
        css({ color: outer() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn object_entries_factory_does_not_fold() {
    // v1 folded this via ts-evaluator's ECMA preset; static pure_fn does not.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const pickKey = () => Object.entries({ color: 'red' }).map(([k]) => k)[0];
        css({ color: pickKey() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn rest_param_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const first = (...xs: string[]) => xs[0];
        css({ color: first('red', 'blue') });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn member_callee_pure_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const helpers = { getColor: () => 'red' };
        css({ color: helpers.getColor() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn optional_pure_call_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = () => 'red';
        css({ color: f?.() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn spread_args_pure_call_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = (a: string) => a;
        const args = ['red'] as const;
        css({ color: f(...args) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn async_pure_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = async () => 'red';
        css({ color: f() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn destructured_param_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const f = ({ color }: { color: string }) => color;
        css({ color: f({ color: 'red' }) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn multi_statement_body_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function f() {
          const x = 'red';
          return x;
        }
        css({ color: f() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn mutated_pure_helper_binding_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        let f = () => 'red';
        f = () => 'blue';
        css({ color: f() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn function_expression_iife_folds() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: (function () { return 'red'; })() });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_eq!(json["color"], "red");
}

#[test]
fn class_static_method_reference_does_not_fold() {
    // A plain reference pulled off a class isn't an arrow/function/
    // parenthesized initializer, so `lower_callable_expr` never reaches a
    // body — classes are out of scope entirely (v1 folded via ts-evaluator's
    // full TS interpreter).
    let src = indoc! {r"
        import { css } from '@panda/css';
        class Colors {
          static primary() {
            return 'red';
          }
        }
        const primary = Colors.primary;
        css({ color: primary() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn generator_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function* pickColor() {
          yield 'red';
        }
        css({ color: pickColor() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn for_loop_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function sumUp() {
          let total = 0;
          for (let i = 0; i < 3; i++) {
            total += i;
          }
          return total;
        }
        css({ opacity: sumUp() });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn while_loop_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function firstPositive(xs: number[]) {
          let i = 0;
          while (xs[i] <= 0) {
            i++;
          }
          return xs[i];
        }
        css({ opacity: firstPositive([-1, -1, 2]) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn array_map_method_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const shout = (xs: string[]) => xs.map((x) => x.toUpperCase())[0];
        css({ color: shout(['red']) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn array_reduce_method_helper_does_not_fold() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
        css({ opacity: sum([1, 2, 3]) });
    "};
    assert!(run(src).calls.is_empty());
}

#[test]
fn pure_helper_folds_inside_cva_base() {
    // Pure-fn folding isn't `css()`-specific: `cva`/`sva`/JSX style props all
    // route through the same `expression_to_literal`, so a helper call
    // inside a `cva` slot resolves exactly like it would in `css()`.
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const tone = (shade: string) => `red.${shade}`;
        const button = cva({
          base: { color: tone('600') },
        });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_eq!(json["base"]["color"], "red.600");
}

#[test]
fn pure_helper_folds_inside_jsx_style_prop() {
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const tone = (shade: string) => `red.${shade}`;
        const el = <Box color={tone('600')} />;
    "};
    let json = serde_json::to_value(&run_jsx(src).jsx[0].data).unwrap();
    assert_eq!(json["color"], "red.600");
}

#[test]
fn conditional_with_identifier_test_folds() {
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

// --- nested-scope semantics ---

#[test]
fn inner_scope_shadows_outer_same_named_const() {
    // Two `const color` bindings — module-level and function-local —
    // with the JSX inside the function. The local binding wins via
    // oxc_semantic's symbol resolution.
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const color = 'never.500';
        function Wrapper() {
          const color = 'orange.500';
          return <Box color={color} />;
        }
    "};
    let json = serde_json::to_value(&run_jsx(src).jsx[0].data).unwrap();
    assert_eq!(
        json["color"], "orange.500",
        "inner scope's binding should win, not the module-level one",
    );
}

#[test]
fn closure_captures_outer_const() {
    // No inner shadow — the function-local const points at the
    // module-level binding, which the resolver follows transitively.
    let src = indoc! {r"
        import { Box } from '@panda/jsx';
        const referenced = 'orange.600';
        function Wrapper() {
          const color = referenced;
          return <Box color={color} />;
        }
    "};
    let json = serde_json::to_value(&run_jsx(src).jsx[0].data).unwrap();
    assert_eq!(json["color"], "orange.600");
}

// --- unfoldable bindings ---

#[test]
fn function_expression_initializer_drops() {
    // `getColor` binds to an arrow function, not a literal. Resolver
    // bails on FunctionExpression / ArrowFunctionExpression initializers.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const getColor = () => 'red';
        css({ color: getColor });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "function-valued binding should not fold: {calls:#?}"
    );
}

#[test]
fn identifier_without_initializer_drops() {
    // `let color;` — declared but uninitialized. Reading it at runtime
    // yields `undefined`; we drop rather than emit a phantom value.
    let src = indoc! {r"
        import { css } from '@panda/css';
        let color;
        css({ color });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "uninitialized binding should not fold: {calls:#?}"
    );
}

#[test]
fn chained_element_access_on_resolved_object() {
    // `colors['red']['500']` — two consecutive computed-member
    // expressions. Each step folds the previous result through the
    // standard lookup path; works the same as `colors.red[500]`.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const colors = { red: { 500: '#ef4444' } };
        css({ color: colors['red']['500'] });
    "};
    let json = serde_json::to_value(&run(src).calls[0].data[0]).unwrap();
    assert_eq!(json["color"], "#ef4444");
}
