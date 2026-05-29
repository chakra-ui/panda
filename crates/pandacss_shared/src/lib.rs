//! Shared helpers used by Panda Rust crates.
//!
//! This crate intentionally stays at the bottom of the dependency graph:
//! no dependencies on other Panda crates.

pub mod diagnostic;
pub mod error;
pub mod hash;
pub mod important;
pub mod regex;
pub mod strings;

pub use diagnostic::{
    Diagnostic, DiagnosticSeverity, SourceLocation, SourceRange, Span, codes as diagnostic_codes,
};
pub use error::{PandaError, PandaResult};
pub use hash::to_hash;
pub use important::{is_important, split_important, without_important};
pub use regex::compile_js_regex;
pub use strings::{
    MAX_SAFE_INTEGER, capitalize, is_js_safe_integer, number_to_js_string, pascal_case,
    push_number_to_js_string,
};
