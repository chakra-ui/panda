use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_output, config, split_output};

#[test]
fn polyfill_skips_layer_wrappers_and_boosts_later_layers() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "margin": { "className": "m" }
        },
        "globalCss": {
            "body": { "margin": "0" }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red', margin: '1px' })",
        StylesheetOptions {
            polyfill: true,
            ..StylesheetOptions::default()
        },
    )
    .css;

    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    body:not(#\#) {
      margin: 0;
    }
    .m_1px:not(#\##\##\##\##\##\##\##\##\#) {
      margin: 1px;
    }
    .c_red:not(#\##\##\##\##\##\##\##\##\#) {
      color: red;
    }
    "#);
}

#[test]
fn polyfill_utilities_outrank_base() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": { "body": { "color": "blue" } }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let base = output.layer_css(StylesheetLayer::Base).unwrap_or("");
    let utilities = output.layer_css(StylesheetLayer::Utilities).unwrap_or("");
    assert_snapshot!(
        format!(
            "base_amount={}\nutilities_amount={}\n--- base ---\n{}\n--- utilities ---\n{}",
            base.matches("#\\#").count(),
            utilities.matches("#\\#").count(),
            base.trim_end(),
            utilities.trim_end(),
        ),
        @r#"
    base_amount=2
    utilities_amount=9
    --- base ---
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    body:not(#\#) {
      color: blue;
    }
    --- utilities ---
    .c_red:not(#\##\##\##\##\##\##\##\##\#) {
      color: red;
    }
    "#
    );
}

#[test]
fn polyfill_raises_step_when_global_css_has_ids() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            "#a #b": { "color": "blue" }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            ..StylesheetOptions::default()
        },
    )
    .css;

    // step = 3 → utilities amount = 9*3 = 27 IDs in one :not(...)
    assert!(!css.contains("@layer"));
    assert!(css.contains("#a"));
    let util_line = css
        .lines()
        .find(|line| line.contains(".c_red"))
        .expect(".c_red");
    assert_eq!(util_line.matches("#\\#").count(), 27);
    assert_eq!(util_line.matches(":not(").count(), 1);
}

#[test]
fn polyfill_keeps_at_rule_descriptors() {
    // Declarations inside @font-face / @property / @position-try (no .rule()).
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "globalFontface": {
            "Inter": {
                "src": "url('/fonts/inter.woff2')",
                "fontWeight": 400
            }
        },
        "globalVars": {
            "--button-color": {
                "syntax": "<color>",
                "inherits": false,
                "initialValue": "blue"
            }
        },
        "globalPositionTry": {
            "flip": {
                "positionAnchor": "--trigger",
                "top": "anchor(bottom)"
            }
        }
    }));
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    @property --button-color {
      syntax: '<color>';
      inherits: false;
      initial-value: blue;
    }
    @font-face {
      font-family: Inter;
      src: url('/fonts/inter.woff2');
      font-weight: 400;
    }
    @position-try --flip {
      position-anchor: --trigger;
      top: anchor(bottom);
    }
    "#);
}

#[test]
fn polyfill_split_omits_layer_preamble() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } }
    }));
    let files = split_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            ..StylesheetOptions::default()
        },
    );
    let rendered = files
        .iter()
        .map(|file| format!("=== {} ===\n{}", file.path, file.code))
        .collect::<Vec<_>>()
        .join("\n");
    assert_snapshot!(rendered, @r#"
    === styles.css ===
    @import './styles/global.css';
    @import './styles/utilities.css';

    === styles/global.css ===
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }

    === styles/utilities.css ===
    .c_red:not(#\##\##\##\##\##\##\##\##\#) {
      color: red;
    }
    "#);
}

fn boost_amount(line: &str) -> usize {
    line.matches("#\\#").count()
}

#[test]
fn polyfill_step_counts_ids_inside_nested_at_rules() {
    // IDs under `@media` still raise step (maxIds=2 → step=3).
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            "@media screen": {
                "#a #b": { "color": "blue" }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            ..StylesheetOptions::default()
        },
    )
    .css;
    let util_line = css
        .lines()
        .find(|line| line.contains(".c_red"))
        .expect(".c_red");
    assert_eq!(boost_amount(util_line), 27); // utilities rank 9 * step 3
}

