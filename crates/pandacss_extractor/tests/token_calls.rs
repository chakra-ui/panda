//! `token('path')` and `token.var('path')` resolution against the
//! configured [`TokenDictionary`].
//!
//! Mirrors the JS extractor's `maybe-box-node.ts` token path: when the
//! callee resolves to a `tokens`-category import (i.e. the user's
//! `import { token } from '@panda/tokens'`), the call folds to the
//! dictionary value. Shadowed locals, unknown paths without a fallback,
//! and missing dictionaries all drop the resolution.

use indoc::indoc;
use insta::assert_yaml_snapshot;
mod common;

use common::{panda_config, panda_config_with_token_dictionary};
use pandacss_extractor::{ExtractUsage, Literal, TokenDictionary, extract};
use pandacss_tokens::{Token, TokenCategory};

/// Pull a string-valued property out of the first `css({...})` argument.
/// Returns `None` if the `css` call dropped, the arg isn't an object, or the
/// property isn't a folded string — so a divergence fails the assertion.
fn css_string_prop(usage: &ExtractUsage, prop: &str) -> Option<String> {
    let css = usage.calls.iter().find(|c| c.name == "css")?;
    let Some(Literal::Object(entries)) = css.data.first().and_then(Option::as_ref) else {
        return None;
    };
    entries.iter().find_map(|(key, value)| match value {
        Literal::String(text) if key == prop => Some(text.clone()),
        _ => None,
    })
}

/// A small token dictionary mirroring what the Panda runtime would emit
/// for a tiny theme.
fn sample_tokens() -> TokenDictionary {
    TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "sizes.sm",
            "4px",
            "var(--sizes-sm)",
            TokenCategory::Sizes,
        ))
        .insert(Token::new(
            "spacing.4",
            "1rem",
            "var(--spacing-4)",
            TokenCategory::Spacing,
        ))
        .insert(Token::new(
            "colors.primary",
            "var(--colors-primary)",
            "var(--colors-primary)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "colors.colorPalette.500",
            "var(--colors-color-palette-500)",
            "var(--colors-color-palette-500)",
            TokenCategory::Colors,
        ))
        .build()
}

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_config())
}

fn run_with_tokens(source: &str) -> ExtractUsage {
    let config = panda_config_with_token_dictionary(sample_tokens());
    extract(source, "fixture.tsx", &config)
}

#[test]
fn token_call_resolves_to_raw_value() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.red.500') });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#ef4444"
      span:
        start: 73
        end: 112
    - category: tokens
      name: token
      alias: token
      data:
        - colors.red.500
      span:
        start: 86
        end: 109
    "##);
}

#[test]
fn token_var_call_resolves_to_css_variable() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token.var('colors.red.500') });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @"
    - category: css
      name: css
      alias: css
      data:
        - color: var(--colors-red-500)
      span:
        start: 73
        end: 116
    ");
}

#[test]
fn unknown_token_path_with_fallback_uses_fallback() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.fake.999', '#000') });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#000"
      span:
        start: 73
        end: 121
    - category: tokens
      name: token
      alias: token
      data:
        - colors.fake.999
        - "#000"
      span:
        start: 86
        end: 118
    "##);
}

#[test]
fn unknown_token_path_without_fallback_drops_outer_call() {
    // The `token()` call site itself still extracts as a tokens-category
    // record. The *outer* `css()` is what drops, because the inner token
    // didn't fold.
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.fake.999') });
    "};
    let calls = run_with_tokens(src).calls;
    let css_calls: Vec<_> = calls.iter().filter(|c| c.name == "css").collect();
    assert!(
        css_calls.is_empty(),
        "outer css() must drop when token path is unknown: {css_calls:#?}"
    );
}

#[test]
fn no_dictionary_means_no_token_folding() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.red.500') });
    "};
    let calls = run(src).calls;
    let css_calls: Vec<_> = calls.iter().filter(|c| c.name == "css").collect();
    assert!(
        css_calls.is_empty(),
        "without a dictionary, outer css() must drop: {css_calls:#?}"
    );
}

