
use crate::common::{panda_config, panda_config_with_jsx};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{JsxExtractionConfig, extract, extract_debug};

#[test]
fn single_pass_extract_combines_calls_and_jsx() {
    // One source containing imports, matched calls, unmatched calls, and JSX.
    // The combined entrypoint should produce all four sections from one parse.
    assert_yaml_snapshot!(
        extract_debug(
            indoc! {r#"
                import { css } from "@panda/css"
                import { Box } from "@panda/jsx"
                const a = css({ color: "red" })
                unrelated({ ignored: true })
                const el = <Box fontSize="lg" />
            "#},
            "fixture.tsx",
            &panda_config(),
        ),
        @r#"
    imports:
      - module: "@panda/css"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: css
            local: css
            typeOnly: false
            span:
              start: 9
              end: 12
        span:
          start: 0
          end: 32
      - module: "@panda/jsx"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: Box
            local: Box
            typeOnly: false
            span:
              start: 42
              end: 45
        span:
          start: 33
          end: 65
    matched:
      - category: css
        module: "@panda/css"
        name: css
        alias: css
        kind: named
      - category: jsx
        module: "@panda/jsx"
        name: Box
        alias: Box
        kind: named
    calls:
      - category: css
        name: css
        alias: css
        data:
          - color: red
        span:
          start: 76
          end: 97
    jsx:
      - category: jsx
        name: Box
        alias: Box
        data:
          fontSize: lg
        span:
          start: 138
          end: 159
    diagnostics: []
    "#,
    );
}

#[test]
fn extract_with_namespace() {
    assert_yaml_snapshot!(
        extract_debug(
            indoc! {r#"
                import * as panda from "@panda/css"
                panda.css({ color: "red" })
                panda.cva({ base: { color: "blue" } })
            "#},
            "fixture.tsx",
            &panda_config(),
        ),
        @r#"
    imports:
      - module: "@panda/css"
        kind: value
        typeOnly: false
        specifiers:
          - kind: namespace
            imported: "*"
            local: panda
            typeOnly: false
            span:
              start: 7
              end: 17
        span:
          start: 0
          end: 35
    matched:
      - category: css
        module: "@panda/css"
        name: "*"
        alias: panda
        kind: namespace
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
    jsx: []
    diagnostics: []
    "#,
    );
}

#[test]
fn extract_skips_visitor_work_when_no_panda_imports_match() {
    // Fast path: a file with no Panda imports produces no calls and no
    // JSX (Panda's JSX matchers require imported components like
    // `styled` / `Box`), so we skip building the resolver and walking
    // both visitors entirely. Behaviour-only assertion — the speedup
    // belongs in the bench harness.
    let result = extract(
        indoc! {r#"
            import { useState } from "react"
            import path from "node:path"

            const Component = () => {
              const [n, setN] = useState(0)
              return <div onClick={() => setN(n + 1)}>{n}</div>
            }
        "#},
        "fixture.tsx",
        &panda_config(),
    );
    assert!(result.calls.is_empty());
    assert!(result.jsx.is_empty());
    assert!(result.diagnostics.is_empty());
}

#[test]
fn extract_surfaces_parse_errors_even_with_no_panda_imports() {
    // The fast-path skip mustn't swallow parse diagnostics — a syntax
    // error in a Panda-free file still surfaces as a diagnostic.
    let result = extract(
        "import { useState } from 'react'\nconst x = ;",
        "fixture.tsx",
        &panda_config(),
    );
    assert!(!result.diagnostics.is_empty());
}

#[test]
fn extract_debug_skips_work_but_keeps_unmatched_imports() {
    assert_yaml_snapshot!(
        extract_debug(
            indoc! {r#"
                import { useState } from "react"
                const value = useState(0)
            "#},
            "fixture.tsx",
            &panda_config(),
        ),
        @r#"
    imports:
      - module: react
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: useState
            local: useState
            typeOnly: false
            span:
              start: 9
              end: 17
        span:
          start: 0
          end: 32
    matched: []
    calls: []
    jsx: []
    diagnostics: []
    "#
    );
}

#[test]
fn configured_jsx_components_still_extract_without_imports() {
    let mut jsx = JsxExtractionConfig::default();
    jsx.component_names.insert("Card".into());

    assert_yaml_snapshot!(
        extract(
            "<Card color='red' onClick={handler} />",
            "fixture.tsx",
            &panda_config_with_jsx(jsx),
        ),
        @r#"
    calls: []
    jsx:
      - category: jsx
        name: Card
        alias: Card
        data:
          color: red
        span:
          start: 0
          end: 38
    diagnostics: []
    "#
    );
}

#[test]
fn extract_surfaces_parse_errors() {
    let result = extract_debug("import { css } from", "fixture.tsx", &panda_config());
    assert!(result.calls.is_empty());
    assert!(result.jsx.is_empty());
    assert!(!result.diagnostics.is_empty());
}

#[test]
fn parse_error_contract_diagnostics_and_partial_extractions() {
    // Contract: when Oxc encounters a parse error in TSX, it still tries to
    // recover and emit a partial AST. Our extractors run on whatever AST
    // Oxc returns, so callers may see extractions AND diagnostics in the
    // same result. Diagnostics are the authoritative signal: code that
    // needs strict correctness should check `diagnostics.is_empty()`
    // before trusting `calls`/`jsx`. Build pipelines that already tolerate
    // ts-morph's recovery behaviour don't need to change.
    //
    // This test asserts the *contract*, not the recovery quality (which is
    // Oxc-version-dependent). Specifically:
    //   - a parse error always surfaces at least one diagnostic
    //   - extractions before the error point are returned when Oxc emits
    //     them; we don't assert how many or where the cutoff falls.
    let result = extract_debug(
        indoc! {r#"
            import { css } from "@panda/css"
            const a = css({ color: "red" })
            const b = ;
        "#},
        "fixture.tsx",
        &panda_config(),
    );
    assert!(
        !result.diagnostics.is_empty(),
        "parse error must surface as a diagnostic"
    );
    assert_yaml_snapshot!(result.diagnostics[0].severity, @"error");
    // No assertion on `result.calls` — Oxc's recovery may or may not
    // expose the pre-error css() call depending on parser behaviour.
    // The point is that the API doesn't crash and surfaces the error.
}
