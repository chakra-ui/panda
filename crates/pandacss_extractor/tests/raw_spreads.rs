use indoc::indoc;
use insta::assert_yaml_snapshot;

use crate::common::{matcher, panda_config};
use pandacss_extractor::{ExtractUsage, ExtractorConfig, Matchers, extract};

fn run(source: &str) -> ExtractUsage {
    extract(source, "fixture.tsx", &panda_config())
}

fn run_styled_system(source: &str) -> ExtractUsage {
    let config = ExtractorConfig::new(Matchers {
        css: matcher("styled-system/css", ["css", "cva", "sva"]),
        pattern: matcher("styled-system/patterns", ["stack"]),
        ..Default::default()
    });
    extract(source, "fixture.tsx", &config)
}

#[test]
fn css_raw_spread_with_computed_property_name_matches_js_fixture() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const baseStyles = css.raw({
          color: 'red',
          fontSize: '14px'
        });
        const dynamicKey = '_hover';
        const component = css({
          ...baseStyles,
          [dynamicKey]: {
            ...baseStyles,
            opacity: 0.8
          }
        });
    "};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @"
    - color: red
      fontSize: 14px
      _hover:
        color: red
        fontSize: 14px
        opacity: 0.8
    ");
}

#[test]
fn css_raw_identifier_values_fold_inside_nested_selectors() {
    let src = indoc! {r#"
        import { css } from 'styled-system/css'

        const paragraphSpacingStyle = css.raw({
          "&:not(:first-child)": { marginBlockStart: "1em" },
        });

        export const proseCss = css.raw({
          maxWidth: "800px",
          "& p": {
            "&:not(:first-child)": { marginBlockStart: "1em" },
          },
          "& h1": paragraphSpacingStyle,
          "& h2": paragraphSpacingStyle,
          "& h3": paragraphSpacingStyle,
          "& h4": paragraphSpacingStyle,
          "& h5": paragraphSpacingStyle,
          "& h6": paragraphSpacingStyle,
        });
    "#};
    let calls = run_styled_system(src).calls;

    assert_yaml_snapshot!(calls.last().expect("prose css.raw call").data, @r#"
    - maxWidth: 800px
      "& p":
        "&:not(:first-child)":
          marginBlockStart: 1em
      "& h1":
        "&:not(:first-child)":
          marginBlockStart: 1em
      "& h2":
        "&:not(:first-child)":
          marginBlockStart: 1em
      "& h3":
        "&:not(:first-child)":
          marginBlockStart: 1em
      "& h4":
        "&:not(:first-child)":
          marginBlockStart: 1em
      "& h5":
        "&:not(:first-child)":
          marginBlockStart: 1em
      "& h6":
        "&:not(:first-child)":
          marginBlockStart: 1em
    "#);
}

#[test]
fn pattern_raw_result_spread_inside_nested_selector_matches_issue_3278() {
    let src = indoc! {r#"
        import { css } from 'styled-system/css'
        import { stack } from 'styled-system/patterns';

        const list = stack.raw({ gap: "0.8rem" });

        const mainCss = css({
          bg: "blue.100",
          "& ul": {
            ...list,
          },
          "& li": {
            bg: "blue.200",
          },
        });
    "#};
    let calls = run_styled_system(src).calls;

    assert_yaml_snapshot!(calls, @r#"
    - category: pattern
      name: stack
      alias: stack
      data:
        - gap: 0.8rem
      span:
        start: 102
        end: 130
    - category: css
      name: css
      alias: css
      data:
        - bg: blue.100
          "& ul":
            gap: 0.8rem
          "& li":
            bg: blue.200
      span:
        start: 149
        end: 242
    "#);
}

#[test]
fn css_raw_spread_deeply_nested_conditions_match_js_fixture() {
    let src = indoc! {r#"
        import { css } from '@panda/css';
        const baseStyles = css.raw({ padding: '10px' });
        const component = css({
          ...baseStyles,
          _hover: {
            ...baseStyles,
            "&:focus": {
              ...baseStyles,
              outline: '2px solid blue'
            }
          }
        });
    "#};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @r#"
    - padding: 10px
      _hover:
        padding: 10px
        "&:focus":
          padding: 10px
          outline: 2px solid blue
    "#);
}

#[test]
fn css_raw_conditional_spreads_with_static_test_match_js_fixture() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const baseStyles = css.raw({ color: 'blue', padding: '8px' });
        const isActive = true;
        const component = css({
          ...(isActive ? baseStyles : {}),
          _hover: {
            ...(isActive && baseStyles),
            opacity: 0.9
          }
        });
    "};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @"
    - color: blue
      padding: 8px
      _hover:
        color: blue
        padding: 8px
        opacity: 0.9
    ");
}

#[test]
fn css_raw_spread_inside_array_value_matches_js_fixture() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const baseStyles = css.raw({ color: 'green', fontSize: '16px' });
        const component = css({
          ...baseStyles,
          _hover: [
            {
              ...baseStyles,
              opacity: 0.8
            }
          ]
        });
    "};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @"
    - color: green
      fontSize: 16px
      _hover:
        - color: green
          fontSize: 16px
          opacity: 0.8
    ");
}

#[test]
fn css_raw_spread_with_renamed_import_matches_js_fixture() {
    let src = indoc! {r"
        import { css as pandaCss } from '@panda/css';
        const baseStyles = pandaCss.raw({
          color: 'purple',
          fontWeight: 'bold'
        });
        const component = pandaCss({
          ...baseStyles,
          _active: {
            ...baseStyles,
            transform: 'scale(0.98)'
          }
        });
    "};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @"
    - color: purple
      fontWeight: bold
      _active:
        color: purple
        fontWeight: bold
        transform: scale(0.98)
    ");
}

#[test]
fn css_raw_nullish_spreads_are_ignored_match_js_fixture() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const baseStyles = undefined;
        const nullStyles = null;
        const validStyles = css.raw({ color: 'orange', fontSize: '18px' });
        const component = css({
          ...baseStyles,
          ...nullStyles,
          ...validStyles,
          _hover: {
            ...validStyles,
            opacity: 0.7
          }
        });
    "};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @"
    - color: orange
      fontSize: 18px
      _hover:
        color: orange
        fontSize: 18px
        opacity: 0.7
    ");
}

#[test]
fn css_raw_function_return_spread_degrades_like_js_fixture() {
    let src = indoc! {r"
        import { css } from '@panda/css';
        const baseStyles = css.raw({ display: 'flex', gap: '10px' });
        const getStyles = () => ({
          ...baseStyles,
          padding: '20px'
        });
        const component = css({
          ...getStyles(),
          _hover: {
            ...baseStyles,
            background: 'gray.100'
          }
        });
    "};
    let calls = run(src).calls;
    assert_yaml_snapshot!(calls.last().expect("final css call").data, @"
    - _hover:
        display: flex
        gap: 10px
        background: gray.100
    ");
}

#[test]
fn css_raw_spread_in_cva_variant_matches_js_fixture() {
    let src = indoc! {r"
        import { css, cva } from '@panda/css';
        const hoverStyles = css.raw({ bg: 'blue.500', color: 'white' });
        const button = cva({
          variants: {
            tone: {
              primary: {
                ...hoverStyles,
                borderColor: 'blue.700'
              }
            }
          }
        });
    "};
    let calls = run(src).calls;
    let cva = calls
        .iter()
        .find(|call| call.name == "cva")
        .expect("cva call");
    assert_yaml_snapshot!(cva.data, @"
    - variants:
        tone:
          primary:
            bg: blue.500
            color: white
            borderColor: blue.700
    ");
}

#[test]
fn css_raw_spread_in_sva_slot_matches_js_fixture() {
    let src = indoc! {r"
        import { css, sva } from '@panda/css';
        const rootStyles = css.raw({ display: 'flex', gap: '2' });
        const recipe = sva({
          slots: ['root', 'label'],
          base: {
            root: {
              ...rootStyles,
              alignItems: 'center'
            },
            label: { color: 'gray.700' }
          }
        });
    "};
    let calls = run(src).calls;
    let sva = calls
        .iter()
        .find(|call| call.name == "sva")
        .expect("sva call");
    assert_yaml_snapshot!(sva.data, @r#"
    - slots:
        - root
        - label
      base:
        root:
          display: flex
          gap: "2"
          alignItems: center
        label:
          color: gray.700
    "#);
}
