//! Tagged template literal folding.
//!
//! A tagged template like ``css`color: red` `` is a
//! `TaggedTemplateExpression` — different AST node from a plain call. We
//! unwrap the tag and fold the template literal itself, matching the JS
//! extractor's `isTaggedTemplateExpression` handling. The downstream
//! consumer interprets the resulting string; the extractor just hands it
//! back.

use pandacss_extractor::{ExtractUsage, ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use indoc::indoc;

fn matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        ..Default::default()
    }
}

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &ExtractorConfig::new(matchers()))
}

#[test]
fn tagged_template_in_arg_resolves_to_string() {
    // Tagged-template-as-statement isn't a Panda call site itself — the
    // CallExpression visitor only sees real CallExpressions. But the
    // template's *value* still folds when referenced via an identifier
    // inside a real css() call.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const block = css`color: red; padding: 4px;`;
        css({ display: block });
    "};
    let calls = run(src).calls;
    assert_eq!(calls.len(), 1, "outer css() folds via tagged template");
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
fn tagged_template_call_site_alone_is_not_a_calls_entry() {
    // The tag itself isn't a CallExpression; nothing to extract on its own.
    let src = indoc! {r"
        import { css } from '@panda/css';
        const styles = css`color: red;`;
    "};
    assert_eq!(run(src).calls.len(), 0);
}