#[test]
fn shadowed_token_function_is_not_resolved() {
    // Local `const token = (_) => 'override'` shadows the import; the
    // resolver detects the non-import binding and refuses to fold.
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        function f() {
          const token = (_: string) => 'override';
          return css({ color: token('colors.red.500') });
        }
    "};
    let calls = run_with_tokens(src).calls;
    assert!(calls.is_empty(), "shadowed token must drop: {calls:#?}");
}

#[test]
fn aliased_token_import_resolves() {
    // `import { token as t }` — the resolver matches on the local alias.
    let src = indoc! {r"
        import { token as t } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: t('colors.red.500') });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#ef4444"
      span:
        start: 78
        end: 113
    - category: tokens
      name: token
      alias: t
      data:
        - colors.red.500
      span:
        start: 91
        end: 110
    "##);
}

#[test]
fn token_path_from_identifier_resolves() {
    // The path arg goes through `expression_to_literal`, so a const-bound
    // string folds and the token lookup proceeds.
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        const path = 'colors.red.500';
        css({ color: token(path) });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @r##"
    - category: css
      name: css
      alias: css
      data:
        - color: "#ef4444"
      span:
        start: 104
        end: 131
    - category: tokens
      name: token
      alias: token
      data:
        - colors.red.500
      span:
        start: 117
        end: 128
    "##);
}

#[test]
fn token_folds_inside_template_literal_interpolation() {
    // `border: `1px solid ${token('colors.red.500')}`` — the token() call inside
    // the template interpolation folds and the whole literal concatenates,
    // matching the JS extractor's token-in-template handling.
    let src = indoc! {r#"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ border: `1px solid ${token('colors.red.500')}` });
    "#};
    assert_yaml_snapshot!(
        css_string_prop(&run_with_tokens(src), "border"),
        @r#""1px solid #ef4444""#
    );
}

#[test]
fn multiple_token_calls_in_one_template_fold() {
    let src = indoc! {r#"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ font: `${token('sizes.sm')} / ${token('colors.red.500')}` });
    "#};
    assert_yaml_snapshot!(
        css_string_prop(&run_with_tokens(src), "font"),
        @r#""4px / #ef4444""#
    );
}

#[test]
fn known_token_ignores_fallback_argument() {
    // `token('colors.red.500', '#000')` with a *known* path resolves to the
    // dictionary value; the fallback is ignored (JS parity — fallback only
    // kicks in for unknown paths).
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.red.500', '#000') });
    "};
    assert_yaml_snapshot!(css_string_prop(&run_with_tokens(src), "color"), @r##""#ef4444""##);
}

#[test]
fn token_var_known_path_ignores_fallback_argument() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({
          color: token.var('colors.red.500', 'var(--ignored)'),
          margin: token.var('spacing.4', 'var(--also-ignored)')
        });
    "};
    assert_yaml_snapshot!(
        run_with_tokens(src)
            .calls
            .iter()
            .find(|c| c.name == "css")
            .expect("css call")
            .data,
        @r#"
    - color: var(--colors-red-500)
      margin: var(--spacing-4)
    "#
    );
}

#[test]
fn semantic_token_like_value_resolves_to_css_variable() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.primary') });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - color: var(--colors-primary)
      span:
        start: 73
        end: 112
    - category: tokens
      name: token
      alias: token
      data:
        - colors.primary
      span:
        start: 86
        end: 109
    "#);
}

#[test]
fn color_palette_token_like_value_resolves_to_css_variable() {
    let src = indoc! {r"
        import { token } from '@panda/tokens';
        import { css } from '@panda/css';
        css({ color: token('colors.colorPalette.500') });
    "};
    assert_yaml_snapshot!(run_with_tokens(src).calls, @r#"
    - category: css
      name: css
      alias: css
      data:
        - color: var(--colors-color-palette-500)
      span:
        start: 73
        end: 121
    - category: tokens
      name: token
      alias: token
      data:
        - colors.colorPalette.500
      span:
        start: 86
        end: 118
    "#);
}
