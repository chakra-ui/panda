use indoc::indoc;
use insta::assert_yaml_snapshot;

use crate::common::{panda_config, panda_jsx_config};
use pandacss_extractor::{CssSyntaxKind, ExtractUsage, extract};

fn run(source: &str) -> ExtractUsage {
    extract(
        source,
        "fixture.tsx",
        &panda_config().with_syntax(CssSyntaxKind::TemplateLiteral),
    )
}

fn run_jsx(source: &str) -> ExtractUsage {
    extract(
        source,
        "fixture.tsx",
        &panda_jsx_config().with_syntax(CssSyntaxKind::TemplateLiteral),
    )
}

#[test]
fn css_tagged_template_media_query_matches_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          width: 500px;
          height: 500px;
          background: red;
          @media (min-width: 700px) {
            background: blue;
          }
        `
    "};
    let result = run_jsx(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - width: 500px
      height: 500px
      background: red
      "@media (min-width: 700px)":
        background: blue
    "#);
}

#[test]
fn css_tagged_template_native_nesting_matches_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          color: red;
          p {
            color: blue;
          }
          h1,
          h2,
          h3,
          h4 {
            color: pink;
            font-weight: bold;
            margin-bottom: 1rem;
          }
        `
    "};
    let result = run_jsx(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - color: red
      "& p":
        color: blue
      "& h1, h2, h3, h4":
        color: pink
        font-weight: bold
        margin-bottom: 1rem
    "#);
}

#[test]
fn css_tagged_template_custom_props_and_pseudo_class_match_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          justify-content: center;
          --test: 4px;
          :is(.content, footer) {
            padding: 16px;
          }
        `
    "};
    let result = run(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - justify-content: center
      "--test": 4px
      "& :is(.content, footer)":
        padding: 16px
    "#);
}

#[test]
fn css_tagged_template_nesting_combinators_match_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          p + p {
            color: red;
          }
          p ~ p {
            color: blue;
          }
          .box & {
            background-color: red;
          }
        `
    "};
    let result = run(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - "& p + p":
        color: red
      "& p ~ p":
        color: blue
      ".box &":
        background-color: red
    "#);
}

#[test]
fn css_tagged_template_deep_native_nested_media_matches_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          .box {
            p {
              background-color: red;
              @media (min-width: 700px) {
                background-color: blue;
              }
            }
          }
        `
    "};
    let result = run(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - "& .box":
        "& p":
          background-color: red
          "@media (min-width: 700px)":
            background-color: blue
    "#);
}

#[test]
fn css_tagged_template_deep_child_combinators_match_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          color: hotpink;

          > .is {
            color: rebeccapurple;

            > .awesome {
              color: deeppink;
            }
          }
        `
    "};
    let result = run(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - color: hotpink
      "& > .is":
        color: rebeccapurple
        "& > .awesome":
          color: deeppink
    "#);
}

#[test]
fn css_tagged_template_nested_selector_lists_match_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          .one,
          #two {
            .three {
              color: red;
            }
          }
        `
    "};
    let result = run(source);
    assert_yaml_snapshot!(result.calls[0].data, @r##"
    - "& .one, #two":
        "& .three":
          color: red
    "##);
}

#[test]
fn css_tagged_template_nested_at_layer_matches_js_core_fixture() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css`
          .card {
            inline-size: 40ch;
            aspect-ratio: 3/4;

            @layer support {
              & body {
                min-block-size: 100%;
              }
            }
          }
        `
    "};
    let result = run(source);
    assert_yaml_snapshot!(result.calls[0].data, @r#"
    - "& .card":
        inline-size: 40ch
        aspect-ratio: 3/4
        "@layer support":
          "& body":
            min-block-size: 100%
    "#);
}

#[test]
fn styled_tagged_template_uses_same_css_template_parser() {
    let source = indoc! {r"
        import { styled } from '@panda/jsx';
        const Card = styled.div`
          figure {
            margin: 0;

            > figcaption {
              background: hsl(0 0% 0% / 50%);

              > p {
                font-size: 0.9rem;
              }
            }
          }
        `
    "};
    let result = run_jsx(source);
    assert_yaml_snapshot!(result.jsx[0].data, @r#"
    "& figure":
      margin: "0"
      "& > figcaption":
        background: hsl(0 0% 0% / 50%)
        "& > p":
          font-size: 0.9rem
    "#);
}
