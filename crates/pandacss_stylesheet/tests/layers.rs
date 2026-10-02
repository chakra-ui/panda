use insta::assert_snapshot;
use pandacss_stylesheet::{
    StylesheetLayer, StylesheetOptions, has_layer_declaration, strip_layer_order_statements,
};

use crate::common::{compile_css, compile_output, config, split_output};

#[test]
fn default_layer_names_emit_unchanged_preamble() {
    let config = config(serde_json::json!({}));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
    }
    ");
}

#[test]
fn can_omit_layer_order_declaration() {
    let config = config(serde_json::json!({
        "globalCss": { "body": { "margin": "0" } }
    }));
    let output = compile_output(
        &config,
        "",
        StylesheetOptions {
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    assert!(
        !output
            .css
            .starts_with("@layer reset, base, tokens, recipes, utilities;")
    );
    assert!(output.css.starts_with("@layer base {"));
    assert!(output.layer_css(StylesheetLayer::Base).is_some());
}

fn recipe_config() -> pandacss_config::UserConfig {
    config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" }, "padding": { "className": "p" } },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": { "size": { "sm": { "padding": "1px" } } },
                    "compoundVariants": [{ "size": "sm", "css": { "color": "blue" } }]
                }
            },
            "slotRecipes": {
                "card": { "className": "card", "slots": ["root"], "base": { "root": { "color": "red" } } }
            }
        }
    }))
}

const RECIPE_SOURCE: &str =
    "import { button, card } from '@panda/recipes'\nbutton({ size: 'sm' })\ncard()";

