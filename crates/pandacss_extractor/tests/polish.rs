//! Polish slice — features added together as a single step toward
//! closing the gap to the JS extractor:
//!
//! - TypeScript `enum` member resolution (`Sizes.Small`)
//! - Function parameter `TSTypeLiteral` resolution (`function f(x: { c: 'red' })`)
//! - Configurable JSX factory names via `Matchers.jsx_factories`
//! - Destructuring with default values (`const { x = 'red' } = obj`)

use indoc::indoc;
use insta::assert_yaml_snapshot;

use crate::common::{matcher, panda_matchers};
use pandacss_extractor::{ExtractUsage, ExtractorConfig, extract};

fn matchers() -> pandacss_extractor::Matchers {
    pandacss_extractor::Matchers {
        jsx: Some(matcher("@panda/jsx", ["styled", "Box", "Panda"])),
        ..panda_matchers()
    }
}

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &ExtractorConfig::new(matchers()))
}

fn run_jsx(source: &str) -> ExtractUsage {
    extract(
        source,
        "fixture.tsx",
        &ExtractorConfig::new(matchers()).with_jsx_framework(true),
    )
}

fn run_jsx_with_factories(source: &str, factories: Vec<&str>) -> ExtractUsage {
    let mut m = matchers();
    m.jsx_factories = Some(factories.into_iter().map(String::from).collect());
    extract(
        source,
        "fixture.tsx",
        &ExtractorConfig::new(m).with_jsx_framework(true),
    )
}

// --- TS enums ---

#[test]
fn enum_member_access_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        enum Sizes { Small = '4px', Medium = '8px', Large = '12px' }
        css({ padding: Sizes.Small });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - padding: 4px
      span:
        start: 95
        end: 124
    ");
}

#[test]
fn numeric_enum_member_resolves() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        enum Levels { Low = 1, High = 99 }
        css({ zIndex: Levels.High });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - zIndex: 99
      span:
        start: 69
        end: 97
    ");
}

#[test]
fn enum_member_without_initializer_drops_that_path() {
    // `Sizes.Auto` has no initializer — JS would auto-increment from
    // the prior value. We skip uninitialized members (JS extractor does
    // the same), so the member lookup misses and the call drops.
    let src = indoc! {r"
        import { css } from '@panda/css';
        enum Sizes { Small = '4px', Auto }
        css({ padding: Sizes.Auto });
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "uninitialized enum member should not yield a partial call: {calls:#?}"
    );
}

// --- TS type literal on function params ---

#[test]
fn function_param_with_type_literal_resolves_member() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function paint(props: { color: 'red'; size: 4 }) {
          return css({ color: props.color, fontSize: props.size });
        }
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          fontSize: 4
      span:
        start: 94
        end: 143
    ");
}

