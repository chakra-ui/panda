use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetOptions;

use crate::common::{compile_css, compile_css_with_options, config};

#[test]
fn emits_global_vars_from_serialized_config() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--random-color": "red",
            "--button-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      :where(:root, :host) {
        --random-color: red;
      }
      @property --button-color {
        syntax: '<color>';
        inherits: false;
        initial-value: blue;
      }
    }
    ");
}

#[test]
fn emits_global_vars_without_global_css() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--random-color": "red"
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      :where(:root, :host) {
        --random-color: red;
      }
    }
    ");
}

#[test]
fn emits_global_css_before_global_vars_in_base_layer() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" }
        },
        "globalCss": {
            "body": {
                "color": "red"
            }
        },
        "globalVars": {
            "--random-color": "red"
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      body {
        color: red;
      }
      :where(:root, :host) {
        --random-color: red;
      }
    }
    ");
}

#[test]
fn global_vars_property_allows_missing_initial_value_for_universal_syntax() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--anything": {
                "syntax": "*",
                "inherits": false
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @property --anything {
        syntax: '*';
        inherits: false;
      }
    }
    ");
}

#[test]
fn global_vars_property_ignores_missing_initial_value_for_typed_syntax() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--button-color": {
                "syntax": "<color>",
                "inherits": false
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    ");
}

#[test]
fn minified_output_preserves_global_vars_syntax() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--random-color": "red",
            "--button-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            }
        }
    }));
    let css = compile_css_with_options(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    );
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;@layer base{:root{--made-with-panda:'🐼';}:where(:root, :host){--random-color:red;}@property --button-color{syntax:'<color>';inherits:false;initial-value:blue;}}");
}
