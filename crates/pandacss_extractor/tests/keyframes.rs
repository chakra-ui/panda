//! `keyframes({...})` used as a style VALUE folds to its `kf_{hash}` animation
//! name, mirroring how `positionTry(...)` folds. The call is *also* still
//! surfaced as its own `ExtractedCall` so the project layer keeps collecting
//! the `@keyframes` block. Object form only — there is no named form.

use indoc::indoc;

use pandacss_extractor::{
    ExtractUsage, ExtractorConfig, Literal, Matcher, Matchers, NameMatcher, extract,
};

fn keyframes_config(prefix: &str) -> ExtractorConfig {
    let matchers = Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "keyframes"]),
        },
        ..Default::default()
    };
    let mut config = ExtractorConfig::new(matchers);
    prefix.clone_into(&mut config.class_name_prefix);
    config
}

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
fn object_call_folds_to_hashed_name() {
    let source = indoc! {r"
        import { css, keyframes } from '@panda/css'
        css({ animationName: keyframes({ from: { opacity: 0 }, to: { opacity: 1 } }) })
    "};

    let usage = extract(source, "app.ts", &keyframes_config(""));

    let name = css_string_prop(&usage, "animationName").expect("should fold");
    let expected = pandacss_shared::keyframes_name(
        &serde_json::json!({ "from": { "opacity": 0 }, "to": { "opacity": 1 } }),
        "",
    );
    assert_eq!(name, expected);
    assert!(name.starts_with("kf_"));
}

#[test]
fn call_is_still_extracted_for_block_collection() {
    let source = indoc! {r"
        import { css, keyframes } from '@panda/css'
        css({ animationName: keyframes({ from: { opacity: 0 } }) })
    "};

    let usage = extract(source, "app.ts", &keyframes_config(""));

    assert!(
        usage.calls.iter().any(|c| c.name == "keyframes"),
        "keyframes call should still be extracted, got: {:?}",
        usage.calls.iter().map(|c| &c.name).collect::<Vec<_>>()
    );
    assert!(usage.calls.iter().any(|c| c.name == "css"));
}

#[test]
fn name_uses_the_config_prefix() {
    let source = indoc! {r"
        import { css, keyframes } from '@panda/css'
        css({ animationName: keyframes({ from: { opacity: 0 } }) })
    "};

    let usage = extract(source, "app.ts", &keyframes_config("p"));

    let name = css_string_prop(&usage, "animationName").expect("should fold");
    let expected =
        pandacss_shared::keyframes_name(&serde_json::json!({ "from": { "opacity": 0 } }), "p");
    assert_eq!(name, expected);
    assert!(name.starts_with("p-kf_"));
}

#[test]
fn same_file_const_and_shorthand_composition_fold() {
    let source = indoc! {r"
        import { css, keyframes } from '@panda/css'
        const spin = keyframes({ from: { opacity: 0 } })
        css({ animation: `${spin} 1s linear infinite` })
    "};

    let usage = extract(source, "app.ts", &keyframes_config(""));

    let spin =
        pandacss_shared::keyframes_name(&serde_json::json!({ "from": { "opacity": 0 } }), "");
    assert_eq!(
        css_string_prop(&usage, "animation").as_deref(),
        Some(format!("{spin} 1s linear infinite").as_str())
    );
}

#[test]
fn string_arg_does_not_fold() {
    let source = indoc! {r"
        import { css, keyframes } from '@panda/css'
        css({ animationName: keyframes('spin') })
    "};

    let usage = extract(source, "app.ts", &keyframes_config(""));

    // There is no named form — a string argument must never fold to a `kf_` name.
    let value = css_string_prop(&usage, "animationName");
    assert!(
        value.as_deref().is_none_or(|v| !v.starts_with("kf_")),
        "keyframes('name') must not fold, got {value:?}"
    );
}

#[test]
fn shadowed_local_does_not_fold() {
    let source = indoc! {r"
        import { css } from '@panda/css'
        const keyframes = (stops) => 'local'
        css({ animationName: keyframes({ from: { opacity: 0 } }) })
    "};

    let usage = extract(source, "app.ts", &keyframes_config(""));

    let value = css_string_prop(&usage, "animationName");
    assert!(
        value.as_deref().is_none_or(|v| !v.starts_with("kf_")),
        "shadowed local must not fold to a keyframes name, got {value:?}"
    );
}
