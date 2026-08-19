use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_output, config};

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
        },
        "globalCss": {
            "button": { "color": "var(--button-color)" }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--button-color);
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
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
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
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
        },
        "globalCss": {
            "button": { "color": "var(--anything)" }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--anything);
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
        },
        "globalCss": {
            "button": { "color": "var(--button-color)" }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--button-color);
      }
    }
    ");
}

#[test]
fn drops_registrations_the_stylesheet_never_touches() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--used-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            },
            "--unused-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "red"
            }
        },
        "globalCss": {
            "button": { "color": "var(--used-color)" }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--used-color);
      }
      @property --used-color {
        syntax: '<color>';
        inherits: false;
        initial-value: blue;
      }
    }
    ");
}

#[test]
fn keeps_a_registration_the_stylesheet_only_writes() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--panel-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            }
        },
        "globalCss": {
            "button": { "--panel-color": "red" }
        }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        --panel-color: red;
      }
      @property --panel-color {
        syntax: '<color>';
        inherits: false;
        initial-value: blue;
      }
    }
    ");
}

#[test]
fn keeps_a_registration_a_utility_class_references() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" }
        },
        "globalVars": {
            "--panel-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            }
        }
    }));
    let source = "import { css } from '@panda/css'\ncss({ color: 'var(--panel-color)' })";
    let css = compile_output(&config, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base, StylesheetLayer::Utilities]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      @property --panel-color {
        syntax: '<color>';
        inherits: false;
        initial-value: blue;
      }
    }
    @layer utilities {
      .c_var\\(--panel-color\\) {
        color: var(--panel-color);
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
        },
        "globalCss": {
            "button": { "color": "var(--button-color)" }
        }
    }));
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    )
    .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"@layer base{:root{--made-with-panda:'🐼';}button{color:var(--button-color);}:where(:root, :host){--random-color:red;}@property --button-color{syntax:'<color>';inherits:false;initial-value:blue;}}");
}

#[test]
fn property_fallback_is_off_by_default() {
    let config = config(serde_json::json!({
        "globalVars": {
            "--panel-color": { "syntax": "<color>", "inherits": false, "initialValue": "blue" }
        },
        "globalCss": { "button": { "color": "var(--panel-color)" } }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--panel-color);
      }
      @property --panel-color {
        syntax: '<color>';
        inherits: false;
        initial-value: blue;
      }
    }
    ");
}

#[test]
fn property_fallback_seeds_non_inheriting_vars_on_every_element() {
    let config = config(serde_json::json!({
        "optimize": { "propertyFallback": true },
        "globalVars": {
            "--panel-color": { "syntax": "<color>", "inherits": false, "initialValue": "blue" },
            "--panel-gap": { "syntax": "*", "inherits": false }
        },
        "globalCss": { "button": { "color": "var(--panel-color)", "gap": "var(--panel-gap, 0)" } }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--panel-color);
        gap: var(--panel-gap, 0);
      }
      *, ::before, ::after, ::backdrop {
        --panel-color: blue;
        --panel-gap: initial;
      }
      @property --panel-color {
        syntax: '<color>';
        inherits: false;
        initial-value: blue;
      }
      @property --panel-gap {
        syntax: '*';
        inherits: false;
      }
    }
    ");
}

#[test]
fn property_fallback_keeps_inheriting_vars_on_the_root() {
    let config = config(serde_json::json!({
        "optimize": { "propertyFallback": true },
        "globalVars": {
            "--panel-color": { "syntax": "<color>", "inherits": true, "initialValue": "blue" }
        },
        "globalCss": { "button": { "color": "var(--panel-color)" } }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        color: var(--panel-color);
      }
      :where(:root, :host) {
        --panel-color: blue;
      }
      @property --panel-color {
        syntax: '<color>';
        inherits: true;
        initial-value: blue;
      }
    }
    ");
}

#[test]
fn property_fallback_only_seeds_registrations_that_survived_pruning() {
    let config = config(serde_json::json!({
        "optimize": { "propertyFallback": true },
        "globalVars": {
            "--used": { "syntax": "*", "inherits": false, "initialValue": "1" },
            "--unused": { "syntax": "*", "inherits": false, "initialValue": "2" }
        },
        "globalCss": { "button": { "opacity": "var(--used)" } }
    }));
    let css = compile_output(&config, "", StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Base]);
    assert_snapshot!(css, @"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      button {
        opacity: var(--used);
      }
      *, ::before, ::after, ::backdrop {
        --used: 1;
      }
      @property --used {
        syntax: '*';
        inherits: false;
        initial-value: 1;
      }
    }
    ");
}

#[test]
fn a_reserved_name_alone_is_not_a_conflict() {
    let config = config(serde_json::json!({
        "globalVars": { "--blur": "4px" },
        "utilityGlobalVars": { "--blur": "blur" }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
}

#[test]
fn shadowing_a_registration_the_sheet_uses_warns() {
    let config = config(serde_json::json!({
        "globalVars": { "--blur": "4px" },
        "utilityGlobalVars": { "--blur": "blur" },
        "globalCss": { "button": { "filter": "var(--blur, )" } }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let messages = output
        .diagnostics
        .iter()
        .map(|d| d.message.as_str())
        .collect::<Vec<_>>();
    assert_eq!(messages.len(), 1, "{messages:?}");
    assert!(messages[0].contains("`--blur`"), "{messages:?}");
    assert!(messages[0].contains("`blur` utility"), "{messages:?}");
}
