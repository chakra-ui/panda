//! Guards the condition-lookup resolution in `pandacss_config::Theme`.
//!
//! Growing the container scale must not change what it costs to emit the same
//! rules. Resolving a condition per lookup instead of once per theme made emit
//! scale with `rules x containers^2` while emitting byte-identical CSS, so only
//! a timing assertion can catch a regression.

use std::time::{Duration, Instant};

use serde_json::json;

use crate::common::{compile_css, config};

/// The measured ratio is ~1.1x resolved and was ~75x per-lookup, so this sits in
/// a wide gap and tolerates a loaded CI machine.
const MAX_GROWTH: u32 = 5;

const SPACING_VALUES: usize = 60;

fn spacing_scale() -> serde_json::Value {
    let mut scale = serde_json::Map::new();
    for index in 0..SPACING_VALUES {
        scale.insert(index.to_string(), json!({ "value": format!("{index}px") }));
    }
    json!(scale)
}

fn config_with_containers(containers: usize) -> pandacss_config::UserConfig {
    let keys: Vec<String> = (0..SPACING_VALUES).map(|index| index.to_string()).collect();

    let mut scale = serde_json::Map::new();
    for index in 0..containers {
        let name = match index {
            0 => "sm".to_owned(),
            1 => "md".to_owned(),
            2 => "lg".to_owned(),
            3 => "xl".to_owned(),
            other => format!("c{other}"),
        };
        scale.insert(name, json!(format!("{}rem", 20 + index * 4)));
    }

    config(json!({
        "theme": {
            "containerNames": ["pb"],
            "containers": scale,
            "tokens": { "spacing": spacing_scale(), "sizes": spacing_scale() },
        },
        "staticCss": {
            "css": [{
                "responsive": false,
                "conditions": ["@pb/sm", "@pb/md", "@pb/lg", "@pb/xl"],
                "properties": {
                    "padding": keys.clone(),
                    "margin": keys.clone(),
                    "top": keys,
                },
            }],
        },
    }))
}

fn emit(containers: usize) -> (Duration, String) {
    let config = config_with_containers(containers);
    let start = Instant::now();
    let css = compile_css(&config, "export const noop = 1\n");
    (start.elapsed(), css)
}

#[test]
fn growing_the_container_scale_does_not_change_emit_cost() {
    // Warm up so allocator and branch-prediction effects land outside the timings.
    let _ = emit(4);
    let _ = emit(48);

    let (small_time, small_css) = emit(4);
    let (large_time, large_css) = emit(48);

    assert_eq!(
        small_css, large_css,
        "extra container sizes changed the emitted CSS; this guard assumes they do not"
    );

    assert!(
        large_time < small_time * MAX_GROWTH,
        "emitting the same rules took {large_time:?} with 48 container sizes vs {small_time:?} \
         with 4. Condition lookups are likely rebuilt per call again instead of resolved once \
         (see bench/staticcss-build-cost.md)"
    );
}
