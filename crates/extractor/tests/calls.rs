use extractor::{
    ExtractedCallsResult, ImportSpecifierKind, MatchCategory, MatchedImport, Matcher, Matchers,
    NameMatcher, extract_calls,
};
use indoc::indoc;
use insta::assert_yaml_snapshot;

fn css(alias: &str) -> MatchedImport {
    MatchedImport {
        category: MatchCategory::Css,
        module: "@panda/css".into(),
        name: "css".into(),
        alias: alias.into(),
        kind: ImportSpecifierKind::Named,
    }
}

fn cva(alias: &str) -> MatchedImport {
    MatchedImport {
        category: MatchCategory::Css,
        module: "@panda/css".into(),
        name: "cva".into(),
        alias: alias.into(),
        kind: ImportSpecifierKind::Named,
    }
}

fn namespace(alias: &str, module: &str, category: MatchCategory) -> MatchedImport {
    MatchedImport {
        category,
        module: module.into(),
        name: "*".into(),
        alias: alias.into(),
        kind: ImportSpecifierKind::Namespace,
    }
}

fn css_matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        ..Default::default()
    }
}

fn panda_matchers(prefix: &str) -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec![format!("{prefix}/css")],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: Matcher {
            modules: vec![format!("{prefix}/recipes")],
            names: NameMatcher::Any,
        },
        pattern: Matcher {
            modules: vec![format!("{prefix}/patterns")],
            names: NameMatcher::Any,
        },
        jsx: Some(Matcher {
            modules: vec![format!("{prefix}/jsx")],
            names: NameMatcher::only(["styled", "Box"]),
        }),
        tokens: Matcher {
            modules: vec![format!("{prefix}/tokens")],
            names: NameMatcher::only(["token"]),
        },
    }
}

fn extract(source: &str, matched: &[MatchedImport]) -> ExtractedCallsResult {
    extract_calls(source, "fixture.tsx", matched, &css_matchers())
}

fn extract_with(
    source: &str,
    matched: &[MatchedImport],
    matchers: &Matchers,
) -> ExtractedCallsResult {
    extract_calls(source, "fixture.tsx", matched, matchers)
}

