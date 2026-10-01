#![allow(
    clippy::cast_precision_loss,
    clippy::disallowed_macros,
    clippy::print_stdout,
    clippy::too_many_lines,
    reason = "benchmark binary intentionally prints JSON timing output"
)]

//! Recipe CSS emission for recipes that mix explicit properties with
//! `textStyle` / `layerStyle` compositions, across variants, compounds, and
//! slot recipes. Set `BENCH_CSS_OUT=path` to save the generated CSS.

use std::time::{Duration, Instant};

use pandacss_config::UserConfig;
use pandacss_project::Project;
use pandacss_stylesheet::{StylesheetInput, StylesheetOptions};
use serde_json::{Map, Value, json};

const RECIPES: usize = 300;
const SLOT_RECIPES: usize = 100;
const STYLES: usize = 20;

fn config() -> UserConfig {
    let weights = ["normal", "medium", "semibold", "bold"];
    let mut text_styles = Map::new();
    let mut layer_styles = Map::new();
    for i in 0..STYLES {
        text_styles.insert(
            format!("t{i}"),
            json!({ "value": { "fontWeight": weights[i % 4], "fontSize": format!("{}px", 12 + i), "lineHeight": "1.5" } }),
        );
        layer_styles.insert(
            format!("l{i}"),
            json!({ "value": { "color": "red", "bg": "blue", "borderWidth": format!("{}px", i % 3) } }),
        );
    }

    let mut recipes = Map::new();
    for i in 0..RECIPES {
        let t = format!("t{}", i % STYLES);
        let l = format!("l{}", i % STYLES);
        recipes.insert(
            format!("r{i}"),
            json!({
                "className": format!("r{i}"),
                "base": { "textStyle": t, "layerStyle": l, "fontWeight": weights[(i + 1) % 4], "color": "green", "_hover": { "textStyle": t, "fontWeight": "bold" } },
                "variants": {
                    "size": {
                        "sm": { "textStyle": format!("t{}", (i + 1) % STYLES), "fontSize": "11px" },
                        "md": { "textStyle": format!("t{}", (i + 2) % STYLES), "fontSize": "14px", "fontWeight": "medium" },
                        "lg": { "layerStyle": format!("l{}", (i + 3) % STYLES), "fontSize": "18px", "bg": "white" }
                    },
                    "tone": {
                        "solid": { "layerStyle": l, "color": "white" },
                        "ghost": { "bg": "transparent", "textStyle": t }
                    }
                },
                "compoundVariants": [
                    { "size": "lg", "tone": "solid", "css": { "textStyle": t, "fontWeight": "bold" } },
                    { "size": "sm", "tone": "ghost", "css": { "layerStyle": l, "color": "black" } }
                ]
            }),
        );
    }

    let mut slot_recipes = Map::new();
    for i in 0..SLOT_RECIPES {
        let t = format!("t{}", i % STYLES);
        let l = format!("l{}", i % STYLES);
        slot_recipes.insert(
            format!("s{i}"),
            json!({
                "className": format!("s{i}"),
                "slots": ["root", "title", "body"],
                "base": {
                    "root": { "layerStyle": l, "bg": "white" },
                    "title": { "textStyle": t, "fontWeight": "bold" },
                    "body": { "textStyle": format!("t{}", (i + 5) % STYLES), "fontSize": "13px" }
                },
                "variants": {
                    "size": {
                        "sm": { "title": { "textStyle": t, "fontSize": "12px" }, "body": { "fontWeight": "normal" } },
                        "lg": { "title": { "fontSize": "20px", "textStyle": format!("t{}", (i + 1) % STYLES) }, "root": { "layerStyle": l, "color": "black" } }
                    }
                }
            }),
        );
    }

    serde_json::from_value(json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": { "hover": "&:hover" },
        "utilities": {
            "fontWeight": { "className": "fw" }, "fontSize": { "className": "fs" }, "lineHeight": { "className": "lh" },
            "color": { "className": "c" }, "bg": { "className": "bg" }, "borderWidth": { "className": "bw" }
        },
        "theme": {
            "textStyles": Value::Object(text_styles),
            "layerStyles": Value::Object(layer_styles),
            "recipes": Value::Object(recipes),
            "slotRecipes": Value::Object(slot_recipes)
        },
        "staticCss": { "recipes": "*" }
    }))
    .expect("config deserializes")
}

fn main() {
    let config = config();
    let system = pandacss_system::System::new(config.clone()).expect("system");
    let mut project = Project::new(system);
    let token_dictionary = project.system().token_dictionary();

    let warm = 5;
    let iterations = 40;
    let mut samples: Vec<Duration> = Vec::with_capacity(iterations);
    let mut css_bytes = 0;
    for round in 0..warm + iterations {
        let snapshots = project.stylesheet_snapshots(&config);
        let t0 = Instant::now();
        let output = pandacss_stylesheet::compile(
            StylesheetInput {
                config: &config,
                token_dictionary: token_dictionary.clone(),
                atoms: snapshots.atoms,
                utility_styles: snapshots.utility_styles,
                view_transitions: snapshots.view_transitions,
                position_try: snapshots.position_try,
                inline_keyframes: snapshots.inline_keyframes,
                encoded_recipes: snapshots.encoded_recipes,
                static_encoded_recipes: Some(snapshots.static_encoded_recipes),
                static_pattern_atoms: &[],
                token_refs: snapshots.token_refs,
            },
            &StylesheetOptions {
                minify: false,
                include_static: true,
                source_map: false,
                emit_layer_declaration: true,
                ..StylesheetOptions::default()
            },
        );
        let elapsed = t0.elapsed();
        css_bytes = output.css.len();
        if round == 0
            && let Ok(path) = std::env::var("BENCH_CSS_OUT")
        {
            std::fs::write(path, &output.css).expect("write css");
        }
        if round >= warm {
            samples.push(elapsed);
        }
    }
    samples.sort();
    let ms = |d: Duration| d.as_secs_f64() * 1000.0;
    println!(
        "{{\"cssBytes\":{css_bytes},\"medianMs\":{:.3},\"minMs\":{:.3},\"p90Ms\":{:.3}}}",
        ms(samples[iterations / 2]),
        ms(samples[0]),
        ms(samples[iterations * 9 / 10])
    );
}
