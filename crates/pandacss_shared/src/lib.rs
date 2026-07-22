//! Shared helpers for Panda Rust crates. Bottom of the dependency graph —
//! no dependencies on other Panda crates.

pub mod css_escape;
pub mod css_properties;
pub mod diagnostic;
pub mod error;
pub mod hash;
pub mod important;
pub mod regex;
pub mod strings;
pub mod unit_conversion;
pub mod view_transition;

pub use css_escape::css_escape;
pub use diagnostic::{
    Diagnostic, DiagnosticLabel, DiagnosticSeverity, SourceLocation, SourceRange, Span,
    codes as diagnostic_codes,
};
pub use error::{PandaError, PandaResult};
pub use hash::{compound_class_name, compound_combo_string, fx_hash, to_hash, without_space};
pub use important::{is_important, split_important, without_important};
pub use regex::compile_js_regex;
pub use strings::{
    MAX_SAFE_INTEGER, capitalize, closest_match, file_stem, find_matching_paren,
    hyphenate_property, is_js_safe_integer, js_ident, number_to_js_string, pascal_case,
    push_number_to_js_string,
};
pub use unit_conversion::to_rem;
pub use view_transition::{
    ViewTransitionStyle, filter_view_transition_slots, stable_stringify,
    stable_stringify_view_transition, view_transition_base_class, view_transition_class_name,
};
