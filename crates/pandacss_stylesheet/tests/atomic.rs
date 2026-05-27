mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetOptions;

use common::{compile_css, compile_css_with_options, config};

#[test]
fn emits_dynamic_atomic_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .bg_blue {
    background-color: blue;
  }
  .c_red {
    color: red;
  }
}
");
}

#[test]
fn emits_conditions_and_breakpoints() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _hover: { md: { color: 'red' } } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @media (width >= 48rem) {
    .hover\:md\:c_red:hover {
      color: red;
    }
  }
}
");
}

#[test]
fn minified_output_preserves_significant_spaces() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "descendantHover": "& :hover"
        },
        "utilities": {
            "margin": { "className": "m" },
            "content": { "className": "content" }
        }
    }));
    let css = compile_css_with_options(
        &config,
        "import { css } from '@panda/css'; css({ margin: '1px 2px', content: '\"a  b\"', _descendantHover: { margin: '3px 4px' } })",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    );
    assert_snapshot!(css, @r#"@layer reset, base, tokens, recipes, utilities;@layer utilities{.m_1px_2px{margin:1px 2px;}.content_"a__b"{content:"a  b";}.descendantHover\:m_3px_4px :hover{margin:3px 4px;}}"#);
}
