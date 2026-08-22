use crate::common::{extract_shape, panda_config, panda_config_with_jsx, panda_jsx_config};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{
    CssSyntaxKind, JsxExtractionConfig, Literal, extract, extract_debug, extract_for_transform,
};

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
            &panda_jsx_config(),
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
        kind: component
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
fn configured_jsx_components_require_jsx_framework() {
    let mut jsx = JsxExtractionConfig::default();
    jsx.component_names.insert("Card".into());

    let result = extract(
        "<Card color='red' onClick={handler} />",
        "fixture.tsx",
        &panda_config_with_jsx(jsx.clone()),
    );
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");

    assert_yaml_snapshot!(
        extract(
            "<Card color='red' onClick={handler} />",
            "fixture.tsx",
            &panda_config_with_jsx(jsx).with_jsx_framework(true),
        ),
        @"
    calls: []
    jsx:
      - category: jsx
        kind: component
        name: Card
        alias: Card
        data:
          color: red
        span:
          start: 0
          end: 38
    diagnostics: []
    "
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
    assert_yaml_snapshot!(result.diagnostics[0].severity, @"warning");
    // No assertion on `result.calls` — Oxc's recovery may or may not
    // expose the pre-error css() call depending on parser behaviour.
    // The point is that the API doesn't crash and surfaces the error.
}

#[test]
fn jsx_extraction_requires_jsx_framework() {
    let source = indoc! {r#"
        import { Box } from "@panda/jsx"
        import { Image } from "some-image-lib"
        export const App = () => (
          <>
            <Box color="red" />
            <Image width="900" height="800" />
          </>
        )
    "#};
    let result = extract(source, "app.tsx", &panda_config());
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
}

#[test]
fn jsx_factory_extraction_requires_jsx_framework() {
    let source = indoc! {r#"
        import { styled } from "@panda/jsx"

        const Card = styled('div', { base: { color: 'red' } })
        const Panel = styled.div`
          padding: 4px;
        `
    "#};
    let result = extract(
        source,
        "factory.tsx",
        &panda_config().with_syntax(CssSyntaxKind::TemplateLiteral),
    );

    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
    assert!(result.diagnostics.is_empty());
}

#[test]
fn uppercase_component_extracts_with_jsx_framework() {
    let source = indoc! {r#"
        import { css } from "@panda/css"
        import { Image } from "some-image-lib"
        const _ = css({ color: "red" })
        export const App = () => <Image width="900" height="800" />
    "#};
    let result = extract(source, "app.tsx", &panda_jsx_config());
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls:
      - name: css
        data:
          color: red
    jsx:
      - name: Image
        data:
          width: "900"
          height: "800"
    "#);
}

#[test]
fn extract_for_transform_marks_symbols_unresolved_when_extraction_is_skipped() {
    // JSX-only matches without a jsx framework skip visitor walks. Transform still
    // gets import records, but must not treat empty binding facts as authoritative.
    let source = indoc! {r#"
        import { Box } from "@panda/jsx"
        export const el = <Box color="red" />
    "#};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());

    assert!(!result.module.symbols_resolved);
    assert!(result.module.import_bindings.is_empty());
    assert_eq!(result.module.imports.len(), 1);
    assert!(result.calls.is_empty());
    assert!(result.jsx.is_empty());
}

#[test]
fn extract_for_transform_resolves_symbols_for_normal_css_files() {
    let source = indoc! {r#"
        import { css } from "@panda/css"
        export const cls = css({ color: "red" })
    "#};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());

    assert!(result.module.symbols_resolved);
    assert!(
        result
            .module
            .import_bindings
            .iter()
            .any(|binding| binding.local == "css" && !binding.references.is_empty())
    );
    assert_eq!(result.calls.len(), 1);
}

fn factory_options_json(source: &str) -> serde_json::Value {
    let result = extract(source, "factory.tsx", &panda_jsx_config());
    result
        .calls
        .iter()
        .find(|call| call.name == "styled")
        .and_then(|call| call.data.get(2).and_then(Option::as_ref))
        .map_or(serde_json::Value::Null, Literal::to_json)
}

#[test]
fn styled_default_props_folds_solid_callable_forms() {
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            styled('div', { color: 'red' }, { defaultProps: () => ({ marginTop: '8px' }) })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            styled('div', { color: 'red' }, {
              defaultProps: () => {
                return { marginTop: '8px' }
              },
            })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            styled('div', { color: 'red' }, {
              defaultProps: function () {
                return { marginTop: '8px' }
              },
            })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            styled('div', { color: 'red' }, {
              defaultProps() {
                return { marginTop: '8px' }
              },
            })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            styled('div', { color: 'red' }, {
              defaultProps: function defaults() {
                return { marginTop: '8px' }
              },
            })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            styled('div', { color: 'red' }, {
              get defaultProps() {
                return { marginTop: '8px' }
              },
            })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
}

#[test]
fn styled_default_props_folds_identifier_bound_functions() {
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            const defaults = () => ({ marginTop: '8px' })
            styled('div', { color: 'red' }, { defaultProps: defaults })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
    assert_yaml_snapshot!(
        factory_options_json(indoc! {r#"
            import { styled } from "@panda/jsx"
            function defaults() {
              return { marginTop: '8px' }
            }
            styled('div', { color: 'red' }, { defaultProps: defaults })
        "#}),
        @r#"
    defaultProps:
      marginTop: 8px
    "#
    );
}

fn styled_recipe_ident(source: &str) -> Option<String> {
    extract(source, "factory.tsx", &panda_jsx_config())
        .calls
        .iter()
        .find(|call| call.name == "styled")
        .and_then(|call| call.jsx_recipe_ident.clone())
}

#[test]
fn styled_recipe_ident_resolves_import_member_and_local_alias() {
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button } from "@panda/recipes"
            styled('div', button, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button as btn } from "@panda/recipes"
            styled('div', btn, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            styled('div', recipes.button, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button } from "@panda/recipes"
            const recipe = button
            styled('div', recipe, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            const recipe = recipes.button
            styled('div', recipe, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            const r = recipes
            styled('div', r.button, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_recipe_ident_skips_mutated_and_deep_members() {
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button } from "@panda/recipes"
            let recipe = button
            recipe = button
            styled('div', recipe, { defaultProps: { size: 'sm' } })
        "#}),
        None
    );
    assert_eq!(
        styled_recipe_ident(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            styled('div', recipes.button.raw, { defaultProps: { size: 'sm' } })
        "#}),
        None
    );
}
