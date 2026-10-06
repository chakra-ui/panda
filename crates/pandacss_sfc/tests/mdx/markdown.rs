use indoc::indoc;
use insta::assert_yaml_snapshot;

use super::common::boundaries;

#[test]
fn yaml_frontmatter_is_excluded() {
    let source = indoc! {r#"
        ---
        value: '<Box color="wrong" />'
        ---
        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r"
    elements:
      - name: Box
        start: 39
    calls: []
    ");
}

#[test]
fn toml_frontmatter_is_excluded() {
    let source = indoc! {r#"
        +++
        value: '<Box color="wrong" />'
        +++
        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r"
    elements:
      - name: Box
        start: 39
    calls: []
    ");
}

#[test]
fn excludes_inline_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        `<Box color="wrong" />` <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 93
    calls: []
    "#);
}

#[test]
fn excludes_code_with_double_backticks() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ``a `<Box color="wrong" />` `` <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 100
    calls: []
    "#);
}

#[test]
fn keeps_jsx_after_unmatched_backticks() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        `unmatched <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 80
    calls: []
    "#);
}

#[test]
fn excludes_multiline_inline_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        `first
        <Box color="wrong" /> last`

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 105
    calls: []
    "#);
}

#[test]
fn does_not_extend_inline_code_across_block_boundaries() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        Text `unmatched
        <Box color="red" />
        `
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 85
    calls: []
    "#);
}

#[test]
fn excludes_fenced_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ```jsx
        <Box color="wrong" />
        {css({color:"wrong"})}
        ```

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 126
    calls: []
    "#);
}

#[test]
fn excludes_fences_containing_shorter_fences() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ````jsx
        ```
        <Box color="wrong" />
        ````

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 109
    calls: []
    "#);
}

#[test]
fn excludes_unclosed_fenced_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ```jsx
        <Box color="wrong" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls: []
    "#);
}

#[test]
fn excludes_indented_fences() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

            ```jsx
            <Box color="wrong" />
            ```

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 115
    calls: []
    "#);
}

#[test]
fn ends_fence_when_blockquote_ends() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        > ```jsx
        > <Box color="wrong" />

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 103
    calls: []
    "#);
}

#[test]
fn ends_fence_when_list_ends() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        - ```jsx
          <Box color="wrong" />

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 103
    calls: []
    "#);
}

#[test]
fn excludes_fenced_code_in_lists() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        - ```jsx
          <Box color="wrong" />
          ```

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 109
    calls: []
    "#);
}

#[test]
fn does_not_extract_escaped_jsx() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        \<Box color="wrong" /> and \{css(\{color:"wrong"\})\}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls: []
    "#);
}

#[test]
fn backslash_does_not_escape_inline_code_closer() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        `<Box color="wrong" />\`

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 95
    calls: []
    "#);
}

#[test]
fn keeps_jsx_in_link_text() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        [<Box color="red" />](url)
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 70
    calls: []
    "#);
}

#[test]
fn excludes_jsx_in_link_destinations() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        [x](<Box color="wrong" />)

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 97
    calls: []
    "#);
}

#[test]
fn excludes_expressions_in_link_destinations() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        [x](https://example.com/{css({color:"wrong"})})

        {css({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 119
        end: 137
    "#);
}

#[test]
fn excludes_jsx_in_link_titles() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        [x](url '<Box color="wrong" />')

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 103
    calls: []
    "#);
}

#[test]
fn excludes_jsx_in_inline_image_descriptions() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ![<Box color="wrong" />](url)

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 100
    calls: []
    "#);
}

#[test]
fn excludes_calls_in_inline_image_descriptions() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        ![{css({color:"wrong"})}](url)

        {css({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 102
        end: 120
    "#);
}

#[test]
fn excludes_calls_in_reference_definitions() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        [ref]: /{css({color:"wrong"})}

        {css({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 102
        end: 120
    "#);
}

#[test]
fn handles_imports_without_document_content() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';
    "};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls: []
    "#);
}

#[test]
fn keeps_jsx_after_invalid_reference_definitions() {
    let source = indoc! {r#"
    [text]: /asset.png <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 19
    calls: []
    "#);
}

#[test]
fn excludes_calls_in_reference_destinations() {
    let source = indoc! {r#"
        [ref]: {css({color:"wrong"})}

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 31
    calls: []
    "#);
}

#[test]
fn keeps_jsx_after_reference_like_prose() {
    let source = indoc! {r#"
    Text [label]: value <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 20
    calls: []
    "#);
}

#[test]
fn keeps_jsx_after_empty_reference_destinations() {
    let source = indoc! {r#"
        [label]:

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 10
    calls: []
    "#);
}

#[test]
fn keeps_jsx_after_reference_like_paragraph_content() {
    let source = indoc! {r#"
        Paragraph
        [label]: /asset.png <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 30
    calls: []
    "#);
}
