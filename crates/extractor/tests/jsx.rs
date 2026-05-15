use extractor::{
    ExtractedJsxResult, ImportSpecifierKind, MatchCategory, MatchedImport, Matcher, Matchers,
    NameMatcher, extract_jsx,
};
use indoc::indoc;
use insta::assert_yaml_snapshot;

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

fn jsx_matchers() -> Matchers {
    Matchers {
        jsx: Some(Matcher {
            modules: vec!["@panda/jsx".into()],
            names: NameMatcher::only(["styled", "Box", "Stack", "Grid"]),
        }),
        ..Default::default()
    }
}

fn extract(source: &str, matched: &[MatchedImport]) -> ExtractedJsxResult {
    extract_jsx(source, "fixture.tsx", matched, &jsx_matchers())
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
