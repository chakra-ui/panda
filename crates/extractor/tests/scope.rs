//! Phase 5 scope-resolution tests.
//!
//! Exercises identifier / member-access / destructuring resolution and
//! function-parameter shadowing — the surfaces that flipped on with
//! `oxc_semantic` integration. These tests use the combined `extract()`
//! entrypoint so the resolver is always present.

use extractor::{ExtractUsage, ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use indoc::indoc;
use insta::assert_yaml_snapshot;

fn matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: Matcher {
            modules: vec!["@panda/recipes".into()],
            names: NameMatcher::Any,
        },
        pattern: Matcher {
            modules: vec!["@panda/patterns".into()],
            names: NameMatcher::Any,
        },
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".into()],
            names: NameMatcher::only(["styled", "Box"]),
        }),
        tokens: Matcher {
            modules: vec!["@panda/tokens".into()],
            names: NameMatcher::only(["token"]),
        },
        jsx_factories: None,
    }
}

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &ExtractorConfig::new(matchers()))
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
    assert_yaml_snapshot!(run(src).jsx, @"
    - category: jsx
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
    assert_yaml_snapshot!(run(src).jsx, @"
    - category: jsx
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
    let jsx = run(src).jsx;
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
