use indoc::indoc;
use insta::assert_yaml_snapshot;

use super::common::boundaries;

#[test]
fn keeps_calls_inside_expressions() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {css({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 70
        end: 88
    "#);
}

#[test]
fn keeps_calls_inside_object_expressions() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {{a: css({color:"red"}), b: css({color:"blue"})}}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 74
        end: 92
      - source: "css({color:\"blue\"})"
        start: 97
        end: 116
    "#);
}

#[test]
fn leaves_expression_jsx_in_javascript_canvas() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {true && <Box css={{color:"red"}} />}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls: []
    "#);
}

#[test]
fn keeps_calls_with_jsx_arguments() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {[1].map(x => <Box css={{color:"red"}} title="}" />)}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "[1].map(x => <Box css={{color:\"red\"}} title=\"}\" />)"
        start: 70
        end: 121
    "#);
}

#[test]
fn keeps_calls_after_regex_with_closing_braces() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {/}/.test("}") && css({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "/}/.test(\"}\")"
        start: 70
        end: 83
      - source: "css({color:\"red\"})"
        start: 87
        end: 105
    "#);
}

#[test]
fn distinguishes_division_from_regex() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {2 / 2 && css({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 79
        end: 97
    "#);
}

#[test]
fn keeps_calls_inside_nested_templates() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        {`a ${`${css({color:"red"})}`}`}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color:\"red\"})"
        start: 78
        end: 96
    "#);
}

#[test]
fn keeps_multiline_expressions_in_blockquotes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        > {css({
        > color:"red"
        > })}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({\n> color:\"red\"\n> })"
        start: 72
        end: 96
    "#);
}
