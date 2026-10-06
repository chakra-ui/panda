use indoc::indoc;
use insta::assert_yaml_snapshot;

use super::common::boundaries;

#[test]
fn keeps_flow_element() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
    calls: []
    "#);
}

#[test]
fn keeps_element_in_prose() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        Text <Box color="red" /> text.
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 74
    calls: []
    "#);
}

#[test]
fn keeps_adjacent_elements() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red" /><Box color="blue" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
      - name: Box
        start: 88
    calls: []
    "#);
}

#[test]
fn keeps_elements_inside_fragments() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <><Box color="red" /><Box color="blue" /></>
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 71
      - name: Box
        start: 90
    calls: []
    "#);
}

#[test]
fn keeps_member_component_names() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box.Root color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box.Root
        start: 69
    calls: []
    "#);
}

#[test]
fn keeps_expression_and_spread_attributes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box css={{color:"red"}} {...{padding:"2"}} />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
    calls: []
    "#);
}

#[test]
fn keeps_boolean_attributes() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box hidden />
    "};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
    calls: []
    "#);
}

#[test]
fn keeps_multiline_attributes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box
         color="red"
         css={{margin: "2"}}
        />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
    calls: []
    "#);
}

#[test]
fn excludes_jsx_and_calls_inside_comments() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {/* <Box color="wrong" /> css({color:"wrong"}) */}

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 121
    calls: []
    "#);
}

#[test]
fn keeps_multiline_jsx_in_blockquotes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        > <Box
        > color="red"
        > css={{padding:"2"}}
        > />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 71
    calls: []
    "#);
}

#[test]
fn keeps_jsx_in_nested_blockquotes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        > > <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 73
    calls: []
    "#);
}

#[test]
fn keeps_jsx_in_ordered_lists() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        1. <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 72
    calls: []
    "#);
}

#[test]
fn keeps_markdown_children_inside_jsx() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        <Box color="red">

        ## Heading

        `<Box color="wrong" />`

        {css({color:"blue"})}

        </Box>
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 69
    calls:
      - source: "css({color:\"blue\"})"
        start: 126
        end: 145
    "#);
}

#[test]
fn keeps_entities_in_quoted_attributes() {
    let source = indoc! {r#"
    <Box color="&amp;red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 0
    calls: []
    "#);
}

#[test]
fn keeps_adjacent_elements_in_prose() {
    let source = indoc! {r#"
    Text <Box color="red" /><Box color="green" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 5
      - name: Box
        start: 24
    calls: []
    "#);
}
