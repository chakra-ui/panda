use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{DiagnosticSeverity, ImportScanResult, scan_imports};

fn scan(source: &str) -> ImportScanResult {
    scan_imports(source, "fixture.tsx")
}

#[test]
fn default_import() {
    assert_yaml_snapshot!(scan("import React from 'react';"), @"
    imports:
      - module: react
        kind: value
        typeOnly: false
        specifiers:
          - kind: default
            imported: default
            local: React
            typeOnly: false
            span:
              start: 7
              end: 12
        span:
          start: 0
          end: 26
    diagnostics: []
    ");
}

#[test]
fn named_imports_with_alias() {
    assert_yaml_snapshot!(scan("import { useState, useEffect as fx } from 'react';"), @"
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
          - kind: named
            imported: useEffect
            local: fx
            typeOnly: false
            span:
              start: 19
              end: 34
        span:
          start: 0
          end: 50
    diagnostics: []
    ");
}

#[test]
fn namespace_import() {
    assert_yaml_snapshot!(scan("import * as React from 'react';"), @r#"
    imports:
      - module: react
        kind: value
        typeOnly: false
        specifiers:
          - kind: namespace
            imported: "*"
            local: React
            typeOnly: false
            span:
              start: 7
              end: 17
        span:
          start: 0
          end: 31
    diagnostics: []
    "#);
}

#[test]
fn side_effect_import() {
    assert_yaml_snapshot!(scan("import './polyfill';"), @r#"
    imports:
      - module: "./polyfill"
        kind: sideEffect
        typeOnly: false
        specifiers: []
        span:
          start: 0
          end: 20
    diagnostics: []
    "#);
}

#[test]
fn type_only_declaration() {
    assert_yaml_snapshot!(scan("import type { Foo } from './foo';"), @r#"
    imports:
      - module: "./foo"
        kind: value
        typeOnly: true
        specifiers:
          - kind: named
            imported: Foo
            local: Foo
            typeOnly: false
            span:
              start: 14
              end: 17
        span:
          start: 0
          end: 33
    diagnostics: []
    "#);
}

#[test]
fn type_only_specifier() {
    assert_yaml_snapshot!(scan("import { type Foo, bar } from './foo';"), @r#"
    imports:
      - module: "./foo"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: Foo
            local: Foo
            typeOnly: true
            span:
              start: 9
              end: 17
          - kind: named
            imported: bar
            local: bar
            typeOnly: false
            span:
              start: 19
              end: 22
        span:
          start: 0
          end: 38
    diagnostics: []
    "#);
}

#[test]
fn default_plus_named() {
    assert_yaml_snapshot!(scan("import React, { useState } from 'react';"), @"
    imports:
      - module: react
        kind: value
        typeOnly: false
        specifiers:
          - kind: default
            imported: default
            local: React
            typeOnly: false
            span:
              start: 7
              end: 12
          - kind: named
            imported: useState
            local: useState
            typeOnly: false
            span:
              start: 16
              end: 24
        span:
          start: 0
          end: 40
    diagnostics: []
    ");
}

#[test]
fn default_plus_namespace() {
    assert_yaml_snapshot!(scan("import React, * as All from 'react';"), @r#"
    imports:
      - module: react
        kind: value
        typeOnly: false
        specifiers:
          - kind: default
            imported: default
            local: React
            typeOnly: false
            span:
              start: 7
              end: 12
          - kind: namespace
            imported: "*"
            local: All
            typeOnly: false
            span:
              start: 14
              end: 22
        span:
          start: 0
          end: 36
    diagnostics: []
    "#);
}

#[test]
fn string_literal_specifier() {
    assert_yaml_snapshot!(scan(r#"import { "foo-bar" as fooBar } from 'pkg';"#), @"
    imports:
      - module: pkg
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: foo-bar
            local: fooBar
            typeOnly: false
            span:
              start: 9
              end: 28
        span:
          start: 0
          end: 42
    diagnostics: []
    ");
}

#[test]
fn multiple_declarations() {
    assert_yaml_snapshot!(
        scan(indoc! {"
            import a from 'a';
            import { b } from 'b';
            import 'c';
        "}),
        @"
    imports:
      - module: a
        kind: value
        typeOnly: false
        specifiers:
          - kind: default
            imported: default
            local: a
            typeOnly: false
            span:
              start: 7
              end: 8
        span:
          start: 0
          end: 18
      - module: b
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: b
            local: b
            typeOnly: false
            span:
              start: 28
              end: 29
        span:
          start: 19
          end: 41
      - module: c
        kind: sideEffect
        typeOnly: false
        specifiers: []
        span:
          start: 42
          end: 53
    diagnostics: []
    ",
    );
}

#[test]
fn ignores_non_import_statements() {
    assert_yaml_snapshot!(
        scan(indoc! {"
            import { x } from 'x';
            const y = 1;
            export { y };
            import z from 'z';
        "}),
        @"
    imports:
      - module: x
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: x
            local: x
            typeOnly: false
            span:
              start: 9
              end: 10
        span:
          start: 0
          end: 22
      - module: z
        kind: value
        typeOnly: false
        specifiers:
          - kind: default
            imported: default
            local: z
            typeOnly: false
            span:
              start: 57
              end: 58
        span:
          start: 50
          end: 68
    diagnostics: []
    ",
    );
}

#[test]
fn tsx_source_parses_jsx() {
    assert_yaml_snapshot!(
        scan(indoc! {"
            import { css } from '@pandacss/core';
            const el = <div className={css({ color: 'red' })} />;
        "}),
        @r#"
    imports:
      - module: "@pandacss/core"
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
          end: 37
    diagnostics: []
    "#,
    );
}

// JS parity: scan_imports returns the unfiltered raw list. The import-map
// filtering in `getImportDeclarations()` will move to Rust later; these
// snapshots are the anchors for that comparison.

#[test]
fn js_parity_named_alias_from_panda_css() {
    // packages/parser/__tests__/import.test.ts
    // JS field mapping: imported↔name, local↔alias, module↔mod.
    assert_yaml_snapshot!(
        scan(indoc! {r#"
            import { css as nCss } from "@panda/css"
            css({ bg: "red" })
        "#}),
        @r#"
    imports:
      - module: "@panda/css"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: css
            local: nCss
            typeOnly: false
            span:
              start: 9
              end: 20
        span:
          start: 0
          end: 40
    diagnostics: []
    "#,
    );
}

#[test]
fn js_parity_styled_system_relative() {
    // packages/parser/__tests__/import-map.test.ts (first fixture)
    assert_yaml_snapshot!(
        scan(indoc! {r#"
            import { css } from "../styled-system/css";
            import { container } from "../styled-system/patterns";
        "#}),
        @r#"
    imports:
      - module: "../styled-system/css"
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
          end: 43
      - module: "../styled-system/patterns"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: container
            local: container
            typeOnly: false
            span:
              start: 53
              end: 62
        span:
          start: 44
          end: 98
    diagnostics: []
    "#,
    );
}

#[test]
fn js_parity_multiple_packages() {
    // packages/parser/__tests__/import-map.test.ts (second fixture)
    assert_yaml_snapshot!(
        scan(indoc! {r#"
            import { cardStyle } from "@acme/org/recipes"
            import { buttonStyle } from "@bar/org/recipes"
            import { css } from "@foo/org/css"
            import { tooltipStyle } from "styled-system/recipes"
            import { flex } from "@bar/org/patterns"
        "#}),
        @r#"
    imports:
      - module: "@acme/org/recipes"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: cardStyle
            local: cardStyle
            typeOnly: false
            span:
              start: 9
              end: 18
        span:
          start: 0
          end: 45
      - module: "@bar/org/recipes"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: buttonStyle
            local: buttonStyle
            typeOnly: false
            span:
              start: 55
              end: 66
        span:
          start: 46
          end: 92
      - module: "@foo/org/css"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: css
            local: css
            typeOnly: false
            span:
              start: 102
              end: 105
        span:
          start: 93
          end: 127
      - module: styled-system/recipes
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: tooltipStyle
            local: tooltipStyle
            typeOnly: false
            span:
              start: 137
              end: 149
        span:
          start: 128
          end: 180
      - module: "@bar/org/patterns"
        kind: value
        typeOnly: false
        specifiers:
          - kind: named
            imported: flex
            local: flex
            typeOnly: false
            span:
              start: 190
              end: 194
        span:
          start: 181
          end: 221
    diagnostics: []
    "#,
    );
}

#[test]
fn parse_error_is_reported() {
    // Oxc error text is not part of our contract — assert shape only.
    let result = scan("import from 'broken';\n");
    assert!(result.imports.is_empty());
    assert_eq!(result.diagnostics.len(), 1);
    assert_eq!(result.diagnostics[0].severity, DiagnosticSeverity::Error);
}

#[test]
fn span_covers_declaration() {
    let source = "import x from 'src';";
    let result = scan(source);
    let record = &result.imports[0];
    let slice = &source[record.span.start as usize..record.span.end as usize];
    assert_eq!(slice, "import x from 'src';");
}
