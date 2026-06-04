use indoc::indoc;
use insta::assert_yaml_snapshot;
mod common;

use common::jsx_config;
use pandacss_extractor::{
    ExtractedJsxResult, ImportSpecifierKind, JsxExtractionConfig, JsxStyleProps, MatchCategory,
    MatchedImport, extract_jsx,
};

fn styled(alias: &str) -> MatchedImport {
    MatchedImport {
        category: MatchCategory::Jsx,
        module: "@panda/jsx".into(),
        name: "styled".into(),
        alias: alias.into(),
        kind: ImportSpecifierKind::Named,
    }
}

fn pattern_component(name: &str) -> MatchedImport {
    MatchedImport {
        category: MatchCategory::Jsx,
        module: "@panda/jsx".into(),
        name: name.into(),
        alias: name.into(),
        kind: ImportSpecifierKind::Named,
    }
}

fn namespace_jsx(alias: &str) -> MatchedImport {
    MatchedImport {
        category: MatchCategory::Jsx,
        module: "@panda/jsx".into(),
        name: "*".into(),
        alias: alias.into(),
        kind: ImportSpecifierKind::Namespace,
    }
}

fn extract(source: &str, matched: &[MatchedImport]) -> ExtractedJsxResult {
    extract_jsx(
        source,
        "fixture.tsx",
        matched,
        &jsx_config(["styled", "Box", "Stack", "Grid"]),
    )
}

fn extract_with_jsx_config(
    source: &str,
    matched: &[MatchedImport],
    jsx: JsxExtractionConfig,
) -> ExtractedJsxResult {
    extract_jsx(
        source,
        "fixture.tsx",
        matched,
        &jsx_config(["styled", "Box", "Stack", "Grid"]).with_jsx(jsx),
    )
}

