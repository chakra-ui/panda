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

// --- Every placement ---
//
// The call is a value, so it should fold anywhere a value is written. These
// pin the placements that reach the evaluator through a different door than a
// plain `css({ prop: ... })` entry.

use std::path::PathBuf;

use crate::common::{panda_config_with_token_dictionary, panda_jsx_config};
use pandacss_extractor::{CrossFileResolver, TokenDictionary};
use pandacss_fs::MemoryFileSystem;
use pandacss_tokens::{Token, TokenCategory};

/// Every extracted call and JSX node, serialized, so a placement test can
/// assert the folded run landed somewhere without caring about the shape.
fn everything(usage: &ExtractUsage) -> String {
    let calls = usage
        .calls
        .iter()
        .flat_map(|call| call.data.iter().flatten())
        .map(|literal| literal.to_json().to_string());
    let jsx = usage.jsx.iter().map(|node| node.data.to_json().to_string());
    calls.chain(jsx).collect::<Vec<_>>().join("\n")
}

#[test]
fn folds_inside_css_raw() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css.raw({ width: firstThatWorks('fit-content', 'auto') });
    "});

    assert_eq!(folded.as_deref(), Some("firstThatWorks(fit-content, auto)"));
}

#[test]
fn folds_a_token_call_member_to_its_resolved_value() {
    let dictionary = TokenDictionary::builder()
        .insert(Token::new(
            "colors.brand",
            "#0057b8",
            "var(--colors-brand)",
            TokenCategory::Colors,
        ))
        .build();
    let usage = extract(
        indoc! {r"
            import { css, firstThatWorks } from '@panda/css';
            import { token } from '@panda/tokens';
            css({ color: firstThatWorks('oklch(55% 0.18 250)', token('colors.brand')) });
        "},
        "app.tsx",
        &panda_config_with_token_dictionary(dictionary),
    );

    assert_eq!(
        css_prop(&usage, "color").as_deref(),
        Some("firstThatWorks(oklch(55% 0.18 250), #0057b8)")
    );
}

#[test]
fn folds_a_template_literal_member() {
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        const size = 12;
        css({ width: firstThatWorks(`${size}dvw`, `${size}vw`) });
    "});

    assert_eq!(folded.as_deref(), Some("firstThatWorks(12dvw, 12vw)"));
}

#[test]
fn folds_in_both_arms_of_a_conditional_spread() {
    let usage = extract(
        indoc! {r"
            import { css, firstThatWorks } from '@panda/css';
            css({
              ...(dark
                ? { color: firstThatWorks('oklch(80% 0.1 250)', 'white') }
                : { color: firstThatWorks('oklch(30% 0.1 250)', 'black') }),
            });
        "},
        "app.tsx",
        &panda_config(),
    );

    let all = everything(&usage);
    assert!(
        all.contains("firstThatWorks(oklch(80% 0.1 250), white)"),
        "{all}"
    );
    assert!(
        all.contains("firstThatWorks(oklch(30% 0.1 250), black)"),
        "{all}"
    );
}

#[test]
fn folds_in_a_jsx_condition_prop() {
    let usage = extract(
        indoc! {r"
            import { firstThatWorks } from '@panda/css';
            import { Box } from '@panda/jsx';
            const el = <Box _hover={{ color: firstThatWorks('oklch(60% 0.2 30)', 'red') }} />;
        "},
        "app.tsx",
        &panda_jsx_config(),
    );

    let all = everything(&usage);
    assert!(
        all.contains("firstThatWorks(oklch(60% 0.2 30), red)"),
        "{all}"
    );
}

#[test]
fn folds_in_a_styled_factory_config() {
    let usage = extract(
        indoc! {r"
            import { firstThatWorks } from '@panda/css';
            import { styled } from '@panda/jsx';
            const Card = styled('div', { base: { minHeight: firstThatWorks('100dvh', '100vh') } });
        "},
        "app.tsx",
        &panda_jsx_config(),
    );

    let all = everything(&usage);
    assert!(all.contains("firstThatWorks(100dvh, 100vh)"), "{all}");
}

#[test]
fn folds_in_a_pattern_call() {
    let usage = extract(
        indoc! {r"
            import { firstThatWorks } from '@panda/css';
            import { stack } from '@panda/patterns';
            stack({ gap: firstThatWorks('1rem', 4) });
        "},
        "app.tsx",
        &panda_config(),
    );

    let all = everything(&usage);
    assert!(all.contains("firstThatWorks(1rem, 4)"), "{all}");
}

#[test]
fn folds_a_member_imported_from_another_file() {
    let fs = MemoryFileSystem::new();
    fs.add_file(
        PathBuf::from("/proj/theme.ts"),
        b"export const brand = 'oklch(55% 0.18 250)';".to_vec(),
    );
    let main = PathBuf::from("/proj/main.tsx");
    let source = indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        import { brand } from './theme';
        css({ color: firstThatWorks(brand, '#0057b8') });
    "};
    fs.add_file(main.clone(), source.as_bytes().to_vec());
    let config = panda_config().with_cross_file(CrossFileResolver::with_fs(fs));
    let usage = extract(source, main.to_str().unwrap(), &config);

    assert_eq!(
        css_prop(&usage, "color").as_deref(),
        Some("firstThatWorks(oklch(55% 0.18 250), #0057b8)")
    );
}

#[test]
fn folds_in_a_vue_template_through_a_script_constant() {
    let usage = extract(
        indoc! {r#"
            <template>
              <Box :color="accent" />
            </template>
            <script setup>
            import { Box } from '@panda/jsx';
            import { firstThatWorks } from '@panda/css';
            const accent = firstThatWorks('oklch(60% 0.2 30)', 'red');
            </script>
        "#},
        "Card.vue",
        &panda_jsx_config(),
    );

    let all = everything(&usage);
    assert!(
        all.contains("firstThatWorks(oklch(60% 0.2 30), red)"),
        "{all}"
    );
}

#[test]
fn folds_in_a_svelte_template_attribute() {
    let usage = extract(
        indoc! {r"
            <script>
            import { Box } from '@panda/jsx';
            import { firstThatWorks } from '@panda/css';
            </script>
            <Box color={firstThatWorks('oklch(60% 0.2 30)', 'red')} />
        "},
        "Card.svelte",
        &panda_jsx_config(),
    );

    let all = everything(&usage);
    assert!(
        all.contains("firstThatWorks(oklch(60% 0.2 30), red)"),
        "{all}"
    );
}

#[test]
fn folds_inside_a_template_literal_with_a_trailing_important() {
    // The call is an interpolation like any other, so the whole value folds
    // to the written form with the marker after the closing paren.
    let folded = fold(indoc! {r"
        import { css, firstThatWorks } from '@panda/css';
        css({ width: `${firstThatWorks('fit-content', 'auto')} !important` });
    "});

    assert_eq!(
        folded.as_deref(),
        Some("firstThatWorks(fit-content, auto) !important")
    );
}
