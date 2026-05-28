//! NAPI boundary for the Panda Rust engine. Compiler logic lives in
//! `crates/pandacss_extractor`; this crate only mirrors core types into NAPI-shaped
//! structs and wires up the JS-facing functions.

mod cache;
mod calls;
mod compile;
mod convert;
mod extract;
mod imports;
mod jsx;
mod matcher;
mod project;
mod session;

pub use calls::{ExtractedCall, ExtractedCallsResult, extract_calls};
pub use compile::{CompileInput, CompileManifest, CompileOutput, InputFile, compile};
pub use extract::{ExtractDebugResult, ExtractResult, extract, extract_debug};
pub use imports::{
    ImportKind, ImportRecord, ImportScanResult, ImportSpecifier, ImportSpecifierKind, scan_imports,
};
pub use jsx::{ExtractedJsx, ExtractedJsxResult, extract_jsx};
pub use matcher::{
    MatchCategory, MatchedImport, Matcher, Matchers, TokenDictionary, match_imports,
};
pub use project::{ParseFileReport, Project, ProjectOptions, ProjectSummary, RecipeEntry};
pub use session::Extractor;

use napi_derive::napi;

// Shared cross-module types — submodules reach them via `crate::*`.

pub(crate) fn init_tracing() {
    pandacss_tracing::init_from_env();
}

pub(crate) fn flush_tracing() {
    pandacss_tracing::flush();
}

#[napi(object)]
pub struct TraceOptions {
    pub filter: Option<String>,
    pub output: Option<String>,
    pub file: Option<String>,
}

#[napi]
pub fn start_tracing(options: Option<TraceOptions>) -> bool {
    let config = match options {
        Some(options) => pandacss_tracing::TraceConfig::from_values(
            options.filter.as_deref().or(Some("trace")),
            options.output.as_deref(),
            options.file.as_deref(),
        ),
        None => pandacss_tracing::TraceConfig::from_env(),
    };

    let Some(config) = config else {
        return false;
    };

    pandacss_tracing::init(config)
}

#[napi(js_name = "flushTracing")]
pub fn flush_tracing_export() {
    pandacss_tracing::flush();
}

#[napi]
pub fn shutdown_tracing() -> bool {
    pandacss_tracing::shutdown()
}

#[napi(object)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

/// 1-indexed line, 1-indexed UTF-16 column (matches `tsc`/IDE output).
#[napi(object)]
pub struct SourceLocation {
    pub line: u32,
    pub column: u32,
}

#[napi(object)]
pub struct SourceRange {
    pub start: SourceLocation,
    pub end: SourceLocation,
}

#[napi(string_enum = "camelCase")]
pub enum DiagnosticSeverity {
    Info,
    Warning,
    Error,
}

#[napi(object)]
pub struct Diagnostic {
    pub code: String,
    pub message: String,
    pub severity: DiagnosticSeverity,
    /// UTF-8 byte offsets.
    pub span: Option<Span>,
    /// Human-readable line/column range covering `span`.
    pub location: Option<SourceRange>,
}

/// Tagged so a real `null` literal (`{ kind: "value", value: null }`) is
/// distinguishable from a non-foldable argument (`{ kind: "missing",
/// value: undefined }`). The previous `Array<unknown | null>` shape
/// collapsed those two cases.
#[napi(string_enum = "camelCase")]
pub enum ExtractedArgKind {
    Value,
    Missing,
}

#[napi(object)]
pub struct ExtractedArg {
    pub kind: ExtractedArgKind,
    pub value: Option<serde_json::Value>,
}

impl ExtractedArg {
    #[must_use]
    pub fn missing() -> Self {
        Self {
            kind: ExtractedArgKind::Missing,
            value: None,
        }
    }

    #[must_use]
    pub fn value(value: serde_json::Value) -> Self {
        Self {
            kind: ExtractedArgKind::Value,
            value: Some(value),
        }
    }
}

/// One atomic style declaration: `(prop, value, conditions)`. Returned by
/// `Project::atoms()`. Mirrors `pandacss_encoder::Atom` but with the
/// internal `Box<str>` Number form parsed back to a JS-native number.
#[napi(object)]
#[derive(Clone)]
pub struct Atom {
    pub prop: String,
    /// `string | number | boolean | null`.
    pub value: serde_json::Value,
    /// Outer-to-inner condition chain. Empty for unconditional atoms.
    pub conditions: Vec<String>,
}
