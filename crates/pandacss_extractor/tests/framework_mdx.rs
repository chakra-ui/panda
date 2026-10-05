use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{extract, scan_imports};

use crate::common::{extract_shape, panda_jsx_config};

#[test]
fn extracts_the_issue_reproduction() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box as HStack } from '@panda/jsx';

        # Badge

        Used to highlight the status of an item.

        <HStack gap="2" color="red">
          <span className={css({ color: "blue" })}>solid</span>
        </HStack>
    "#};
    let result = extract(source, "badge.mdx", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls:
      - name: css
        data:
          color: blue
    jsx:
      - name: Box
        data:
          gap: "2"
          color: red
    "#);
}

#[test]
fn skips_code_examples_and_frontmatter() {
    let source = indoc! {r#"
        ---
        title: '<Box color="pink" />'
        ---

        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ```jsx
        <Box color="red" />
        {css({ color: 'orange' })}
        ```

        ~~~mdx
        {css({ color: 'yellow' })}
        ~~~

        Inline `<Box color="green" />` and `{css({ color: 'blue' })}`.

        <Box color="purple" />
    "#};
    let result = extract(source, "examples.mdx", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert!(result.calls.is_empty());
    assert_eq!(result.jsx.len(), 1);
    assert_eq!(
        result.jsx[0].data,
        pandacss_literal::Literal::Object(vec![(
            "color".into(),
            pandacss_literal::Literal::String("purple".into())
        )])
    );
}

#[test]
fn handles_inline_siblings_markdown_children_and_expression_jsx() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        Text <Box color="red" /><Box color="green" /> text.

        <Box padding="2">

        ## A **heading**

        `literal {css({color: 'wrong'})}`

        {true && <Box color="blue" />}

        </Box>

        > <Box margin="4" />

        - <Box gap="1" />
    "#};
    let result = extract(source, "nested.mdx", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert!(result.calls.is_empty());
    assert_eq!(result.jsx.len(), 6);
}

#[test]
fn resolves_exports_and_spreads_with_original_byte_spans() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        export const styles = {
          color: 'teal',
          padding: "4"
        };

        # Café 🐼

        <Box
          {...styles}
          css={{ margin: "2" }}
        />

        {css(styles)}
    "#}
    .replace('\n', "\r\n");
    let result = extract(&source, "unicode.MDX", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 1);
    assert_eq!(
        &source[result.calls[0].span.start as usize..result.calls[0].span.end as usize],
        "css(styles)"
    );
    assert_yaml_snapshot!(extract_shape(&result), @r#"
    calls:
      - name: css
        data:
          color: teal
          padding: "4"
    jsx:
      - name: Box
        data:
          color: teal
          padding: "4"
          css:
            margin: "2"
    "#);
}

#[test]
fn expressions_handle_regex_templates_and_comments() {
    let source = indoc! {r"
        import { css } from '@panda/css';

        { /}/.test('}') && css({ color: 'red' }) }
        { `a ${'}'}` && css({ color: 'blue' }) }
        {/* css({ color: 'wrong' }) */}
    "};
    let result = extract(source, "expressions.mdx", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 2);
}

#[test]
fn malformed_mdx_reports_a_diagnostic_without_extracting_examples() {
    let result = extract(
        "import { css } from '@panda/css';\n\n{css({ color: 'red' })",
        "bad.mdx",
        &panda_jsx_config(),
    );
    assert!(!result.diagnostics.is_empty());
    assert!(result.calls.is_empty());
}

#[test]
fn scanning_imports_uses_the_same_adapter() {
    let result = scan_imports(
        "# Heading\n\nimport { css } from '@panda/css';\n\n{css({color:'red'})}",
        "doc.mdx",
    );
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.imports.len(), 1);
}

#[test]
fn uses_the_shared_parse_for_comments_dynamic_props_and_entities() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        export const styles = {padding: '2'}

        <Box color="r&#101;d" {... /* comment */ styles} css={ /* comment */ { margin: '4' } } />
        <Box color={unknown} css={unknownStyles} />
        {css(styles)}
    "#};
    let result = extract(source, "shared.mdx", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 1);
    assert_eq!(
        result.jsx[0].data,
        pandacss_literal::Literal::Object(vec![
            (
                "color".into(),
                pandacss_literal::Literal::String("red".into())
            ),
            (
                "padding".into(),
                pandacss_literal::Literal::String("2".into())
            ),
            (
                "css".into(),
                pandacss_literal::Literal::Object(vec![(
                    "margin".into(),
                    pandacss_literal::Literal::String("4".into())
                )])
            ),
        ])
    );
}

#[test]
fn semicolonless_exports_and_expression_spans_keep_the_original_positions() {
    let source = "import { css } from '@panda/css'\n\nexport const color = 'red'\n\n{css({color})}";
    let result = extract(source, "asi.mdx", &panda_jsx_config());
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.calls.len(), 1);
    assert_eq!(
        result.calls[0].data,
        vec![Some(pandacss_literal::Literal::Object(vec![(
            "color".into(),
            pandacss_literal::Literal::String("red".into())
        )]))]
    );
    assert_eq!(
        &source[result.calls[0].span.start as usize..result.calls[0].span.end as usize],
        "css({color})"
    );
}
