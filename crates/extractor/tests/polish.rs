//! Polish slice — features added together as a single step toward
//! closing the gap to the JS extractor:
//!
//! - TypeScript `enum` member resolution (`Sizes.Small`)
//! - Function parameter `TSTypeLiteral` resolution (`function f(x: { c: 'red' })`)
//! - Configurable JSX factory names via `Matchers.jsx_factories`
//! - Destructuring with default values (`const { x = 'red' } = obj`)

use extractor::{ExtractUsage, ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use indoc::indoc;
use insta::assert_yaml_snapshot;

fn matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".into()],
            names: NameMatcher::only(["styled", "Box", "Panda"]),
        }),
        ..Default::default()
    }
}

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &ExtractorConfig::new(matchers()))
}

fn run_with_factories(source: &str, factories: Vec<&str>) -> ExtractUsage {
    let mut m = matchers();
    m.jsx_factories = Some(factories.into_iter().map(String::from).collect());
    extract(source, "fixture.tsx", &ExtractorConfig::new(m))
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
fn default_jsx_factory_is_styled() {
    // Without overriding `jsx_factories`, only `<styled.div>` should
    // match member-chain factories. `<Panda.foo>` should NOT match even
    // though `Panda` is a JSX import name.
    let src = indoc! {r"
        import { Panda } from '@panda/jsx';
        const a = <Panda.div color='red' />;
    "};
    let jsx = run(src).jsx;
    assert!(
        jsx.is_empty(),
        "non-default factory `<Panda.x>` should not extract under defaults: {jsx:#?}"
    );
}

#[test]
fn custom_jsx_factory_extracts_member_chain() {
    // Override `jsx_factories` to include `Panda`. Now `<Panda.div>`
    // extracts as a factory call.
    let src = indoc! {r"
        import { Panda } from '@panda/jsx';
        const a = <Panda.div color='red' />;
    "};
    assert_yaml_snapshot!(run_with_factories(src, vec!["Panda"]).jsx, @"
    - category: jsx
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
    // When `jsx_factories` is `Some([...])`, it *replaces* the default,
    // it doesn't add to it. Confirming so a user who overrides knows the
    // contract.
    let src = indoc! {r"
        import { styled } from '@panda/jsx';
        const a = <styled.div color='red' />;
    "};
    let jsx = run_with_factories(src, vec!["Panda"]).jsx;
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
