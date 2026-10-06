use indoc::indoc;
use insta::assert_yaml_snapshot;

use super::common::boundaries;

#[test]
fn keeps_calls_in_exports() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        export const styles = {color:"red"};

        <Box {...styles} />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 107
    calls: []
    "#);
}

#[test]
fn keeps_calls_after_semicolonless_exports() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        export const color = "red"

        {css({color})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color})"
        start: 98
        end: 110
    "#);
}

#[test]
fn keeps_exports_with_internal_blank_lines() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        export const color =

        "red"

        {css({color})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "css({color})"
        start: 99
        end: 111
    "#);
}

#[test]
fn keeps_imports_with_internal_blank_lines() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        import {

        css as other

        } from "@panda/css";

        {other({color:"red"})}
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements: []
    calls:
      - source: "other({color:\"red\"})"
        start: 116
        end: 136
    "#);
}

#[test]
fn keeps_calls_inside_default_export_jsx() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        export default () => <Box css={{color:"red"}} />

        <Box color="blue" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 119
    calls: []
    "#);
}

#[test]
fn esm_does_not_interrupt_prose() {
    let source = indoc! {r#"
        A paragraph that continues on the next line:
        import it from [`recipes/`](url) instead.

        <Box color="red" />
    "#};
    assert_yaml_snapshot!(boundaries(source), @r#"
    elements:
      - name: Box
        start: 88
    calls: []
    "#);
}
