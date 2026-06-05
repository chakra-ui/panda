//! Tagged template literal folding.
//!
//! A tagged template like ``gql`...` `` is a `TaggedTemplateExpression` —
//! different AST node from a plain call. As an expression *value* its quasi
//! folds to a string (tag-agnostic), matching the JS extractor's
//! `isTaggedTemplateExpression` handling.
//!
//! The Panda CSS-in-template forms — ``css`color: red` `` and
//! ``styled.div`...` `` — are a separate thing: their bodies parse into a
//! style object and they extract as usages (see `calls.rs` / `jsx.rs`).

use super::common;

use super::common::css_config;
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{CssSyntaxKind, ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &css_config())
}

fn run_template(source: &str) -> ExtractUsage {
    extract(
        source,
        "fixture.tsx",
        &css_config().with_syntax(CssSyntaxKind::TemplateLiteral),
    )
}

#[test]
fn tagged_template_value_folds_to_string_when_referenced() {
    // A non-Panda tag (`gql`) used as a value: its quasi folds to a string
    // (tag-agnostic) when referenced via an identifier inside a real css()
    // call. Only the outer css() extracts.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const block = gql`color: red; padding: 4px;`;
        css({ display: block });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - display: "color: red; padding: 4px;"
      span:
        start: 80
        end: 103
    "#);
}

#[test]
fn tagged_template_with_identifier_interpolation_folds() {
    // The interpolation `${size}` resolves through the scope evaluator;
    // template coercion turns the number into "4". Anything that isn't
    // foldable in the interpolation drops the whole template.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const size = 4;
        const block = styled`padding: ${size}px;`;
        css({ value: block });
    "};
    assert_yaml_snapshot!(run(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - value: "padding: 4px;"
      span:
        start: 93
        end: 114
    "#);
}

#[test]
fn css_tagged_template_extracts_as_css_in_template() {
    // `css`color: red;`` is the css helper as a tagged template — it parses
    // into a style object and extracts as a css usage (CSS-in-template). The
    // declaration parsing detail is pinned in `calls.rs`.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const styles = css`color: red;`;
    "};
    assert_yaml_snapshot!(run_template(src).calls, @r"
    - category: css
      name: css
      alias: css
      data:
        - color: red
      span:
        start: 49
        end: 65
    ");
}

#[test]
fn css_tagged_template_does_not_extract_in_object_syntax() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const styles = css`color: red;`;
    "};
    assert_yaml_snapshot!(run(src).calls, @"[]");
}