#[test]
fn lowercase_html_tags_are_ignored() {
    assert_yaml_snapshot!(extract("<div color='red' />", &[styled("styled")]), @"
    jsx: []
    diagnostics: []
    ");
}

#[test]
fn named_component_with_string_attrs() {
    // <Box color="red" />
    assert_yaml_snapshot!(
        extract("<Box color='red' fontSize='lg' />", &[pattern_component("Box")]),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
          fontSize: lg
        span:
          start: 0
          end: 33
    diagnostics: []
    ",
    );
}

#[test]
fn styled_factory_member() {
    // <styled.div color="red" />
    assert_yaml_snapshot!(
        extract("<styled.div color='red' />", &[styled("styled")]),
        @"
    jsx:
      - category: jsx
        name: styled.div
        alias: styled
        data:
          color: red
        span:
          start: 0
          end: 26
    diagnostics: []
    ",
    );
}

#[test]
fn styled_factory_with_multiple_attrs() {
    assert_yaml_snapshot!(
        extract(
            "<styled.button marginTop='40px' marginBottom='42px'>Click</styled.button>",
            &[styled("styled")],
        ),
        @"
    jsx:
      - category: jsx
        name: styled.button
        alias: styled
        data:
          marginTop: 40px
          marginBottom: 42px
        span:
          start: 0
          end: 52
    diagnostics: []
    ",
    );
}

#[test]
fn expression_container_literal_values() {
    // <Box fontSize={42} disabled={true} count={null} />
    assert_yaml_snapshot!(
        extract(
            "<Box fontSize={42} disabled={true} count={null} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          fontSize: 42
          disabled: true
          count: ~
        span:
          start: 0
          end: 50
    diagnostics: []
    ",
    );
}

#[test]
fn boolean_shorthand_attribute() {
    // <Box rounded /> — no value → true
    assert_yaml_snapshot!(extract("<Box rounded />", &[pattern_component("Box")]), @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          rounded: true
        span:
          start: 0
          end: 15
    diagnostics: []
    ");
}

#[test]
fn object_value_attribute() {
    // <Box css={{ color: 'red', fontSize: 'lg' }} />
    assert_yaml_snapshot!(
        extract(
            "<Box css={{ color: 'red', fontSize: 'lg' }} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          css:
            color: red
            fontSize: lg
        span:
          start: 0
          end: 46
    diagnostics: []
    ",
    );
}

#[test]
fn responsive_object_value() {
    // <Box mt={{ base: '4px', md: '8px' }} />
    assert_yaml_snapshot!(
        extract(
            "<Box mt={{ base: '4px', md: '8px' }} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          mt:
            base: 4px
            md: 8px
        span:
          start: 0
          end: 39
    diagnostics: []
    ",
    );
}

#[test]
fn non_literal_attribute_is_skipped() {
    // <Box color={dynamicColor} /> — identifier, not literal
    assert_yaml_snapshot!(
        extract(
            "<Box color={dynamicColor} fontSize='lg' />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          fontSize: lg
        span:
          start: 0
          end: 42
    diagnostics: []
    ",
    );
}

#[test]
fn literal_object_spread_is_merged() {
    // <Box {...{ color: 'red', size: 'md' }} fontSize='lg' />
    assert_yaml_snapshot!(
        extract(
            "<Box {...{ color: 'red', size: 'md' }} fontSize='lg' />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
          size: md
          fontSize: lg
        span:
          start: 0
          end: 55
    diagnostics: []
    ",
    );
}

#[test]
fn non_literal_spread_is_ignored() {
    // <Box {...rest} color='red' /> — identifier spread skipped, color kept
    assert_yaml_snapshot!(
        extract(
            "<Box {...rest} color='red' />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
        span:
          start: 0
          end: 29
    diagnostics: []
    ",
    );
}

#[test]
fn nested_jsx_elements() {
    // Recurses into children — both <Box> and <styled.div> get extracted.
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                <Box color='red'>
                    <styled.div color='blue' />
                </Box>
            "},
            &[styled("styled"), pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
        span:
          start: 0
          end: 17
      - category: jsx
        name: styled.div
        alias: styled
        data:
          color: blue
        span:
          start: 22
          end: 49
    diagnostics: []
    ",
    );
}

#[test]
fn ignores_unmatched_components() {
    // <Unrelated /> not in matchers → not extracted.
    // Wrapped in fragment because adjacent top-level self-closing JSX
    // confuses ASI (Oxc emits a "missing semicolon" diagnostic otherwise).
    assert_yaml_snapshot!(
        extract(
            "<><Box color='red' /><Unrelated color='blue' /></>",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
        span:
          start: 2
          end: 21
    diagnostics: []
    ",
    );
}

// --- JS parity: namespace.test.ts JSX fixtures ---

#[test]
fn js_parity_namespace_styled_member() {
    // import * as JSX from "@panda/jsx"
    // <JSX.styled.div color="red" />
    // Wrap in fragment so adjacent self-closing JSX parses cleanly.
    assert_yaml_snapshot!(
        extract(
            indoc! {"
                <>
                  <JSX.styled.div color='red' />
                  <JSX.Stack color='blue' />
                  <JSX.Grid color='green' />
                </>
            "},
            &[namespace_jsx("JSX")],
        ),
        @"
    jsx:
      - category: jsx
        name: styled.div
        alias: JSX
        data:
          color: red
        span:
          start: 5
          end: 35
      - category: jsx
        name: Stack
        alias: JSX
        data:
          color: blue
        span:
          start: 38
          end: 64
      - category: jsx
        name: Grid
        alias: JSX
        data:
          color: green
        span:
          start: 67
          end: 93
    diagnostics: []
    ",
    );
}

#[test]
fn js_parity_aliased_styled() {
    // import { styled as aliased } from "@panda/jsx"
    // <aliased.button marginTop="40px" /> → name = "styled.button" (uses imported name)
    assert_yaml_snapshot!(
        extract(
            "<aliased.button marginTop='40px' marginBottom='42px' />",
            &[MatchedImport {
                category: MatchCategory::Jsx,
                module: "@panda/jsx".into(),
                name: "styled".into(),
                alias: "aliased".into(),
                kind: ImportSpecifierKind::Named,
            }],
        ),
        @"
    jsx:
      - category: jsx
        name: styled.button
        alias: aliased
        data:
          marginTop: 40px
          marginBottom: 42px
        span:
          start: 0
          end: 55
    diagnostics: []
    ",
    );
}

#[test]
fn parse_error_surfaces_diagnostic() {
    let result = extract("<Box color='red'", &[pattern_component("Box")]);
    assert!(result.jsx.is_empty());
    assert!(!result.diagnostics.is_empty());
}

// --- regression tests for over-extraction ---

#[test]
fn named_pattern_component_member_chain_is_not_extracted() {
    // `<Box.Item />` is dot access into a component, not a Panda factory call.
    // Only `styled` (and any future configured factories) accept member chains
    // on a named import; recipe/pattern components do not.
    assert_yaml_snapshot!(
        extract("<Box.Item color='red' />", &[pattern_component("Box")]),
        @r#"
    jsx: []
    diagnostics: []
    "#,
    );
}

#[test]
fn styled_factory_member_chain_is_extracted() {
    // Sanity check that the factory restriction doesn't break `<styled.x>`.
    assert_yaml_snapshot!(
        extract("<styled.section color='red' />", &[styled("styled")]),
        @"
    jsx:
      - category: jsx
        name: styled.section
        alias: styled
        data:
          color: red
        span:
          start: 0
          end: 30
    diagnostics: []
    ",
    );
}

#[test]
fn matched_jsx_element_with_no_props_emits_empty_object() {
    // Component is the signal even without props (e.g. recipe usage).
    assert_yaml_snapshot!(
        extract("<Box />", &[pattern_component("Box")]),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data: {}
        span:
          start: 0
          end: 7
    diagnostics: []
    ",
    );
}

// --- constant folding + AST unwraps inside JSX expression containers ---
// JSX attribute values that wrap an expression in `{...}` route through the
// shared literal evaluator, so anything `expression_to_literal` can fold
// (parens, TS casts, unary/binary on literals, template literals, spreads,
// computed keys) should work inside `<Box prop={...} />` too.

#[test]
fn parenthesized_attribute_value() {
    assert_yaml_snapshot!(
        extract("<Box style={({ color: 'red' })} />", &[pattern_component("Box")]),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          style:
            color: red
        span:
          start: 0
          end: 34
    diagnostics: []
    ",
    );
}

#[test]
fn ts_as_const_attribute_value() {
    assert_yaml_snapshot!(
        extract(
            "<Box style={{ color: 'red' } as const} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          style:
            color: red
        span:
          start: 0
          end: 41
    diagnostics: []
    ",
    );
}

#[test]
fn ts_satisfies_attribute_value() {
    assert_yaml_snapshot!(
        extract(
            "<Box style={{ color: 'red' } satisfies any} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          style:
            color: red
        span:
          start: 0
          end: 46
    diagnostics: []
    ",
    );
}

#[test]
fn unary_in_attribute_value() {
    assert_yaml_snapshot!(
        extract(
            "<Box margin={-4} opacity={-0.5} disabled={!false} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          margin: -4
          opacity: -0.5
          disabled: true
        span:
          start: 0
          end: 52
    diagnostics: []
    ",
    );
}

#[test]
fn binary_in_attribute_value() {
    assert_yaml_snapshot!(
        extract(
            "<Box width={'50' + '%'} margin={2 + 3} padding={2 * 4} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          width: 50%
          margin: 5
          padding: 8
        span:
          start: 0
          end: 57
    diagnostics: []
    ",
    );
}

#[test]
fn template_literal_attribute_value() {
    assert_yaml_snapshot!(
        extract(
            "<Box color={`red`} font={`sans \\n serif`} />",
            &[pattern_component("Box")],
        ),
        @r#"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
          font: "sans \n serif"
        span:
          start: 0
          end: 44
    diagnostics: []
    "#,
    );
}

#[test]
fn template_literal_with_interpolation_attribute_is_skipped() {
    // Interpolated template literals need identifier/scope resolution.
    // The attribute is dropped; the element itself is still matched.
    assert_yaml_snapshot!(
        extract(
            "<Box color={`${dynamic}px`} fontSize='lg' />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          fontSize: lg
        span:
          start: 0
          end: 44
    diagnostics: []
    ",
    );
}

#[test]
fn literal_object_spread_inside_attribute_object() {
    assert_yaml_snapshot!(
        extract(
            "<Box style={{ ...{ color: 'red', size: 'lg' }, fontSize: 14 }} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          style:
            color: red
            size: lg
            fontSize: 14
        span:
          start: 0
          end: 65
    diagnostics: []
    ",
    );
}

#[test]
fn computed_key_inside_attribute_object() {
    assert_yaml_snapshot!(
        extract(
            "<Box style={{ ['col' + 'or']: 'red', [42]: 'fortytwo' }} />",
            &[pattern_component("Box")],
        ),
        @r#"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          style:
            color: red
            "42": fortytwo
        span:
          start: 0
          end: 59
    diagnostics: []
    "#,
    );
}

#[test]
fn literal_object_spread_attribute() {
    // Top-level `{...{...}}` JSX spread attribute, not nested inside an
    // object value. Already worked; covered now with the new expression
    // forms (parens around a literal object).
    assert_yaml_snapshot!(
        extract(
            "<Box {...({ color: 'red' } as const)} fontSize='lg' />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: red
          fontSize: lg
        span:
          start: 0
          end: 54
    diagnostics: []
    ",
    );
}

#[test]
fn nested_folding_inside_attribute() {
    // Combine parens, TS cast, unary, binary, template, computed key.
    assert_yaml_snapshot!(
        extract(
            "<Box style={((({ ['m' + 'argin']: -2 * 4, color: `red` } as const)))} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          style:
            margin: -8
            color: red
        span:
          start: 0
          end: 72
    diagnostics: []
    ",
    );
}

#[test]
fn css_prop_aliases_extract_like_js_parser_fixture() {
    assert_yaml_snapshot!(
        extract(
            "<styled.div css={{ bg: 'red.200' }} inputCss={{ color: 'blue.300' }} />",
            &[styled("styled")],
        ),
        @"
    jsx:
      - category: jsx
        name: styled.div
        alias: styled
        data:
          css:
            bg: red.200
          inputCss:
            color: blue.300
        span:
          start: 0
          end: 71
    diagnostics: []
    ",
    );
}

#[test]
fn css_prop_aliases_with_array_values_extract_like_js_parser_fixture() {
    assert_yaml_snapshot!(
        extract(
            "<styled.div inputCss={[{ bg: 'red.200' }, { color: 'blue.300' }]} />",
            &[styled("styled")],
        ),
        @"
    jsx:
      - category: jsx
        name: styled.div
        alias: styled
        data:
          inputCss:
            - bg: red.200
            - color: blue.300
        span:
          start: 0
          end: 68
    diagnostics: []
    ",
    );
}

#[test]
fn css_prop_aliases_extract_in_minimal_mode_like_js_parser_fixture() {
    assert_yaml_snapshot!(
        extract_with_jsx_config(
            "<styled.div color='red' css={{ bg: 'red.200' }} wrapperCss={{ p: '4' }} />",
            &[styled("styled")],
            JsxExtractionConfig {
                style_props: JsxStyleProps::Minimal,
                ..Default::default()
            },
        ),
        @r#"
    jsx:
      - category: jsx
        name: styled.div
        alias: styled
        data:
          css:
            bg: red.200
          wrapperCss:
            p: "4"
        span:
          start: 0
          end: 74
    diagnostics: []
    "#,
    );
}

#[test]
fn css_prop_aliases_extract_on_configured_components_in_minimal_mode() {
    let mut jsx = JsxExtractionConfig {
        style_props: JsxStyleProps::Minimal,
        ..Default::default()
    };
    jsx.component_names.insert("MyComponent".into());

    assert_yaml_snapshot!(
        extract_with_jsx_config(
            "<MyComponent color='red' css={{ bg: 'red.200' }} inputCss={{ color: 'blue.300' }} />",
            &[],
            jsx,
        ),
        @"
    jsx:
      - category: jsx
        name: MyComponent
        alias: MyComponent
        data:
          css:
            bg: red.200
          inputCss:
            color: blue.300
        span:
          start: 0
          end: 84
    diagnostics: []
    ",
    );
}

// --- attribute overwrite & spread interleaving ---

#[test]
fn explicit_then_spread_then_explicit_keeps_first_position() {
    // Three `color` writes: explicit, spread, explicit. Last value
    // wins on the value side; first occurrence keeps the slot. Same
    // upsert contract as the call-args spread test; verifies JSX uses
    // the same merge path.
    assert_yaml_snapshot!(
        extract(
            "<Box color='never.100' padding='4' {...{ color: 'never.200' }} color='after.300' margin={2} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          color: after.300
          padding: \"4\"
          margin: 2
        span:
          start: 0
          end: 94
    diagnostics: []
    ",
    );
}

// --- JSX-inside-JSX attribute values ---

#[test]
fn attribute_with_nested_jsx_element_drops_that_attribute() {
    // `icon={<svg />}` — value is a JSX element, not a literal. The
    // attribute is skipped; sibling literal attributes still extract.
    assert_yaml_snapshot!(
        extract(
            "<Box icon={<svg />} ml='2' />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          ml: \"2\"
        span:
          start: 0
          end: 29
    diagnostics: []
    ",
    );
}

#[test]
fn spread_with_nested_jsx_element_drops_the_spread() {
    // `{...{ icon: <svg /> }}` — spread source can't fold because one
    // entry is a JSX element. The spread drops entirely; sibling
    // attributes still extract.
    assert_yaml_snapshot!(
        extract(
            "<Box ml='4' {...{ icon: <svg /> }} />",
            &[pattern_component("Box")],
        ),
        @"
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          ml: \"4\"
        span:
          start: 0
          end: 37
    diagnostics: []
    ",
    );
}

// --- CSS-in-template (`styled.div`...``), parity with string-literal.test.ts ---

#[test]
fn styled_factory_tagged_template_css() {
    // The template body parses into a kebab-keyed style object, recorded like a
    // `<styled.div>` usage.
    let source = indoc! {r"
        const baseStyle = styled.div`
            background: transparent;
            border-radius: 3px;
            border: 1px solid var(--accent-color);
            color: var(--accent-color);
            display: inline-block;
            margin: 0.5rem 1rem;
            padding: 0.5rem 0;
            transition: all 200ms ease-in-out;
            width: 11rem;
        `
    "};
    assert_yaml_snapshot!(extract(source, &[styled("styled")]).jsx, @"
    - category: jsx
      name: styled.div
      alias: styled
      data:
        background: transparent
        border-radius: 3px
        border: 1px solid var(--accent-color)
        color: var(--accent-color)
        display: inline-block
        margin: 0.5rem 1rem
        padding: 0.5rem 0
        transition: all 200ms ease-in-out
        width: 11rem
      span:
        start: 18
        end: 291
    ");
}

#[test]
fn tagged_template_css_splits_value_on_first_colon() {
    // A value keeping a colon (`url(http://…)`) survives — the astish value
    // group stops at the first `;`, not the inner `:`. Each declaration is
    // `;`-terminated, as the astish regex requires.
    assert_yaml_snapshot!(
        extract(
            "const x = styled.div`background: url(http://x.png); color: red;`",
            &[styled("styled")],
        ),
        @r#"
    jsx:
      - category: jsx
        name: styled.div
        alias: styled
        data:
          background: "url(http://x.png)"
          color: red
        span:
          start: 10
          end: 64
    diagnostics: []
    "#,
    );
}

#[test]
fn tagged_template_css_nests_at_rules_and_selectors() {
    // Nested at-rules / selectors fold into nested objects via the astish port
    // (no flat-only limitation). Grounded in `astish.test.ts` › "should work
    // with media queries": a bare `@media` block nests under its full
    // condition key; flat declarations stay at the top level.
    assert_yaml_snapshot!(
        extract(
            "const x = styled.div`width: 500px; height: 500px; background: red; @media (min-width: 700px) { background: blue; }`",
            &[styled("styled")],
        ),
        @r#"
    jsx:
      - category: jsx
        name: styled.div
        alias: styled
        data:
          width: 500px
          height: 500px
          background: red
          "@media (min-width: 700px)":
            background: blue
        span:
          start: 10
          end: 115
    diagnostics: []
    "#,
    );
}

#[test]
fn tagged_template_css_joins_multiline_selectors() {
    // Grounded in `astish.test.ts` › "with multiline selectors": a selector
    // split across lines (`& span,\n& p`) collapses to one key (`& span, & p`)
    // and its block nests. Selectors already containing `&` keep no extra
    // prefix.
    let source = indoc! {r"
        const x = styled.div`
            background: pink;
            & span,
            & p {
                color: blue;
            }
        `
    "};
    assert_yaml_snapshot!(extract(source, &[styled("styled")]).jsx, @r#"
    - category: jsx
      name: styled.div
      alias: styled
      data:
        background: pink
        "& span, & p":
          color: blue
      span:
        start: 10
        end: 94
    "#);
}

#[test]
fn tagged_template_css_matches_shared_astish_fixture() {
    let source = indoc! {r"
        const x = styled.div`
            display: flex;
            align-items: center;
            -webkit-align-items: center;
            @media (min-width: 400) {
                color: red;
                justify-content: center;
            }
            @container (min-inline-width: 600px) {
                background: pink;
            }
        `
    "};
    let result = extract(source, &[styled("styled")]);
    assert_yaml_snapshot!(result.jsx[0].data, @r#"
    display: flex
    align-items: center
    "-webkit-align-items": center
    "@media (min-width: 400)":
      color: red
      justify-content: center
    "@container (min-inline-width: 600px)":
      background: pink
    "#);
}

#[test]
fn tagged_template_css_supports_native_nesting_and_custom_props() {
    let source = indoc! {r"
        const x = styled.div`
            color: red;
            --test: 4px;
            p {
                color: blue;
            }
            h1,
            h2,
            h3,
            h4 {
                color: pink;
                font-weight: bold;
                margin-bottom: 1rem;
            }
        `
    "};
    let result = extract(source, &[styled("styled")]);
    assert_yaml_snapshot!(result.jsx[0].data, @r#"
    color: red
    "--test": 4px
    "& p":
      color: blue
    "& h1, h2, h3, h4":
      color: pink
      font-weight: bold
      margin-bottom: 1rem
    "#);
}