fn layer_statements(css: &str) -> String {
    css.lines()
        .filter(|line| line.trim_start().starts_with("@layer"))
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn host_declared_layers_still_get_the_recipe_sublayer_order() {
    let output = compile_output(
        &recipe_config(),
        RECIPE_SOURCE,
        StylesheetOptions {
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    assert_snapshot!(layer_statements(&output.css), @"
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    @layer base {
    @layer recipes {
      @layer variants {
      @layer compound_variants {
    @layer recipes.slots {
      @layer base {
    ");
}

#[test]
fn host_declared_layers_without_recipes_get_no_order_statements() {
    let config = config(serde_json::json!({
        "globalCss": { "body": { "margin": "0" } }
    }));
    let output = compile_output(
        &config,
        "",
        StylesheetOptions {
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    assert!(!output.css.contains("recipes.base"));
}

#[test]
fn split_entry_declares_the_recipe_sublayer_order_when_the_host_declares_layers() {
    let files = split_output(
        &recipe_config(),
        RECIPE_SOURCE,
        StylesheetOptions {
            emit_layer_declaration: false,
            ..StylesheetOptions::default()
        },
    );
    let entry = files
        .iter()
        .find(|file| file.path == "styles.css")
        .expect("styles.css entry");
    assert_snapshot!(layer_statements(&entry.code), @"
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    ");
}

#[test]
fn partial_rename_keeps_other_defaults() {
    // Only `reset` is renamed — the other four must stay at defaults.
    let config = config(serde_json::json!({
        "preflight": true,
        "layers": { "reset": "preflight" }
    }));
    let css = compile_css(&config, "");
    let lines: Vec<&str> = css.lines().take(4).collect();
    assert_snapshot!(lines.join("\n"), @"
    @layer preflight, base, tokens, recipes, utilities;
    @layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
    @layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
    @layer preflight {
    ");
}

#[test]
fn full_rename_reflects_in_preamble_and_all_blocks() {
    let config = config(serde_json::json!({
        "preflight": true,
        "globalCss": { "body": { "margin": "0" } },
        "theme": {
            "tokens": { "colors": { "red": { "value": "#f00" } } }
        },
        "layers": {
            "reset":     "r",
            "base":      "b",
            "tokens":    "t",
            "recipes":   "rc",
            "utilities": "u"
        }
    }));
    let css = compile_css(&config, "");
    // The preamble + the open of each non-empty layer block, in order.
    let mut openers: Vec<&str> = css.lines().take(3).collect();
    openers.extend(
        css.lines()
            .skip(3)
            .filter(|line| line.starts_with("@layer ")),
    );
    assert_snapshot!(openers.join("\n"), @"
    @layer r, b, t, rc, u;
    @layer rc.base, rc.slots, rc.variants, rc.compound_variants;
    @layer rc.slots.base, rc.slots.variants, rc.slots.compound_variants;
    @layer r {
    @layer b {
    @layer t {
    ");
}

#[test]
fn stylesheet_layer_accessor_preserved_under_rename() {
    // Semantic identity is fixed: `StylesheetLayer::Reset` still returns the
    // reset range even when the user renamed it to "preflight".
    let config = config(serde_json::json!({
        "preflight": true,
        "layers": { "reset": "preflight" }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let reset = output
        .layer_css(StylesheetLayer::Reset)
        .expect("Reset accessor must still resolve under rename");
    assert!(reset.starts_with("@layer preflight {"));
}

#[test]
fn two_layers_mapped_to_same_name_emit_one_collision_warning() {
    let config = config(serde_json::json!({
        "layers": { "reset": "x", "base": "x" }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let summary: Vec<String> = output
        .diagnostics
        .iter()
        .map(|d| format!("{:?} {} {}", d.severity, d.code, d.message))
        .collect();
    assert_snapshot!(summary.join("\n"), @r#"Warning layer_name_collision layer name "x" is shared by layers.reset, layers.base; the cascade order becomes ambiguous"#);
}

#[test]
fn three_layers_mapped_to_same_name_emit_one_warning_per_name() {
    // Three slots colliding on the same name → ONE warning, not three.
    let config = config(serde_json::json!({
        "layers": { "reset": "x", "base": "x", "tokens": "x" }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let codes: Vec<&str> = output.diagnostics.iter().map(|d| d.code.as_str()).collect();
    assert_snapshot!(format!("{codes:?}"), @r#"["layer_name_collision"]"#);
}

#[test]
fn rename_collides_with_another_layers_default_name() {
    // Renaming `reset` to "tokens" collides with the (default) tokens layer
    // even though the user only touched one field. Same diagnostic as an
    // explicit collision — the cascade is ambiguous either way.
    let config = config(serde_json::json!({
        "layers": { "reset": "tokens" }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let summary: Vec<String> = output
        .diagnostics
        .iter()
        .map(|d| format!("{:?} {} {}", d.severity, d.code, d.message))
        .collect();
    assert_snapshot!(summary.join("\n"), @r#"Warning layer_name_collision layer name "tokens" is shared by layers.reset, layers.tokens; the cascade order becomes ambiguous"#);
}

#[test]
fn distinct_collision_groups_emit_one_warning_each() {
    // Two independent collisions: (reset, base) → "x" and (tokens, recipes) → "y".
    let config = config(serde_json::json!({
        "layers": {
            "reset":   "x", "base":    "x",
            "tokens":  "y", "recipes": "y"
        }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    let summary: Vec<String> = output
        .diagnostics
        .iter()
        .map(|d| format!("{} {}", d.code, d.message))
        .collect();
    assert_snapshot!(summary.join("\n"), @r#"
    layer_name_collision layer name "x" is shared by layers.reset, layers.base; the cascade order becomes ambiguous
    layer_name_collision layer name "y" is shared by layers.tokens, layers.recipes; the cascade order becomes ambiguous
    "#);
}

const LAYERS: [&str; 5] = ["reset", "base", "tokens", "recipes", "utilities"];

#[test]
fn has_layer_declaration_matches_an_exact_or_superset_statement() {
    assert!(has_layer_declaration(
        "@layer reset, base, tokens, recipes, utilities;",
        &LAYERS
    ));
    assert!(has_layer_declaration(
        "@layer reset, base, tokens, recipes.base, recipes.variants, recipes.compound_variants, recipes.slots, utilities;",
        &LAYERS
    ));
    assert!(has_layer_declaration(
        "@layer reset, base, tokens, recipes, utilities, custom;\n.x {}",
        &LAYERS
    ));
}

#[test]
fn has_layer_declaration_rejects_non_matches() {
    assert!(!has_layer_declaration("@layer base, utilities;", &LAYERS)); // missing layers
    assert!(!has_layer_declaration(".x { color: red }", &LAYERS)); // no declaration
    assert!(!has_layer_declaration("@layer reset { .x {} }", &LAYERS)); // a block, not a statement
    assert!(!has_layer_declaration(
        "@layered reset, base, tokens, recipes, utilities;",
        &LAYERS
    )); // wrong keyword
}

#[test]
fn strip_layer_order_statements_removes_panda_statements_keeps_blocks() {
    assert_eq!(
        strip_layer_order_statements(
            "@layer reset, base, tokens, recipes, utilities;\n@layer reset { .x { color: red } }",
            &LAYERS
        ),
        "\n@layer reset { .x { color: red } }"
    );
    assert_eq!(
        strip_layer_order_statements("@layered reset, base;", &LAYERS),
        "@layered reset, base;"
    );
}

#[test]
fn strip_layer_order_statements_leaves_unrelated_layer_orders() {
    let css =
        "@layer framework, overrides;\n@layer reset, base, tokens, recipes, utilities;\n.x {}";
    assert_eq!(
        strip_layer_order_statements(css, &LAYERS),
        "@layer framework, overrides;\n\n.x {}"
    );
    // Incomplete Panda list is not stripped either.
    assert_eq!(
        strip_layer_order_statements("@layer reset, base;", &LAYERS),
        "@layer reset, base;"
    );
}

#[test]
fn has_layer_declaration_ignores_comments() {
    // A documented/commented-out Panda order line must not trigger detection.
    assert!(!has_layer_declaration(
        "/* @layer reset, base, tokens, recipes, utilities; */\n.x { color: red }",
        &LAYERS
    ));
    // The real statement after the comment still counts.
    assert!(has_layer_declaration(
        "/* keep in sync with docs */\n@layer reset, base, tokens, recipes, utilities;",
        &LAYERS
    ));
    // Unterminated comment: nothing after it is reachable, so no match.
    assert!(!has_layer_declaration(
        "/* @layer reset, base, tokens, recipes, utilities;",
        &LAYERS
    ));
}

#[test]
fn strip_layer_order_statements_leaves_comments_untouched() {
    let css = "/* @layer reset, base, tokens, recipes, utilities; */\n.x { color: red }";
    assert_eq!(strip_layer_order_statements(css, &LAYERS), css);

    let css = "/* note */\n@layer reset, base, tokens, recipes, utilities;\n.x {}";
    assert_eq!(
        strip_layer_order_statements(css, &LAYERS),
        "/* note */\n\n.x {}"
    );
}

#[test]
fn layer_order_detection_and_stripping_ignore_strings() {
    let quoted_only = r#".x { content: "@layer reset, base, tokens, recipes, utilities;"; }"#;

    let with_statement = r".x { content: '@layer reset, base, tokens, recipes, utilities;'; }
@layer reset, base, tokens, recipes, utilities;";

    assert_snapshot!(
        format!(
            "quoted-only detected: {}\nquoted-only stripped: {}\nstatement detected: {}\nstatement stripped: {}",
            has_layer_declaration(quoted_only, &LAYERS),
            strip_layer_order_statements(quoted_only, &LAYERS),
            has_layer_declaration(with_statement, &LAYERS),
            strip_layer_order_statements(with_statement, &LAYERS),
        ),
        @r#"
    quoted-only detected: false
    quoted-only stripped: .x { content: "@layer reset, base, tokens, recipes, utilities;"; }
    statement detected: true
    statement stripped: .x { content: '@layer reset, base, tokens, recipes, utilities;'; }
    "#
    );
}
