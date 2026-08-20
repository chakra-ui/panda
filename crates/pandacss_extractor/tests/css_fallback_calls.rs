//! `css.fallback(a, b)` folding.
//!
//! The call folds to the written `fallback(a, b)` value form, members in the
//! order written (most-preferred first), which the stylesheet later expands
//! into one declaration per member. Only Panda's own
//! `css` binding folds: a shadowed local or an unrelated object with a
//! `.fallback()` method is left alone, so a property carrying one stays open
//! and nothing is invented.

use indoc::indoc;

use crate::common::panda_config;
use pandacss_extractor::{ExtractUsage, Literal, extract};

/// The folded value of a property in the first `css({...})` argument.
/// `None` when the property dropped or did not fold to a string.
fn css_prop(usage: &ExtractUsage, prop: &str) -> Option<String> {
    css_prop_of(usage, "css", prop)
}

fn css_prop_of(usage: &ExtractUsage, call_name: &str, prop: &str) -> Option<String> {
    let css = usage.calls.iter().find(|call| call.name == call_name)?;
    let Some(Literal::Object(entries)) = css.data.first().and_then(Option::as_ref) else {
        return None;
    };
    entries.iter().find_map(|(key, value)| match value {
        Literal::String(text) if key == prop => Some(text.clone()),
        _ => None,
    })
}

fn fold(source: &str) -> Option<String> {
    let usage = extract(source, "app.tsx", &panda_config());
    css_prop(&usage, "width")
}

#[test]
fn folds_a_two_member_call() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('min(60rem, 100%)', '75%') });
    "});

    assert_eq!(folded.as_deref(), Some("fallback(min(60rem, 100%), 75%)"));
}

#[test]
fn folds_a_three_member_call() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('75%', '50%', '25%') });
    "});

    assert_eq!(folded.as_deref(), Some("fallback(75%, 50%, 25%)"));
}

#[test]
fn folds_numeric_members_to_their_js_string_form() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('1rem', 4) });
    "});

    assert_eq!(folded.as_deref(), Some("fallback(1rem, 4)"));
}

#[test]
fn folds_members_that_resolve_from_local_constants() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        const baseline = '75%';
        css({ width: css.fallback('min(60rem, 100%)', baseline) });
    "});

    assert_eq!(folded.as_deref(), Some("fallback(min(60rem, 100%), 75%)"));
}

#[test]
fn folds_through_a_renamed_css_import() {
    let folded = fold(indoc! {r"
        import { css as panda } from '@panda/css';
        panda({ width: panda.fallback('75%', '100%') });
    "});

    assert_eq!(folded.as_deref(), Some("fallback(75%, 100%)"));
}

#[test]
fn folds_through_a_namespace_import() {
    let usage = extract(
        indoc! {r"
            import * as p from '@panda/css';
            p.css({ width: p.css.fallback('75%', '100%') });
        "},
        "app.tsx",
        &panda_config(),
    );

    assert_eq!(
        css_prop(&usage, "width").as_deref(),
        Some("fallback(75%, 100%)")
    );
}

#[test]
fn does_not_fold_a_local_object_that_shadows_the_css_name() {
    // `panda` is Panda's binding; the local `css` object merely shares the name.
    let usage = extract(
        indoc! {r"
            import { css as panda } from '@panda/css';
            const css = { fallback: (a, b) => a };
            panda({ width: css.fallback('75%', '100%') });
        "},
        "app.tsx",
        &panda_config(),
    );

    assert_eq!(css_prop_of(&usage, "panda", "width"), None);
}

#[test]
fn does_not_fold_an_unrelated_fallback_method() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        import { theme } from './theme';
        css({ width: theme.fallback('75%', '100%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_single_member_call() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('75%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_dynamic_member() {
    // Emitting only the baseline would make the build disagree with the runtime.
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback(enhanced, '75%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_an_object_member() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback({ base: '100%' }, '75%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_boolean_or_null_member() {
    let with_bool = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback(true, '75%') });
    "});
    let with_null = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback(null, '75%') });
    "});

    assert_eq!(with_bool, None);
    assert_eq!(with_null, None);
}

#[test]
fn does_not_fold_fallback_on_a_sibling_css_export() {
    // `cva` is in the css category but codegen puts `fallback` on `css` alone.
    let folded = fold(indoc! {r"
        import { css, cva } from '@panda/css';
        css({ width: cva.fallback('75%', '100%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_fallback_on_a_namespace_sibling() {
    let usage = extract(
        indoc! {r"
            import * as p from '@panda/css';
            p.css({ width: p.cva.fallback('75%', '100%') });
        "},
        "app.tsx",
        &panda_config(),
    );

    assert_eq!(css_prop(&usage, "width"), None);
}

#[test]
fn folds_a_run_nested_in_a_condition() {
    let usage = extract(
        indoc! {r"
            import { css } from '@panda/css';
            css({ _hover: { width: css.fallback('75%', '100%') } });
        "},
        "app.tsx",
        &panda_config(),
    );

    let css = usage.calls.iter().find(|call| call.name == "css").unwrap();
    let Some(Literal::Object(entries)) = css.data.first().and_then(Option::as_ref) else {
        panic!("expected a css object argument");
    };
    let Some((_, Literal::Object(hover))) = entries.iter().find(|(key, _)| key == "_hover") else {
        panic!("expected a _hover object");
    };

    assert_eq!(
        hover.iter().find(|(key, _)| key == "width").map(|(_, v)| v),
        Some(&Literal::String("fallback(75%, 100%)".to_owned()))
    );
}

// --- Diagnostics ---

/// Only the fallback codes. A dropped call also reports the ordinary
/// `panda_call_unextractable`, which is not what these tests are about.
fn diagnostics(source: &str) -> Vec<String> {
    extract(source, "app.tsx", &panda_config())
        .diagnostics
        .iter()
        .map(|d| d.code.clone())
        .filter(|code| code.starts_with("css_fallback_"))
        .collect()
}

#[test]
fn a_one_argument_call_reports_bad_arity() {
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('75%') });
    "});

    assert_eq!(reported, ["css_fallback_arity_invalid"]);
}

#[test]
fn an_object_member_reports_an_invalid_member() {
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback({ base: '100%' }, '75%') });
    "});

    assert_eq!(reported, ["css_fallback_member_invalid"]);
}

#[test]
fn a_boolean_member_reports_an_invalid_member() {
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback(true, '75%') });
    "});

    assert_eq!(reported, ["css_fallback_member_invalid"]);
}

#[test]
fn a_dynamic_member_reports_nothing() {
    // A dynamic value is an ordinary runtime bailout, not a mistake.
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback(enhanced, '75%') });
    "});

    assert!(reported.is_empty(), "{reported:?}");
}

#[test]
fn a_valid_call_reports_nothing() {
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('min(60rem, 100%)', '75%') });
    "});

    assert!(reported.is_empty(), "{reported:?}");
}

#[test]
fn a_non_panda_fallback_method_reports_nothing() {
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        import { theme } from './theme';
        css({ width: theme.fallback('75%') });
    "});

    assert!(reported.is_empty(), "{reported:?}");
}

#[test]
fn a_reported_call_carries_its_source_span() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.fallback('75%') });
    "};
    let usage = extract(source, "app.tsx", &panda_config());

    let reported = usage
        .diagnostics
        .iter()
        .find(|d| d.code.starts_with("css_fallback_"))
        .expect("a fallback diagnostic");
    let span = reported.span.expect("span");
    assert_eq!(
        &source[span.start as usize..span.end as usize],
        "css.fallback('75%')"
    );
}
