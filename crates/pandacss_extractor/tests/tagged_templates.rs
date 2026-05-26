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

mod common;

use common::css_config;
use indoc::indoc;
use pandacss_extractor::{ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &css_config())
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
    let calls = run(src).calls;
    assert_eq!(calls.len(), 1, "only the outer css() extracts");
    let lit = calls[0].data[0].as_ref().expect("data present");
    let json = serde_json::to_value(lit).unwrap();
    assert_eq!(json["display"], "color: red; padding: 4px;");
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
    let calls = run(src).calls;
    assert_eq!(calls.len(), 1);
    let lit = calls[0].data[0].as_ref().unwrap();
    let json = serde_json::to_value(lit).unwrap();
    assert_eq!(json["value"], "padding: 4px;");
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
    let calls = run(src).calls;
    assert_eq!(calls.len(), 1, "css`...` extracts as CSS-in-template");
    let json = serde_json::to_value(calls[0].data[0].as_ref().unwrap()).unwrap();
    assert_eq!(json["color"], "red");
}
