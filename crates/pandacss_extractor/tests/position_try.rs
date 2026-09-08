//! `positionTry(...)` used as a style VALUE folds to its dashed-ident string,
//! mirroring how `token(...)` folds in value position. The call is *also* still
//! surfaced as its own `ExtractedCall` so the project layer keeps collecting the
//! `@position-try` block.

use indoc::indoc;

use pandacss_extractor::{
    ExtractUsage, ExtractorConfig, Literal, Matcher, Matchers, NameMatcher, extract,
};

/// css matcher that recognises `positionTry` alongside `css`, plus an optional
/// class-name prefix threaded into folded idents.
fn position_try_config(prefix: &str) -> ExtractorConfig {
    let matchers = Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "positionTry"]),
        },
        ..Default::default()
    };
    let mut config = ExtractorConfig::new(matchers);
    prefix.clone_into(&mut config.class_name_prefix);
    config
}

/// Value of `prop` inside the first `css({...})` argument, if it folded to a string.
fn css_string_prop(usage: &ExtractUsage, prop: &str) -> Option<String> {
    let css = usage.calls.iter().find(|c| c.name == "css")?;
    let Some(Literal::Object(entries)) = css.data.first().and_then(Option::as_ref) else {
        return None;
    };
    entries.iter().find_map(|(key, value)| match value {
        Literal::String(text) | Literal::Token { value: text, .. } if key == prop => {
            Some(text.clone())
        }
        _ => None,
    })
}

#[test]
fn string_call_folds_to_named_ident() {
    let source = indoc! {r"
        import { css, positionTry } from '@panda/css'
        css({ positionTryFallbacks: positionTry('flip') })
    "};

    let usage = extract(source, "app.ts", &position_try_config(""));

    assert_eq!(
        css_string_prop(&usage, "positionTryFallbacks").as_deref(),
        Some("--pt_flip")
    );
}

#[test]
fn call_is_still_extracted_for_block_collection() {
    let source = indoc! {r"
        import { css, positionTry } from '@panda/css'
        css({ positionTryFallbacks: positionTry('flip') })
    "};

    let usage = extract(source, "app.ts", &position_try_config(""));

    // Folding in the value slot must not remove the call from `calls`, or the
    // project parse arm would stop emitting the `@position-try` block.
    assert!(
        usage.calls.iter().any(|c| c.name == "positionTry"),
        "positionTry call should still be extracted, got: {:?}",
        usage.calls.iter().map(|c| &c.name).collect::<Vec<_>>()
    );
    assert!(usage.calls.iter().any(|c| c.name == "css"));
}

#[test]
fn object_call_folds_to_hashed_ident() {
    let source = indoc! {r"
        import { css, positionTry } from '@panda/css'
        css({ positionTryFallbacks: positionTry({ top: 'anchor(bottom)' }) })
    "};

    let usage = extract(source, "app.ts", &position_try_config(""));

    let ident = css_string_prop(&usage, "positionTryFallbacks").expect("should fold");
    assert!(
        ident.starts_with("--pt_") && ident.len() > "--pt_".len(),
        "expected --pt_<hash>, got {ident}"
    );
    // Byte-identical to the shared emitter helper.
    let expected =
        pandacss_shared::position_try_ident(&serde_json::json!({ "top": "anchor(bottom)" }), "");
    assert_eq!(ident, expected);
}

#[test]
fn same_file_const_and_template_composition_fold() {
    let source = indoc! {r"
        import { css, positionTry } from '@panda/css'
        const flip = positionTry('flip')
        const shift = positionTry({ top: 'anchor(bottom)' })
        css({ positionTryFallbacks: `${flip}, ${shift}` })
    "};

    let usage = extract(source, "app.ts", &position_try_config(""));

    let shift_ident =
        pandacss_shared::position_try_ident(&serde_json::json!({ "top": "anchor(bottom)" }), "");
    assert_eq!(
        css_string_prop(&usage, "positionTryFallbacks").as_deref(),
        Some(format!("--pt_flip, {shift_ident}").as_str())
    );
}

#[test]
fn named_ident_uses_the_config_prefix() {
    let source = indoc! {r"
        import { css, positionTry } from '@panda/css'
        css({ positionTryFallbacks: positionTry('flip') })
    "};

    let usage = extract(source, "app.ts", &position_try_config("p"));

    assert_eq!(
        css_string_prop(&usage, "positionTryFallbacks").as_deref(),
        Some("--p-pt_flip")
    );
}

#[test]
fn raw_member_form_does_not_fold() {
    let source = indoc! {r"
        import { css, positionTry } from '@panda/css'
        css({ positionTryFallbacks: positionTry.raw('flip') })
    "};

    let usage = extract(source, "app.ts", &position_try_config(""));

    // `positionTry.raw(...)` is the `.raw` escape hatch, not the dashed-ident
    // factory — it must never fold to a `--pt_` ident.
    let value = css_string_prop(&usage, "positionTryFallbacks");
    assert!(
        value.as_deref().is_none_or(|v| !v.starts_with("--pt_")),
        "positionTry.raw must not fold to a position-try ident, got {value:?}"
    );
}

#[test]
fn shadowed_local_does_not_fold() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        const positionTry = (name) => name
        css({ positionTryFallbacks: positionTry('flip') })
    "};

    let usage = extract(source, "app.ts", &position_try_config(""));

    // A local `positionTry` shadows the (unimported) Panda name, so it never
    // folds to a `--pt_` dashed-ident (the local pure fn may still fold as `flip`).
    let value = css_string_prop(&usage, "positionTryFallbacks");
    assert_ne!(value.as_deref(), Some("--pt_flip"));
    assert!(
        value.as_deref().is_none_or(|v| !v.starts_with("--pt_")),
        "shadowed local must not fold to a position-try ident, got {value:?}"
    );
}
