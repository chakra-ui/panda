use indoc::indoc;
use insta::assert_yaml_snapshot;

use super::common::boundaries;

#[test]
fn inline_code_between_live_tags() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        Text <Box color="red" /> text.

        `<Box color="wrong" />` <Box color="red" />

        Text <Box color="red" /> text.

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 95
      - name: Box
        start: 146
      - name: Box
        start: 172
      - name: Box
        start: 199
    calls: []
    "#);
}

#[test]
fn expressions_fragments_and_inline_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        {css({color:"red"})}

        <><Box color="red" /><Box color="blue" /></>

        `<Box color="wrong" />` <Box color="red" />

        `<Box color="wrong" />` <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 114
      - name: Box
        start: 133
      - name: Box
        start: 182
      - name: Box
        start: 227
    calls:
      - source: "css({color:\"red\"})"
        start: 91
        end: 109
    "#);
}

#[test]
fn fenced_code_before_markdown_children() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        ```jsx
        <Box color="wrong" />
        {css({color:"wrong"})}
        ```

        <Box color="red" />

        <Box color="red" />

        <Box color="red">

        ## Heading

        `<Box color="wrong" />`

        {css({color:"blue"})}

        </Box>

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 147
      - name: Box
        start: 168
      - name: Box
        start: 189
      - name: Box
        start: 276
    calls:
      - source: "css({color:\"blue\"})"
        start: 246
        end: 265
    "#);
}

#[test]
fn repeated_expressions_between_tags() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        `<Box color="wrong" />` <Box color="red" />

        {css({color:"red"})}

        {css({color:"red"})}

        `<Box color="wrong" />` <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 114
      - name: Box
        start: 203
    calls:
      - source: "css({color:\"red\"})"
        start: 136
        end: 154
      - source: "css({color:\"red\"})"
        start: 158
        end: 176
    "#);
}

#[test]
fn object_expressions_between_inline_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        {{a: css({color:"red"}), b: css({color:"blue"})}}

        `<Box color="wrong" />` <Box color="red" />

        {{a: css({color:"red"}), b: css({color:"blue"})}}

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 165
      - name: Box
        start: 237
    calls:
      - source: "css({color:\"red\"})"
        start: 95
        end: 113
      - source: "css({color:\"blue\"})"
        start: 118
        end: 137
      - source: "css({color:\"red\"})"
        start: 191
        end: 209
      - source: "css({color:\"blue\"})"
        start: 214
        end: 233
    "#);
}

#[test]
fn fragments_between_live_tags() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        <><Box color="red" /><Box color="blue" /></>

        <><Box color="red" /><Box color="blue" /></>

        <Box color="red" />

        `<Box color="wrong" />` <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 92
      - name: Box
        start: 111
      - name: Box
        start: 138
      - name: Box
        start: 157
      - name: Box
        start: 182
      - name: Box
        start: 227
    calls: []
    "#);
}

#[test]
fn markdown_children_before_fenced_code() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        <Box color="red">

        ## Heading

        `<Box color="wrong" />`

        {css({color:"blue"})}

        </Box>

        <Box color="red" />

        ```jsx
        <Box color="wrong" />
        {css({color:"wrong"})}
        ```

        <Box color="red" />

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 90
      - name: Box
        start: 177
      - name: Box
        start: 255
      - name: Box
        start: 276
    calls:
      - source: "css({color:\"blue\"})"
        start: 147
        end: 166
    "#);
}

#[test]
fn siblings_expressions_and_fragments() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />

        <Box color="red" />

        {css({color:"red"})}

        <><Box color="red" /><Box color="blue" /></>

        `<Box color="wrong" />` <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 90
      - name: Box
        start: 135
      - name: Box
        start: 154
      - name: Box
        start: 203
    calls:
      - source: "css({color:\"red\"})"
        start: 112
        end: 130
    "#);
}
