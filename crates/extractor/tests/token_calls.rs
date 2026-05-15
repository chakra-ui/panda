//! `token('path')` and `token.var('path')` resolution against the
//! configured [`TokenDictionary`].
//!
//! Mirrors the JS extractor's `maybe-box-node.ts` token path: when the
//! callee resolves to a `tokens`-category import (i.e. the user's
//! `import { token } from '@panda/tokens'`), the call folds to the
//! dictionary value. Shadowed locals, unknown paths without a fallback,
//! and missing dictionaries all drop the resolution.

use extractor::{
    ExtractUsage, ExtractorConfig, Matcher, Matchers, NameMatcher, TokenDictionary, extract,
};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use tokens::{Token, TokenCategory};

fn base_matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        tokens: Matcher {
            modules: vec!["@panda/tokens".into()],
            names: NameMatcher::only(["token"]),
        },
        ..Default::default()
    }
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
        .build()
}

fn run(source: &str) -> ExtractUsage {
    extract(
        source,
        "fixture.tsx",
        &ExtractorConfig::new(base_matchers()),
    )
}

fn run_with_tokens(source: &str) -> ExtractUsage {
    let config = ExtractorConfig::new(base_matchers()).with_token_dictionary(sample_tokens());
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