#[test]
fn polyfill_step_uses_specificity_a_for_is_and_where() {
    // `:is(#a, #b)` → A=1 (max arg, not sum); `:where(#x #y)` → A=0.
    // So maxIds=1 → step=2 → utilities amount = 9*2 = 18 (not 27 from naive sum).
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ":is(#a, #b)": { "color": "blue" },
            ":where(#x #y)": { "margin": "0" }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            ..StylesheetOptions::default()
        },
    )
    .css;
    let util_line = css
        .lines()
        .find(|line| line.contains(".c_red"))
        .expect(".c_red");
    assert_eq!(boost_amount(util_line), 18);
}

#[test]
fn polyfill_nested_recipe_variants_outrank_base() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "display": "inline-flex" },
                    "variants": {
                        "size": { "sm": { "padding": "8px" } }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    let base_line = css
        .lines()
        .find(|line| line.contains(".button") && !line.contains("button--"))
        .expect(".button");
    let variant_line = css
        .lines()
        .find(|line| line.contains(".button--size_sm"))
        .expect(".button--size_sm");
    let base_amount = boost_amount(base_line);
    let variant_amount = boost_amount(variant_line);
    // recipes.base < recipes.variants — even a less-specific variants selector wins.
    assert!(
        variant_amount > base_amount,
        "{variant_amount} > {base_amount}"
    );
    assert_eq!(base_amount, 3); // recipes.base rank
    assert_eq!(variant_amount, 7); // recipes.variants rank
}

#[test]
fn polyfill_utilities_beat_base_even_with_more_ids() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            "#a #b": { "color": "blue" }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let base = output.layer_css(StylesheetLayer::Base).unwrap_or("");
    let utilities = output.layer_css(StylesheetLayer::Utilities).unwrap_or("");
    let base_line = base.lines().find(|l| l.contains("#a")).expect("#a");
    let util_line = utilities
        .lines()
        .find(|l| l.contains(".c_red"))
        .expect(".c_red");
    let base_amount = boost_amount(base_line);
    let util_amount = boost_amount(util_line);
    let max_ids = 2_usize;
    // csstools: later layer amount >= earlier amount + maxIds + 1
    assert!(
        util_amount > base_amount + max_ids,
        "utilities {util_amount} > base {base_amount} + maxIds"
    );
}

#[test]
fn polyfill_split_utilities_use_full_sheet_step() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            "#a #b": { "color": "blue" }
        }
    }));
    let options = StylesheetOptions {
        polyfill: true,
        emit_layer_declaration: false,
        ..StylesheetOptions::default()
    };
    let merged = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        options.clone(),
    );
    let merged_util = merged
        .layer_css(StylesheetLayer::Utilities)
        .unwrap_or("")
        .lines()
        .find(|l| l.contains(".c_red"))
        .expect("merged .c_red")
        .to_owned();

    let files = split_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        options,
    );
    let split_util = files
        .iter()
        .find(|f| f.path == "styles/utilities.css")
        .expect("utilities.css")
        .code
        .lines()
        .find(|l| l.contains(".c_red"))
        .expect("split .c_red")
        .to_owned();

    assert_eq!(boost_amount(&split_util), boost_amount(&merged_util));
    assert_eq!(boost_amount(&split_util), 27);
}

#[test]
fn polyfill_handles_nested_ampersand_comma_list() {
    // Escaped comma in the class name vs. the real top-level list separator.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ '& .one, & .two': { color: 'red' } })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    .\[\&_\.one\,_\&_\.two\]\:c_red:not(#\##\##\##\##\##\##\##\##\#) .one, .\[\&_\.one\,_\&_\.two\]\:c_red:not(#\##\##\##\##\##\##\##\##\#) .two {
      color: red;
    }
    "#);
}

