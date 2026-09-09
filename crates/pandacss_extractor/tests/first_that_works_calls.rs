//! `firstThatWorks(a, b)` folding.
//!
//! The call folds to the written `firstThatWorks(a, b)` value form, members in
//! the order written (most-preferred first), which the stylesheet later
//! expands into one declaration per member. Only Panda's own `firstThatWorks`
//! import folds: a local of the same name, another module's export, or a
//! member call on some other object is left alone, so a property carrying one
//! stays open and nothing is invented.

use indoc::indoc;

use crate::common::panda_config;
use pandacss_extractor::{ExtractUsage, Literal, extract};

/// The folded value of a property in the first `css({...})` argument.
/// `None` when the property dropped or did not fold to a string.
fn css_prop(usage: &ExtractUsage, prop: &str) -> Option<String> {
    let css = usage.calls.iter().find(|call| call.name == "css")?;
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
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('min(60rem, 100%)', '75%') });
    "});

    assert_eq!(
        folded.as_deref(),
        Some("firstThatWorks(min(60rem, 100%), 75%)")
    );
}

#[test]
fn folds_a_three_member_call() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('75%', '50%', '25%') });
    "});

    assert_eq!(folded.as_deref(), Some("firstThatWorks(75%, 50%, 25%)"));
}

#[test]
fn folds_numeric_members_to_their_js_string_form() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('1rem', 4) });
    "});

    assert_eq!(folded.as_deref(), Some("firstThatWorks(1rem, 4)"));
}

#[test]
fn folds_members_that_resolve_from_local_constants() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        const baseline = '75%';
        css({ width: firstThatWorks('min(60rem, 100%)', baseline) });
    "});

    assert_eq!(
        folded.as_deref(),
        Some("firstThatWorks(min(60rem, 100%), 75%)")
    );
}

#[test]
fn folds_a_run_held_in_a_local_constant() {
    // The standalone call is an ordinary same-file binding, so a value
    // computed once and reused folds like any other constant.
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        const width = firstThatWorks('min(60rem, 100%)', '75%');
        css({ width });
    "});

    assert_eq!(
        folded.as_deref(),
        Some("firstThatWorks(min(60rem, 100%), 75%)")
    );
}

#[test]
fn folds_through_a_renamed_import() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks as ftw } from '@panda/css';
        css({ width: ftw('75%', '100%') });
    "});

    assert_eq!(folded.as_deref(), Some("firstThatWorks(75%, 100%)"));
}

#[test]
fn folds_through_a_namespace_import() {
    let usage = extract(
        indoc! {r"
            import * as p from '@panda/css';
            p.css({ width: p.firstThatWorks('75%', '100%') });
        "},
        "app.tsx",
        &panda_config(),
    );

    assert_eq!(
        css_prop(&usage, "width").as_deref(),
        Some("firstThatWorks(75%, 100%)")
    );
}

#[test]
fn a_local_of_the_same_name_is_an_ordinary_call() {
    // Not Panda's import, so it folds to whatever the local returns, never to a run.
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        const firstThatWorks = (a, b) => a;
        css({ width: firstThatWorks('75%', '100%') });
    "});

    assert_eq!(folded.as_deref(), Some("75%"));
}

#[test]
fn does_not_fold_another_modules_export_of_the_same_name() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        import { firstThatWorks } from './compat';
        css({ width: firstThatWorks('75%', '100%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_member_call_on_an_unrelated_object() {
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        import { theme } from './theme';
        css({ width: theme.firstThatWorks('75%', '100%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_member_call_on_the_css_binding() {
    // `firstThatWorks` is its own export, not a method of `css`.
    let folded = fold(indoc! {r"
        import { css } from '@panda/css';
        css({ width: css.firstThatWorks('75%', '100%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_single_member_call() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('75%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_dynamic_member() {
    // Emitting only the baseline would make the build disagree with the runtime.
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks(enhanced, '75%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_an_object_member() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks({ base: '100%' }, '75%') });
    "});

    assert_eq!(folded, None);
}

#[test]
fn does_not_fold_a_boolean_or_null_member() {
    let with_bool = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks(true, '75%') });
    "});
    let with_null = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks(null, '75%') });
    "});

    assert_eq!(with_bool, None);
    assert_eq!(with_null, None);
}

#[test]
fn folds_a_run_nested_in_a_condition() {
    let usage = extract(
        indoc! {r"
            import { css, firstThatWorks } from '@panda/css';
            css({ _hover: { width: firstThatWorks('75%', '100%') } });
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
        Some(&Literal::String("firstThatWorks(75%, 100%)".to_owned()))
    );
}

// --- Diagnostics ---

/// Only the `firstThatWorks` codes. A dropped call also reports the ordinary
/// `panda_call_unextractable`, which is not what these tests are about.
fn diagnostics(source: &str) -> Vec<String> {
    extract(source, "app.tsx", &panda_config())
        .diagnostics
        .iter()
        .map(|d| d.code.clone())
        .filter(|code| code.starts_with("first_that_works_"))
        .collect()
}

#[test]
fn a_one_argument_call_reports_bad_arity() {
    let reported = diagnostics(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('75%') });
    "});

    assert_eq!(reported, ["first_that_works_arity_invalid"]);
}

#[test]
fn an_object_member_reports_an_invalid_member() {
    let reported = diagnostics(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks({ base: '100%' }, '75%') });
    "});

    assert_eq!(reported, ["first_that_works_member_invalid"]);
}

#[test]
fn a_boolean_member_reports_an_invalid_member() {
    let reported = diagnostics(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks(true, '75%') });
    "});

    assert_eq!(reported, ["first_that_works_member_invalid"]);
}

#[test]
fn a_dynamic_member_reports_nothing() {
    // A dynamic value is an ordinary runtime bailout, not a mistake.
    let reported = diagnostics(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks(enhanced, '75%') });
    "});

    assert!(reported.is_empty(), "{reported:?}");
}

#[test]
fn a_valid_call_reports_nothing() {
    let reported = diagnostics(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('min(60rem, 100%)', '75%') });
    "});

    assert!(reported.is_empty(), "{reported:?}");
}

#[test]
fn another_modules_export_reports_nothing() {
    let reported = diagnostics(indoc! {r"
        import { css } from '@panda/css';
        import { firstThatWorks } from './compat';
        css({ width: firstThatWorks('75%') });
    "});

    assert!(reported.is_empty(), "{reported:?}");
}

#[test]
fn a_reported_call_carries_its_source_span() {
    let source = indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: firstThatWorks('75%') });
    "};
    let usage = extract(source, "app.tsx", &panda_config());

    let reported = usage
        .diagnostics
        .iter()
        .find(|d| d.code.starts_with("first_that_works_"))
        .expect("a firstThatWorks diagnostic");
    let span = reported.span.expect("span");
    assert_eq!(
        &source[span.start as usize..span.end as usize],
        "firstThatWorks('75%')"
    );
}
