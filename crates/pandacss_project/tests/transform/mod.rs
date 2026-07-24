//! Integration tests for `pandacss_project` source transforms.
#![allow(
    clippy::needless_raw_string_hashes,
    reason = "fixture sources use a consistent raw-string style across the transformer suites"
)]
#![allow(
    clippy::needless_pass_by_value,
    reason = "test helpers optimize call-site readability over micro-optimizing argument passing"
)]
#![allow(
    clippy::doc_markdown,
    reason = "test-module docs mirror domain terms and fixture names rather than API reference prose"
)]
#![allow(
    clippy::format_push_string,
    reason = "fixture builders prioritize compact test setup over allocation-sensitive formatting"
)]

mod common;

mod advanced;
mod bailout;
mod conditional;
mod css_cases;
mod css_mixed;
mod edges;
mod helper;
mod import_cleanup;
mod jsx;
mod patterns;
mod recipe_inline;
mod recipes;
mod targets;
mod tokens;
#[allow(
    clippy::module_inception,
    reason = "core transform suite mirrors the crate's original tests/transform.rs filename"
)]
mod transform;
mod view_transition;