#[test]
fn polyfill_handles_attribute_selector_with_ampersand_in_string() {
    // Escaped brackets in the class name vs. a real trailing attribute selector.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } }
    }));
    let css = compile_output(
        &config,
        r#"import { css } from '@panda/css'
css({ '&[data-category="sound & vision"]': { color: 'red' } })"#,
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    .\[\&\[data-category\=\"sound_\&_vision\"\]\]\:c_red[data-category="sound & vision"]:not(#\##\##\##\##\##\##\##\##\#) {
      color: red;
    }
    "#);
}

#[test]
fn polyfill_handles_is_where_comma_grouping_and_nested_id() {
    // Comma inside :is()/:where() shouldn't split the rule or hide a nested ID.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ":is(.a, .b#id) > .c": { "color": "blue" },
            ":where(.x, .y) ~ .z": { "color": "green" }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\##\#) {
      --made-with-panda: '🐼';
    }
    :is(.a, .b#id):not(#\##\#) > .c {
      color: blue;
    }
    :where(.x, .y):not(#\##\#) ~ .z {
      color: green;
    }
    .c_red:not(#\##\##\##\##\##\##\##\##\##\##\##\##\##\##\##\##\##\#) {
      color: red;
    }
    "#);
}

#[test]
fn polyfill_inverts_important_priority_across_layers() {
    // Spec: `!important` reverses layer priority — base beats utilities.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ".target": { "color": "red !important" }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'blue !important' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let base_line = output
        .css
        .lines()
        .find(|l| l.contains(".target"))
        .expect(".target");
    let utility_line = output
        .css
        .lines()
        .find(|l| l.contains(".c_blue"))
        .expect(".c_blue");
    assert!(
        boost_amount(base_line) > boost_amount(utility_line),
        "base {} > utilities {}",
        boost_amount(base_line),
        boost_amount(utility_line)
    );
}

#[test]
fn polyfill_inverts_important_priority_across_three_layers() {
    // Same invariant as csstools' important.css fixture, extended to 3 real
    // Panda layers: base < recipes < utilities for important priority.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ".target": { "color": "red !important" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "color": "green !important" }
                }
            }
        }
    }));
    let output = compile_output(
        &config,
        "import { button } from '@panda/recipes'; import { css } from '@panda/css'; button({}); css({ color: 'blue !important' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let base_amount = boost_amount(
        output
            .css
            .lines()
            .find(|l| l.contains(".target"))
            .expect(".target"),
    );
    let recipe_amount = boost_amount(
        output
            .css
            .lines()
            .find(|l| l.contains(".button") && !l.contains("button--"))
            .expect(".button"),
    );
    let utility_amount = boost_amount(
        output
            .css
            .lines()
            .find(|l| l.contains(".c_blue"))
            .expect(".c_blue"),
    );
    assert!(
        base_amount > recipe_amount && recipe_amount > utility_amount,
        "base {base_amount} > recipe {recipe_amount} > utilities {utility_amount}"
    );
}

#[test]
fn polyfill_splits_mixed_important_and_normal_declarations_in_one_rule() {
    // Mixed important/normal decls in one rule split into two boosted blocks.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ".target": { "color": "red !important", "fontSize": "12px" }
        }
    }));
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    .target:not(#\#) {
      font-size: 12px;
    }
    .target:not(#\##\##\##\##\##\##\##\#) {
      color: red !important;
    }
    "#);
}

#[test]
fn polyfill_inverts_preflight_important_declarations() {
    // `[hidden]` is rank 0 (reset) — its `!important` needs the inverted boost.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "preflight": true,
        "utilities": { "color": { "className": "c" } }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let hidden_line = output
        .css
        .lines()
        .find(|l| l.contains("[hidden]"))
        .expect("[hidden] preflight rule");
    // Selector already has its own `:not()` inside `:where()` — check the boost, not presence.
    assert!(
        boost_amount(hidden_line) > 0,
        "reset's !important declaration must get a non-zero boost, got: {hidden_line}"
    );
}

