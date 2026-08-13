#![allow(
    clippy::cast_precision_loss,
    clippy::disallowed_macros,
    clippy::print_stdout,
    reason = "benchmark binary intentionally prints JSON timing output"
)]

//! `staticCss` emit cost as the container scale grows, modelling the configs
//! from discussions #3106 / #3256.
//!
//! Rule count is fixed and only the container scale varies, so identical
//! `cssBytes` across steps means the extra time buys nothing. See
//! `bench/STATIC_CSS_CONDITIONS_REPORT.md`.

use std::time::{Duration, Instant};

use pandacss_config::UserConfig;
use pandacss_project::Project;
use pandacss_stylesheet::{StylesheetInput, StylesheetOptions};
use serde_json::{Value, json};

const SPACING_VALUES: usize = 133;
const CONTAINER_STEPS: [usize; 6] = [0, 4, 8, 14, 32, 64];

const SPACING_PROPERTIES: [&str; 14] = [
    "padding",
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingX",
    "paddingY",
    "margin",
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "marginX",
    "marginY",
];

fn main() {
    let warm = parse_usize_arg("--warm", 1);
    let iterations = parse_usize_arg("--iterations", 3);

    let mut steps = Vec::new();
    for containers in CONTAINER_STEPS {
        let config: UserConfig =
            serde_json::from_value(config_json(containers)).expect("config deserializes");

        for _ in 0..warm {
            let _ = compile_once(&config);
        }

        let mut samples = Vec::with_capacity(iterations);
        let mut last = CompileRun::default();
        for _ in 0..iterations {
            last = compile_once(&config);
            samples.push(last.total);
        }

        steps.push(json!({
            "containers": containers,
            "expandedConditions": expanded_condition_count(containers),
            "medianMs": median_ms(&mut samples),
            "minMs": min_ms(&samples),
            "rules": last.rules,
            "cssBytes": last.css_len,
            "containerBlocks": last.container_blocks,
        }));
    }

    // The empty-scale row drops the conditions entirely, so it is not a baseline.
    let baseline = steps
        .iter()
        .find(|s| s["containers"].as_u64() == Some(4))
        .and_then(|s| s["medianMs"].as_f64());
    let worst = steps.last().and_then(|s| s["medianMs"].as_f64());

    println!(
        "{}",
        json!({
            "scenario": "static-css-conditions",
            "note": "rule count fixed; only the container scale grows",
            "spacingValues": SPACING_VALUES,
            "spacingProperties": SPACING_PROPERTIES.len(),
            "iterations": iterations,
            "steps": steps,
            "slowdownVs4Containers": match (baseline, worst) {
                (Some(base), Some(worst)) if base > 0.0 => json!(worst / base),
                _ => Value::Null,
            },
        })
    );
}

#[derive(Default)]
struct CompileRun {
    total: Duration,
    rules: usize,
    css_len: usize,
    container_blocks: usize,
}

fn compile_once(config: &UserConfig) -> CompileRun {
    let start = Instant::now();

    let system = pandacss_project::System::new(config.clone()).expect("system");
    let mut project = Project::new(system);
    project.parse_file("bench/static-css.tsx", "export const App = () => null\n");

    let token_dictionary = project.config().token_dictionary();
    let snapshots = project.stylesheet_snapshots(config);

    let output = pandacss_stylesheet::compile(
        StylesheetInput {
            config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            view_transitions: snapshots.view_transitions,
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

    CompileRun {
        total: start.elapsed(),
        rules: output.css.matches('{').count(),
        css_len: output.css.len(),
        container_blocks: output.css.matches("@container").count(),
    }
}

fn config_json(containers: usize) -> Value {
    let spacing_keys: Vec<String> = (0..SPACING_VALUES).map(|i| i.to_string()).collect();

    let mut spacing = serde_json::Map::new();
    for (index, key) in spacing_keys.iter().enumerate() {
        spacing.insert(
            key.clone(),
            json!({ "value": format!("{}em", index as f64 * 0.25) }),
        );
    }

    // First four names match the conditions below so they actually resolve.
    let mut container_scale = serde_json::Map::new();
    for index in 0..containers {
        let name = match index {
            0 => "sm".to_owned(),
            1 => "md".to_owned(),
            2 => "lg".to_owned(),
            3 => "xl".to_owned(),
            other => format!("c{other}"),
        };
        container_scale.insert(name, json!(format!("{}rem", 20 + index * 4)));
    }

    let mut properties = serde_json::Map::new();
    for property in SPACING_PROPERTIES {
        properties.insert((*property).to_string(), json!(spacing_keys));
    }

    let conditions = json!(["@pb/sm", "@pb/md", "@pb/lg", "@pb/xl"]);

    json!({
        "cwd": ".",
        "outdir": "styled-system",
        "include": ["./src/**/*.tsx"],
        "preflight": false,
        "theme": {
            "containerNames": ["pb"],
            "containers": container_scale,
            "tokens": { "spacing": spacing, "sizes": spacing },
        },
        "staticCss": {
            "css": [{
                "responsive": false,
                "conditions": conditions,
                "properties": properties,
            }],
        },
    })
}

fn expanded_condition_count(containers: usize) -> usize {
    if containers == 0 {
        return 0;
    }
    // `sm`, `smDown`, `smOnly` per size plus one `smToX` per larger size, for
    // both the unnamed scale and `pb`.
    let per_name = containers * 3 + containers * containers.saturating_sub(1) / 2;
    per_name * 2
}

fn median_ms(samples: &mut [Duration]) -> f64 {
    samples.sort_unstable();
    samples
        .get(samples.len() / 2)
        .map_or(0.0, |d| d.as_secs_f64() * 1000.0)
}

fn min_ms(samples: &[Duration]) -> f64 {
    samples
        .iter()
        .min()
        .map_or(0.0, |d| d.as_secs_f64() * 1000.0)
}

fn parse_usize_arg(flag: &str, fallback: usize) -> usize {
    let mut args = std::env::args();
    while let Some(arg) = args.next() {
        if arg == flag {
            return args.next().and_then(|v| v.parse().ok()).unwrap_or(fallback);
        }
    }
    fallback
}
