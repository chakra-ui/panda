//! `resolve_minify` / `resolve_polyfill` — shared by the NAPI and wasm
//! bindings so `UserConfig.extra` flag resolution can't drift between them.

use pandacss_stylesheet::{resolve_minify, resolve_polyfill};

use crate::common::config;

#[test]
fn minify_defaults_to_false_when_config_is_silent() {
    let config = config(serde_json::json!({}));
    assert!(!resolve_minify(&config, None));
}

#[test]
fn minify_reads_extra_flag_when_no_override_given() {
    let config = config(serde_json::json!({ "minify": true }));
    assert!(resolve_minify(&config, None));
}

#[test]
fn minify_override_wins_over_extra_flag_true() {
    let config = config(serde_json::json!({ "minify": true }));
    assert!(!resolve_minify(&config, Some(false)));
}

#[test]
fn minify_override_wins_over_extra_flag_absent() {
    let config = config(serde_json::json!({}));
    assert!(resolve_minify(&config, Some(true)));
}

#[test]
fn minify_ignores_non_boolean_extra_value() {
    let config = config(serde_json::json!({ "minify": "true" }));
    assert!(!resolve_minify(&config, None));
}

#[test]
fn polyfill_defaults_to_false_when_config_is_silent() {
    let config = config(serde_json::json!({}));
    assert!(!resolve_polyfill(&config, None));
}

#[test]
fn polyfill_reads_extra_flag_when_no_override_given() {
    let config = config(serde_json::json!({ "polyfill": true }));
    assert!(resolve_polyfill(&config, None));
}

#[test]
fn polyfill_override_wins_over_extra_flag_true() {
    let config = config(serde_json::json!({ "polyfill": true }));
    assert!(!resolve_polyfill(&config, Some(false)));
}

#[test]
fn polyfill_override_wins_over_extra_flag_absent() {
    let config = config(serde_json::json!({}));
    assert!(resolve_polyfill(&config, Some(true)));
}

#[test]
fn polyfill_ignores_non_boolean_extra_value() {
    let config = config(serde_json::json!({ "polyfill": 1 }));
    assert!(!resolve_polyfill(&config, None));
}