#[test]
fn empty_object_arg() {
    assert_yaml_snapshot!(extract("css({})", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - {}
        span:
          start: 0
          end: 7
    diagnostics: []
    ");
}

#[test]
fn literal_string_value() {
    assert_yaml_snapshot!(extract("css({ color: 'red' })", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 21
    diagnostics: []
    ");
}

#[test]
fn mixed_value_types() {
    assert_yaml_snapshot!(
        extract(
            "css({ color: 'red', fontSize: 12, italic: true, decoration: null })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
            fontSize: 12
            italic: true
            decoration: ~
        span:
          start: 0
          end: 67
    diagnostics: []
    ",
    );
}

#[test]
fn nested_object_value() {
    assert_yaml_snapshot!(
        extract(
            "css({ _hover: { color: 'red', bg: 'blue' }, fontSize: 16 })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - _hover:
              color: red
              bg: blue
            fontSize: 16
        span:
          start: 0
          end: 59
    diagnostics: []
    ",
    );
}

#[test]
fn array_value() {
    assert_yaml_snapshot!(extract("css({ padding: [4, 8, 12] })", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - padding:
              - 4
              - 8
              - 12
        span:
          start: 0
          end: 28
    diagnostics: []
    ");
}

#[test]
fn aliased_local_binding() {
    // import { css as nCss } from "@panda/css"
    assert_yaml_snapshot!(extract("nCss({ color: 'red' })", &[css("nCss")]), @"
    calls:
      - category: css
        name: css
        alias: nCss
        data:
          - color: red
        span:
          start: 0
          end: 22
    diagnostics: []
    ");
}

#[test]
fn multiple_calls_in_one_source() {
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                const a = css({ color: 'red' })
                const b = css({ color: 'blue' })
                const c = cva({ base: { color: 'green' } })
            "},
            &[css("css"), cva("cva")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 10
          end: 31
      - category: css
        name: css
        alias: css
        data:
          - color: blue
        span:
          start: 42
          end: 64
      - category: css
        name: cva
        alias: cva
        data:
          - base:
              color: green
        span:
          start: 75
          end: 108
    diagnostics: []
    ",
    );
}

#[test]
fn ignores_unmatched_callees() {
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                css({ color: 'red' })
                unrelated({ color: 'blue' })
            "},
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 21
    diagnostics: []
    ",
    );
}

#[test]
fn skips_non_literal_arguments() {
    // Identifier args, member access, conditionals — none extractable yet.
    // Phase 5 (static evaluator) will resolve same-file constants.
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                css(styles)
                css(theme.colors)
                css(cond ? a : b)
            "},
            &[css("css")],
        ),
        @"
    calls: []
    diagnostics: []
    ",
    );
}

#[test]
fn rejects_spread_in_object() {
    // Spread requires static evaluation; skip until Phase 5.
    assert_yaml_snapshot!(extract("css({ ...base, color: 'red' })", &[css("css")]), @"
    calls: []
    diagnostics: []
    ");
}

#[test]
fn finds_calls_inside_jsx() {
    assert_yaml_snapshot!(
        extract(
            "const el = <div className={css({ color: 'red' })} />",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 27
          end: 48
    diagnostics: []
    ",
    );
}

#[test]
fn finds_calls_inside_function_body() {
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                function Button() {
                  return css({ color: 'red' })
                }
            "},
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 29
          end: 50
    diagnostics: []
    ",
    );
}

#[test]
fn computed_keys_skip_extraction() {
    assert_yaml_snapshot!(extract("css({ [dynamicKey]: 'red' })", &[css("css")]), @"
    calls: []
    diagnostics: []
    ");
}

#[test]
fn parse_error_surfaces_diagnostic() {
    let result = extract("css({ color: 'red'", &[css("css")]);
    assert!(result.calls.is_empty());
    assert!(!result.diagnostics.is_empty());
}

// --- multi-arg calls ---

#[test]
fn multi_arg_call_extracts_all_literal_args() {
    // styled('div', { base: { color: 'red' } }) — both args are literal.
    assert_yaml_snapshot!(
        extract(
            "styled('div', { base: { color: 'red' } })",
            &[MatchedImport {
                category: MatchCategory::Jsx,
                module: "@panda/jsx".into(),
                name: "styled".into(),
                alias: "styled".into(),
                kind: ImportSpecifierKind::Named,
            }],
        ),
        @"
    calls:
      - category: jsx
        name: styled
        alias: styled
        data:
          - div
          - base:
              color: red
        span:
          start: 0
          end: 41
    diagnostics: []
    ",
    );
}

#[test]
fn non_literal_args_are_omitted_from_data() {
    // First arg is an identifier (non-literal), second is a literal object.
    // Output omits the identifier; positional alignment with source is lost.
    assert_yaml_snapshot!(
        extract(
            "pattern(template, { color: 'red' })",
            &[MatchedImport {
                category: MatchCategory::Pattern,
                module: "@panda/patterns".into(),
                name: "pattern".into(),
                alias: "pattern".into(),
                kind: ImportSpecifierKind::Named,
            }],
        ),
        @"
    calls:
      - category: pattern
        name: pattern
        alias: pattern
        data:
          - ~
          - color: red
        span:
          start: 0
          end: 35
    diagnostics: []
    ",
    );
}

// --- namespace callees ---
// Mirrors `packages/parser/__tests__/namespace.test.ts`.

#[test]
fn js_parity_namespace_css_aliases() {
    // panda.css(...), panda.cva(...), panda.sva(...) all resolve via the
    // css matcher's name allowlist.
    assert_yaml_snapshot!(
        extract_with(
            indoc! {r#"
                import * as panda from "@panda/css"
                panda.css({ color: "red" })
                panda.cva({ base: { color: "blue" } })
                panda.sva({ base: { root: { color: "green" } } })
            "#},
            &[namespace("panda", "@panda/css", MatchCategory::Css)],
            &panda_matchers("@panda"),
        ),
        @"
    calls:
      - category: css
        name: css
        alias: panda
        data:
          - color: red
        span:
          start: 36
          end: 63
      - category: css
        name: cva
        alias: panda
        data:
          - base:
              color: blue
        span:
          start: 64
          end: 102
      - category: css
        name: sva
        alias: panda
        data:
          - base:
              root:
                color: green
        span:
          start: 103
          end: 152
    diagnostics: []
    ",
    );
}

#[test]
fn js_parity_namespace_pattern() {
    // p.stack({...}) — pattern matcher names is None, so any property qualifies.
    assert_yaml_snapshot!(
        extract_with(
            indoc! {r#"
                import * as p from "@panda/patterns"
                p.stack({ mt: "40px" })
            "#},
            &[namespace("p", "@panda/patterns", MatchCategory::Pattern)],
            &panda_matchers("@panda"),
        ),
        @"
    calls:
      - category: pattern
        name: stack
        alias: p
        data:
          - mt: 40px
        span:
          start: 37
          end: 60
    diagnostics: []
    ",
    );
}

#[test]
fn js_parity_namespace_recipe() {
    // recipes.cardStyle({...}) — recipe matcher names is None.
    assert_yaml_snapshot!(
        extract_with(
            indoc! {r#"
                import * as recipes from "@panda/recipes"
                recipes.cardStyle({ rounded: true })
            "#},
            &[namespace("recipes", "@panda/recipes", MatchCategory::Recipe)],
            &panda_matchers("@panda"),
        ),
        @"
    calls:
      - category: recipe
        name: cardStyle
        alias: recipes
        data:
          - rounded: true
        span:
          start: 42
          end: 78
    diagnostics: []
    ",
    );
}

#[test]
fn namespace_property_outside_name_allowlist_is_skipped() {
    // panda.somethingElse(...) — `somethingElse` is not in [css, cva, sva].
    assert_yaml_snapshot!(
        extract_with(
            "panda.somethingElse({ color: 'red' })",
            &[namespace("panda", "@panda/css", MatchCategory::Css)],
            &panda_matchers("@panda"),
        ),
        @"
    calls: []
    diagnostics: []
    ",
    );
}

#[test]
fn called_namespace_alias_without_property_is_skipped() {
    // `panda(...)` (calling the namespace itself) is not a Panda call.
    assert_yaml_snapshot!(
        extract_with(
            "panda({ color: 'red' })",
            &[namespace("panda", "@panda/css", MatchCategory::Css)],
            &panda_matchers("@panda"),
        ),
        @"
    calls: []
    diagnostics: []
    ",
    );
}
