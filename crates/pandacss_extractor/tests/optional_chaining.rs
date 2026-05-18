//! Optional-chaining (`?.`) folding.
//!
//! Oxc parses `a?.b`, `a?.[b]`, and `a?.()` as `Expression::ChainExpression`
//! wrapping a `ChainElement`. The extractor treats the chain as a
//! transparent unwrap — the inner member access folds through the normal
//! object/array lookup path. We don't model JS `undefined`; if the base
//! isn't a resolvable object, the call is simply dropped.

mod common;

use common::css_config;
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &css_config())
}

#[test]
fn optional_static_member_resolves_on_known_object() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const tokens = { color: 'red' };
        css({ color: tokens?.color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 67
        end: 96
    ");
}

#[test]
fn optional_computed_member_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const sizes = { sm: '4px' };
        const key = 'sm';
        css({ padding: sizes?.[key] });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - padding: 4px
      span:
        start: 81
        end: 111
    ");
}

#[test]
fn optional_chain_on_unresolvable_base_drops() {
    // `maybe` is a free variable — we don't extract anything for it.
    let src = indoc! {r"
        import { css } from '@panda/css';
        css({ color: maybe?.foo });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "free `maybe` shouldn't extract: {calls:#?}"
    );
}

#[test]
fn nested_optional_chain_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const t = { colors: { red: '#f00' } };
        css({ color: t?.colors?.red });
    "};
    let calls = run(src).calls;
    assert_eq!(calls.len(), 1, "nested optional chain should extract");
}
