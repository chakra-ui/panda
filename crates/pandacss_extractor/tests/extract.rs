use crate::common::{extract_shape, panda_config, panda_config_with_jsx, panda_jsx_config};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{JsxExtractionConfig, extract, extract_debug, extract_transform};
use pandacss_literal::Literal;

#[test]
fn debug_extract_reports_imports_matches_calls_and_jsx_together() {
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
fn namespace_import_extracts_css_and_cva_calls() {
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
fn file_without_panda_imports_extracts_nothing() {
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
fn parse_error_in_file_without_panda_imports_still_surfaces() {
    let result = extract(
        "import { useState } from 'react'\nconst x = ;",
        "fixture.tsx",
        &panda_config(),
    );
    assert!(!result.diagnostics.is_empty());
}

#[test]
fn debug_extract_keeps_non_panda_imports_when_nothing_matches() {
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
fn configured_jsx_component_is_skipped_without_jsx_framework() {
    let mut jsx = JsxExtractionConfig::default();
    jsx.component_names.insert("Card".into());

    let result = extract(
        "<Card color='red' onClick={handler} />",
        "fixture.tsx",
        &panda_config_with_jsx(jsx),
    );
    assert_yaml_snapshot!(extract_shape(&result), @"
    calls: []
    jsx: []
    ");
}

#[test]
fn configured_jsx_component_extracts_with_jsx_framework() {
    let mut jsx = JsxExtractionConfig::default();
    jsx.component_names.insert("Card".into());

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
fn parse_error_after_a_valid_call_surfaces_a_warning() {
    // Recovered calls are Oxc-version dependent, so only the diagnostic is asserted.
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
    "#};
    let result = extract(source, "factory.tsx", &panda_config());

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
fn transform_extract_marks_symbols_unresolved_when_jsx_is_skipped() {
    // JSX-only matches without a jsx framework skip visitor walks. Transform still
    // gets import records, but must not treat empty binding facts as authoritative.
    let source = indoc! {r#"
        import { Box } from "@panda/jsx"
        export const el = <Box color="red" />
    "#};
    let result = extract_transform(source, "fixture.tsx", &panda_config());

    assert!(!result.module.symbols_resolved);
    assert!(result.module.import_bindings.is_empty());
    assert_eq!(result.module.imports.len(), 1);
    assert!(result.calls.is_empty());
    assert!(result.jsx.is_empty());
}

#[test]
fn transform_extract_resolves_symbols_for_css_calls() {
    let source = indoc! {r#"
        import { css } from "@panda/css"
        export const cls = css({ color: "red" })
    "#};
    let result = extract_transform(source, "fixture.tsx", &panda_config());

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

#[test]
fn normal_and_transform_extraction_project_the_same_data() {
    let source = indoc! {r#"
        import { css } from "@panda/css"
        import { Box } from "@panda/jsx"

        const className = css({
          color: dark ? "white" : "black",
          values: ["a", unknown, 2],
          ...(active && { opacity: 1 }),
        })
        const element = (
          <Box
            {...(dark ? { color: "white" } : { color: "black" })}
            padding={size || "4"}
          />
        )
    "#};
    let config = panda_jsx_config();
    let normal = extract(source, "fixture.tsx", &config);
    let transform = extract_transform(source, "fixture.tsx", &config);

    assert_eq!(normal.diagnostics, transform.diagnostics);
    assert_eq!(normal.calls.len(), transform.calls.len());
    assert_eq!(normal.jsx.len(), transform.jsx.len());
    assert!(
        normal
            .calls
            .iter()
            .zip(&transform.calls)
            .all(|(left, right)| left.data == right.data)
    );
    assert!(
        normal
            .jsx
            .iter()
            .zip(&transform.jsx)
            .all(|(left, right)| left.data == right.data)
    );
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
fn styled_default_props_arrow_expression_folds() {
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
}

#[test]
fn styled_default_props_arrow_with_return_folds() {
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
}

#[test]
fn styled_default_props_function_expression_folds() {
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
}

#[test]
fn styled_default_props_named_function_expression_folds() {
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
}

#[test]
fn styled_default_props_method_folds() {
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
}

#[test]
fn styled_default_props_getter_folds() {
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
fn styled_default_props_referencing_a_local_arrow_folds() {
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
}

#[test]
fn styled_default_props_referencing_a_function_declaration_folds() {
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

fn styled_recipe_name(source: &str) -> Option<String> {
    extract(source, "factory.tsx", &panda_jsx_config())
        .calls
        .iter()
        .find(|call| call.name == "styled")
        .and_then(|call| call.jsx_recipe_ident.clone())
}

#[test]
fn styled_with_imported_recipe_records_the_recipe_name() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button } from "@panda/recipes"
            styled('div', button, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_with_renamed_recipe_import_records_the_imported_name() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button as btn } from "@panda/recipes"
            styled('div', btn, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_with_namespace_recipe_member_records_the_recipe_name() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            styled('div', recipes.button, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_with_local_alias_of_a_recipe_records_the_recipe_name() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button } from "@panda/recipes"
            const recipe = button
            styled('div', recipe, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_with_local_alias_of_a_namespace_member_records_the_recipe_name() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            const recipe = recipes.button
            styled('div', recipe, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_with_member_of_an_aliased_namespace_records_the_recipe_name() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            const r = recipes
            styled('div', r.button, { defaultProps: { size: 'sm' } })
        "#}),
        Some("button".into())
    );
}

#[test]
fn styled_with_reassigned_recipe_binding_records_no_recipe() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import { button } from "@panda/recipes"
            let recipe = button
            recipe = button
            styled('div', recipe, { defaultProps: { size: 'sm' } })
        "#}),
        None
    );
}

#[test]
fn styled_with_recipe_raw_member_records_no_recipe() {
    assert_eq!(
        styled_recipe_name(indoc! {r#"
            import { styled } from "@panda/jsx"
            import * as recipes from "@panda/recipes"
            styled('div', recipes.button.raw, { defaultProps: { size: 'sm' } })
        "#}),
        None
    );
}
