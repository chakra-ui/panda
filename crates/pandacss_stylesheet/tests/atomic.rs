mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use common::{compile_css_with_options, compile_layer_css, config};

#[test]
fn emits_dynamic_atomic_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', bg: 'blue' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
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
fn escapes_nested_selector_keys_into_valid_class_names() {
    // `&:hover` is a raw selector, not a named condition: the runtime wraps it as
    // `[&:hover]:…` (so does the emitter), and `[`/`]`/`&`/`:` are escaped in the
    // class-name token while the real `:hover` is appended after it.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'orange', '&:hover': { color: 'red' } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .c_orange {
    color: orange;
  }
  .\[\&\:hover\]\:c_red:hover {
    color: red;
  }
}
");
}

#[test]
fn resolves_token_references_interpolated_in_longhand_values() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": ["@panda/tokens"] },
        "theme": { "tokens": { "colors": { "red": { "300": { "value": "#f00" } } } } },
        "utilities": { "border": { "className": "border" } }
    }));
    let css = compile_layer_css(
        &config,
        concat!(
            "import { css } from '@panda/css'\n",
            "css({ border: '1px solid {colors.red.300}' })\n",
            "css({ border: '2px solid token(colors.red.300)' })",
        ),
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .border_1px_solid_\{colors\.red\.300\} {
        border: 1px solid var(--colors-red-300);
      }
      .border_2px_solid_token\(colors\.red\.300\) {
        border: 2px solid var(--colors-red-300);
      }
    }
    ");
}

#[test]
fn fallback_atomic_class_names_replace_spaces_with_underscores() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .box-shadow_0_20px_60px_rgba\(15\,_23\,_42\,_0\.16\) {
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.16);
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
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ _hover: { md: { color: 'red' } } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
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
    assert_snapshot!(css, @r#"@layer reset, base, tokens, recipes, utilities;@layer utilities{.m_1px_2px{margin:1px 2px;}.content_\"a__b\"{content:"a  b";}.descendantHover\:m_3px_4px :hover{margin:3px 4px;}}"#);
}
