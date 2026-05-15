use extractor::{
    ExtractedCallsResult, ExtractorConfig, ImportSpecifierKind, MatchCategory, MatchedImport,
    Matcher, Matchers, NameMatcher, extract_calls,
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
    extract_calls(
        source,
        "fixture.tsx",
        matched,
        &ExtractorConfig::new(css_matchers()),
    )
}

fn extract_with(
    source: &str,
    matched: &[MatchedImport],
    matchers: &Matchers,
) -> ExtractedCallsResult {
    extract_calls(
        source,
        "fixture.tsx",
        matched,
        &ExtractorConfig::new(matchers.clone()),
    )
}

#[test]
fn duplicate_object_keys_keep_first_position_with_last_value() {
    // ES object-initializer semantics: a later property with the same key
    // overwrites the earlier value but keeps the *position* of the first
    // occurrence in enumeration order. Our `upsert` helper has to honor
    // both halves of that rule; this test pins it so a future refactor
    // can't silently change extraction order.
    assert_yaml_snapshot!(
        extract("css({ color: 'red', padding: '4px', color: 'blue' })", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: blue
            padding: 4px
        span:
          start: 0
          end: 52
    diagnostics: []
    ",
    );
}

#[test]
fn spread_overwrite_keeps_spread_position() {
    // Same upsert semantics but the duplicate enters through an inline
    // literal spread. The key from the spread keeps its position; the
    // explicit later property only changes the value.
    assert_yaml_snapshot!(
        extract(
            "css({ ...{ color: 'red', padding: '4px' }, color: 'blue' })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: blue
            padding: 4px
        span:
          start: 0
          end: 59
    diagnostics: []
    ",
    );
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

// --- constant folding + AST unwraps ---
// Anything in this section operates on already-literal operands. Identifier
// references and member access still fall through to `None` until Phase 5.

#[test]
fn parenthesized_argument_unwraps() {
    assert_yaml_snapshot!(extract("css(({ color: 'red' }))", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 23
    diagnostics: []
    ");
}

#[test]
fn ts_as_const_unwraps() {
    assert_yaml_snapshot!(extract("css({ color: 'red' } as const)", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 30
    diagnostics: []
    ");
}

#[test]
fn ts_satisfies_unwraps() {
    assert_yaml_snapshot!(
        extract("css({ color: 'red' } satisfies any)", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 35
    diagnostics: []
    ",
    );
}

#[test]
fn ts_non_null_unwraps() {
    assert_yaml_snapshot!(extract("css({ color: 'red' }!)", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 22
    diagnostics: []
    ");
}

#[test]
fn ts_old_style_type_assertion_unwraps() {
    // <T>expr — only valid in non-TSX, so use .ts path
    assert_yaml_snapshot!(
        extract_calls(
            "css(<any>{ color: 'red' })",
            "fixture.ts",
            &[css("css")],
            &ExtractorConfig::new(css_matchers()),
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
          end: 26
    diagnostics: []
    ",
    );
}

#[test]
fn unary_negation_on_numeric_literal() {
    assert_yaml_snapshot!(extract("css({ margin: -4, opacity: -0.5 })", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - margin: -4
            opacity: -0.5
        span:
          start: 0
          end: 34
    diagnostics: []
    ");
}

#[test]
fn unary_plus_on_numeric_literal() {
    assert_yaml_snapshot!(extract("css({ width: +50 })", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - width: 50
        span:
          start: 0
          end: 19
    diagnostics: []
    ");
}

#[test]
fn unary_logical_not_on_literal() {
    assert_yaml_snapshot!(
        extract("css({ a: !true, b: !false, c: !0, d: !'' })", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: false
            b: true
            c: true
            d: true
        span:
          start: 0
          end: 43
    diagnostics: []
    ",
    );
}

#[test]
fn binary_string_concatenation() {
    assert_yaml_snapshot!(
        extract("css({ width: '50' + '%', padding: 'x' + 'y' + 'z' })", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - width: 50%
            padding: xyz
        span:
          start: 0
          end: 52
    diagnostics: []
    ",
    );
}

#[test]
fn binary_numeric_arithmetic() {
    assert_yaml_snapshot!(
        extract(
            "css({ a: 2 + 3, b: 10 - 4, c: 2 * 3, d: 12 / 4, e: 7 % 3 })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: 5
            b: 6
            c: 6
            d: 3
            e: 1
        span:
          start: 0
          end: 59
    diagnostics: []
    ",
    );
}

#[test]
fn template_literal_without_interpolation() {
    assert_yaml_snapshot!(
        extract("css({ color: `red`, font: `sans \\n serif` })", &[css("css")]),
        @r#"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
            font: "sans \n serif"
        span:
          start: 0
          end: 44
    diagnostics: []
    "#,
    );
}

#[test]
fn template_literal_with_interpolation_is_skipped() {
    // Interpolated template literals need identifier/scope resolution
    // (Phase 5). For now they're dropped; the surrounding `css()` call
    // still extracts if other args are extractable, otherwise skipped.
    assert_yaml_snapshot!(
        extract("css({ color: `${dynamic}px` })", &[css("css")]),
        @"
    calls: []
    diagnostics: []
    ",
    );
}

#[test]
fn literal_object_spread_inside_arg() {
    assert_yaml_snapshot!(
        extract(
            "css({ ...{ color: 'red', size: 'lg' }, fontSize: 14 })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
            size: lg
            fontSize: 14
        span:
          start: 0
          end: 54
    diagnostics: []
    ",
    );
}

#[test]
fn literal_array_spread_inside_arg() {
    assert_yaml_snapshot!(
        extract("css({ padding: [1, ...[2, 3], 4] })", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - padding:
              - 1
              - 2
              - 3
              - 4
        span:
          start: 0
          end: 35
    diagnostics: []
    ",
    );
}

#[test]
fn computed_key_from_string_literal() {
    assert_yaml_snapshot!(extract("css({ ['color']: 'red' })", &[css("css")]), @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 25
    diagnostics: []
    ");
}

#[test]
fn computed_key_from_numeric_literal() {
    assert_yaml_snapshot!(extract("css({ [42]: 'red' })", &[css("css")]), @r#"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - "42": red
        span:
          start: 0
          end: 20
    diagnostics: []
    "#);
}

#[test]
fn computed_key_from_concatenation() {
    assert_yaml_snapshot!(
        extract("css({ ['col' + 'or']: 'red' })", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 0
          end: 30
    diagnostics: []
    ",
    );
}

// --- ts-evaluator parity: coercion + conditional/logical with literals ---

#[test]
fn string_coercion_on_addition() {
    // JS `+` coerces non-strings to string when either operand is a string.
    // Very common Panda idiom: `width: 1 + 'px'`.
    assert_yaml_snapshot!(
        extract(
            "css({ width: 1 + 'px', label: 'x: ' + 42, flag: true + '!' })",
            &[css("css")],
        ),
        @r#"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - width: 1px
            label: "x: 42"
            flag: true!
        span:
          start: 0
          end: 61
    diagnostics: []
    "#,
    );
}

#[test]
fn numeric_coercion_in_arithmetic() {
    // JS coerces both operands to number for `-`, `*`, `/`, `%`, `**`.
    // String operands that parse as numbers go through; others fold to None.
    assert_yaml_snapshot!(
        extract(
            "css({ a: '5' - 1, b: '2' * 3, c: true * 4, d: '10' / '2' })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: 4
            b: 6
            c: 4
            d: 5
        span:
          start: 0
          end: 59
    diagnostics: []
    ",
    );
}

#[test]
fn non_numeric_string_in_arithmetic_drops() {
    // `'foo' - 1` would be NaN in JS; we drop the call to avoid emitting
    // a value that doesn't round-trip cleanly through JSON.
    assert_yaml_snapshot!(
        extract("css({ a: 'foo' - 1 })", &[css("css")]),
        @"
    calls: []
    diagnostics: []
    ",
    );
}

#[test]
fn template_literal_with_literal_interpolations() {
    assert_yaml_snapshot!(
        extract(
            "css({ size: `${2 + 3}px`, msg: `count = ${42}, status = ${true}` })",
            &[css("css")],
        ),
        @r#"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - size: 5px
            msg: "count = 42, status = true"
        span:
          start: 0
          end: 67
    diagnostics: []
    "#,
    );
}

#[test]
fn conditional_with_literal_test() {
    // Test is literal → fold the taken branch. Either branch may be a
    // non-literal; the untaken branch isn't evaluated.
    assert_yaml_snapshot!(
        extract(
            "css({ a: true ? 'red' : 'blue', b: 0 ? 'no' : 'yes', c: 'x' ? 'a' : nope })",
            &[css("css")],
        ),
        @r#"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: red
            b: "yes"
            c: a
        span:
          start: 0
          end: 75
    diagnostics: []
    "#,
    );
}

#[test]
fn conditional_with_non_literal_test_drops() {
    // Test is an identifier → can't decide which branch runs at build time.
    // Phase 5 may emit both as alternatives; for now we drop the attribute.
    assert_yaml_snapshot!(
        extract(
            "css({ color: dark ? 'red' : 'blue', size: 'lg' })",
            &[css("css")],
        ),
        @"
    calls: []
    diagnostics: []
    ",
    );
}

#[test]
fn logical_and_or_coalesce_with_literals() {
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                css({
                    a: 'x' && 'y',
                    b: '' && 'z',
                    c: 'first' || 'second',
                    d: '' || 'fallback',
                    e: null ?? 'default',
                    f: 'value' ?? 'unused',
                })
            "},
            &[css("css")],
        ),
        @r#"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: y
            b: ""
            c: first
            d: fallback
            e: default
            f: value
        span:
          start: 0
          end: 152
    diagnostics: []
    "#,
    );
}

#[test]
fn strict_equality_on_literals() {
    assert_yaml_snapshot!(
        extract(
            "css({ a: 'red' === 'red', b: 'red' === 'blue', c: 1 === 1, d: 1 === '1' })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: true
            b: false
            c: true
            d: false
        span:
          start: 0
          end: 74
    diagnostics: []
    ",
    );
}

#[test]
fn loose_equality_with_coercion() {
    // `1 == '1'` → true (string coerces to number).
    // `null == 'x'` → false (only null == null/undefined).
    // `true == 1` → true.
    assert_yaml_snapshot!(
        extract(
            "css({ a: 1 == '1', b: null == 'x', c: true == 1, d: 0 == false })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: true
            b: false
            c: true
            d: true
        span:
          start: 0
          end: 65
    diagnostics: []
    ",
    );
}

#[test]
fn numeric_comparison() {
    assert_yaml_snapshot!(
        extract(
            "css({ a: 3 < 5, b: 5 < 3, c: 5 <= 5, d: 6 > 2, e: 2 >= 2 })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: true
            b: false
            c: true
            d: true
            e: true
        span:
          start: 0
          end: 59
    diagnostics: []
    ",
    );
}

#[test]
fn string_comparison_is_lexicographic() {
    assert_yaml_snapshot!(
        extract("css({ a: 'a' < 'b', b: 'b' < 'a', c: 'ab' < 'abc' })", &[css("css")]),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - a: true
            b: false
            c: true
        span:
          start: 0
          end: 52
    diagnostics: []
    ",
    );
}

#[test]
fn equality_inside_conditional_test() {
    // `cond ? a : b` where `cond` is a literal-foldable equality.
    // Combines binary folding + conditional folding.
    assert_yaml_snapshot!(
        extract(
            "css({ color: (2 + 2 === 4) ? 'green' : 'red', size: (1 > 2) ? 'lg' : 'sm' })",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: green
            size: sm
        span:
          start: 0
          end: 76
    diagnostics: []
    ",
    );
}

#[test]
fn nested_unwraps_and_folding() {
    // Combine several features in one expression: parens, TS cast,
    // unary, binary, computed key, template literal.
    assert_yaml_snapshot!(
        extract(
            "css(((({ ['m' + 'argin']: -2 * 4, color: `red` } as const))))",
            &[css("css")],
        ),
        @"
    calls:
      - category: css
        name: css
        alias: css
        data:
          - margin: -8
            color: red
        span:
          start: 0
          end: 61
    diagnostics: []
    ",
    );
}
