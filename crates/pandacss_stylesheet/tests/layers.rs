mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions, has_layer_declaration};

use common::{compile_css, compile_output, config};

#[test]
fn default_layer_names_emit_unchanged_preamble() {
    let config = config(serde_json::json!({}));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;");
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

#[test]
fn partial_rename_keeps_other_defaults() {
    // Only `reset` is renamed — the other four must stay at defaults.
    let config = config(serde_json::json!({
        "preflight": true,
        "layers": { "reset": "preflight" }
    }));
    let css = compile_css(&config, "");
    let lines: Vec<&str> = css.lines().take(2).collect();
    assert_snapshot!(lines.join("\n"), @r"
    @layer preflight, base, tokens, recipes, utilities;
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
    let openers: Vec<&str> = css
        .lines()
        .filter(|line| line.starts_with("@layer "))
        .collect();
    assert_snapshot!(openers.join("\n"), @r"
    @layer r, b, t, rc, u;
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