#[test]
fn polyfill_leaves_keyframe_step_selectors_unboosted() {
    // `from`/`to`/`50%` aren't real selectors — no pseudo-class is valid
    // there. Verified in a real browser: boosting them drops every step,
    // leaving `@keyframes spin {}` empty and the animation dead.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "animation": { "className": "anim" } },
        "theme": {
            "keyframes": {
                "spin": {
                    "from": { "transform": "rotate(0deg)" },
                    "to": { "transform": "rotate(360deg)" }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ animation: 'spin 1s' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .anim_spin_1s:not(#\##\##\##\##\##\##\##\##\#) {
      animation: spin 1s;
    }
    "#);
}

#[test]
fn polyfill_boosts_unicode_selectors_without_panicking() {
    // CJK/accented identifiers are valid CSS — the whole compiler panicked on
    // these under polyfill (byte-index slicing off a UTF-8 char boundary).
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ".日本語 .café": { "color": "red" }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'blue' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    .日本語:not(#\#) .café {
      color: red;
    }
    .c_blue:not(#\##\##\##\##\##\##\##\##\#) {
      color: blue;
    }
    "#);
}

#[test]
fn polyfill_important_survives_minify() {
    // Minify strips whitespace around `!important` — the boost + minified
    // declaration must still be valid, parseable CSS (no dropped `;`/space).
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            ".target": { "color": "red !important" }
        }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'blue !important' })",
        StylesheetOptions {
            polyfill: true,
            minify: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(
        css,
        @r#":root:not(#\#){--made-with-panda:'🐼';}.target:not(#\##\##\##\##\##\##\##\#){color:red !important;}.c_blue\!{color:blue !important;}"#
    );
}

#[test]
fn polyfill_recipe_split_inverts_important_priority() {
    // `emit_recipe_split` is a separate code path from the merged emit — lock
    // in that it reuses the same important-inversion logic, not a copy that
    // could drift.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "color": "green !important" }
                }
            }
        }
    }));
    let options = StylesheetOptions {
        polyfill: true,
        emit_layer_declaration: false,
        ..StylesheetOptions::default()
    };
    let files = split_output(
        &config,
        "import { button } from '@panda/recipes'; button({})",
        options,
    );
    let recipe_file = files
        .iter()
        .find(|f| f.path.contains("button"))
        .expect("button recipe split file");
    let line = recipe_file
        .code
        .lines()
        .find(|l| l.contains(".button"))
        .expect(".button");
    // recipes.base rank 3, max_rank 9 → important amount = (9-3)*step = 6.
    assert_eq!(boost_amount(line), 6);
}

#[test]
fn polyfill_boosts_selectors_inside_supports() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "globalCss": {
            "@supports (display: grid)": {
                ".target": { "color": "blue" }
            }
        }
    }));
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert_snapshot!(css, @r#"
    :root:not(#\#) {
      --made-with-panda: '🐼';
    }
    @supports (display: grid) {
      .target:not(#\#) {
        color: blue;
      }
    }
    "#);
}

#[test]
fn polyfill_default_utilities_outrank_custom_utility_sublayer() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "display": { "className": "d", "layer": "compositions" }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red', display: 'flex' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let default_line = output
        .css
        .lines()
        .find(|l| l.contains(".c_red"))
        .expect(".c_red");
    let custom_sublayer_line = output
        .css
        .lines()
        .find(|l| l.contains(".d_flex"))
        .expect(".d_flex");
    assert!(
        boost_amount(default_line) > boost_amount(custom_sublayer_line),
        "default utilities {} > custom sublayer {}",
        boost_amount(default_line),
        boost_amount(custom_sublayer_line),
    );
}

#[test]
fn polyfill_important_custom_utility_sublayer_outranks_default_utilities() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "display": { "className": "d", "layer": "compositions" }
        }
    }));
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red !important', display: 'flex !important' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let default_line = output
        .css
        .lines()
        .find(|line| line.contains(".c_red"))
        .expect(".c_red");
    let custom_line = output
        .css
        .lines()
        .find(|line| line.contains(".d_flex"))
        .expect(".d_flex");

    assert!(boost_amount(custom_line) > boost_amount(default_line));
}

#[test]
fn polyfill_respects_implicit_parent_order_for_dotted_utility_layers() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c", "layer": "theme" },
            "display": { "className": "d", "layer": "theme.inner" }
        }
    }));

    let normal = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red', display: 'flex' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    let important = compile_output(
        &config,
        "import { css } from '@panda/css'\ncss({ color: 'red !important', display: 'flex !important' })",
        StylesheetOptions {
            polyfill: true,
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    )
    .css;
    let amount = |css: &str, class_name: &str| {
        boost_amount(
            css.lines()
                .find(|line| line.contains(class_name))
                .expect("utility class"),
        )
    };

    assert!(amount(&normal, ".c_red") > amount(&normal, ".d_flex"));
    assert!(amount(&important, ".d_flex") > amount(&important, ".c_red"));
}

#[test]
fn polyfill_empty_stylesheet_does_not_panic() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {}
    }));
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            polyfill: true,
            ..StylesheetOptions::default()
        },
    )
    .css;
    assert!(!css.contains("@layer"));
}