#[test]
fn function_param_without_annotation_still_drops() {
    // No type annotation on the param → no fallback path. JS extractor
    // bails too.
    let src = indoc! {r"
        import { css } from '@panda/css';
        function paint(props) {
          return css({ color: props.color });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "untyped param shouldn't fold props member access: {calls:#?}"
    );
}

#[test]
fn destructured_param_type_literal_binds_the_member_not_the_wrapper() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        function paint({ color }: { color: 'red' }) {
          return css({ color });
        }
    "};
    assert_yaml_snapshot!(run(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 89
        end: 103
    ");
}

#[test]
fn optional_type_literal_member_does_not_fold() {
    // `{ color?: 'red' }` may be absent at runtime, so the literal type is
    // not a value.
    let src = indoc! {r"
        import { css } from '@panda/css';
        function paint(props: { color?: 'red' }) {
          return css({ color: props.color });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "optional member shouldn't fold to its literal type: {calls:#?}"
    );
}

#[test]
fn unfoldable_type_literal_member_leaves_siblings_unresolved() {
    // `children` doesn't fold, so the annotation can't answer for `color`
    // either — a partial object would report the missing keys as undefined.
    let src = indoc! {r"
        import { css } from '@panda/css';
        function paint({ color, children }: { color: 'red'; children: unknown }) {
          return css({ color, content: children });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "partial type literal shouldn't resolve any member: {calls:#?}"
    );
}

#[test]
fn function_param_with_non_literal_type_drops() {
    // `string` type annotation — not a literal type. We need a
    // `TSLiteralType('red')` to extract a value; bare `string` provides
    // no static information.
    let src = indoc! {r"
        import { css } from '@panda/css';
        function paint(props: { color: string }) {
          return css({ color: props.color });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls.is_empty(),
        "non-literal type shouldn't yield a value: {calls:#?}"
    );
}

// --- JSX factory configuration ---

#[test]
fn jsx_factory_names_are_explicitly_configured() {
    // The extractor consumes resolved factory names from config; it doesn't
    // own a hard-coded default. `<Panda.foo>` should NOT match unless
    // `Panda` is passed in `jsx_factories`.
    let src = indoc! {r"
        import { Panda } from '@panda/jsx';
        const a = <Panda.div color='red' />;
    "};
    let jsx = run_jsx(src).jsx;
    assert!(
        jsx.is_empty(),
        "non-default factory `<Panda.x>` should not extract under defaults: {jsx:#?}"
    );
}

#[test]
fn custom_jsx_factory_extracts_member_chain() {
    // Passing `Panda` as a resolved JSX factory enables `<Panda.div>`.
    let src = indoc! {r"
        import { Panda } from '@panda/jsx';
        const a = <Panda.div color='red' />;
    "};
    assert_yaml_snapshot!(run_jsx_with_factories(src, vec!["Panda"]).jsx, @"
    - category: jsx
      kind: factory
      name: Panda.div
      alias: Panda
      data:
        color: red
      span:
        start: 46
        end: 71
    ");
}

#[test]
fn custom_jsx_factory_excludes_default_styled() {
    // Factory names are explicit, not additive. If only `Panda` is passed,
    // `<styled.div>` does not match.
    let src = indoc! {r"
        import { styled } from '@panda/jsx';
        const a = <styled.div color='red' />;
    "};
    let jsx = run_jsx_with_factories(src, vec!["Panda"]).jsx;
    assert!(
        jsx.is_empty(),
        "`<styled.x>` should not extract when factories list is overridden to `['Panda']`: {jsx:#?}"
    );
}

// --- destructuring defaults ---

#[test]
fn destructure_default_kicks_in_when_key_missing() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const props = { fontSize: 16 };
        const { color = 'red' } = props;
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 99
        end: 113
    ");
}

#[test]
fn destructure_default_skipped_when_key_present() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const props = { color: 'blue' };
        const { color = 'red' } = props;
        css({ color });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: blue
      span:
        start: 100
        end: 114
    ");
}

#[test]
fn destructure_default_with_object_literal_value() {
    // Default value can itself be a non-trivial literal — object,
    // array, etc. — and the resolver folds it normally.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const props = {};
        const { theme = { primary: 'red' } } = props;
        css({ color: theme.primary });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 98
        end: 127
    ");
}

#[test]
fn an_undefined_property_does_not_block_the_object() {
    // `width: cond ? '100%' : undefined` is everyday React. The undefined arm
    // must fold like a null so the rest of the object still extracts.
    let src = indoc! {r"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', width: undefined });
    "};
    assert_yaml_snapshot!(run(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: red
          width: ~
      span:
        start: 53
        end: 92
    ");
}

#[test]
fn a_local_binding_named_undefined_stays_open() {
    // Shadowing `undefined` is legal in a function scope; a binding we cannot
    // resolve must not be mistaken for the global.
    let src = indoc! {r"
        import { css } from '@panda/css';
        export function paint(undefined) {
          return css({ color: undefined });
        }
    "};
    let calls = run(src).calls;
    assert!(
        calls
            .iter()
            .all(|call| call.data.iter().flatten().count() == 0),
        "shadowed undefined should stay unresolved: {calls:#?}"
    );
}
