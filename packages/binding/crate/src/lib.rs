//! NAPI boundary for the Panda Rust engine. Compiler logic lives in
//! `crates/extractor`; this crate only mirrors core types into NAPI-shaped
//! structs and wires up the JS-facing functions.

mod calls;
mod compile;
mod convert;
mod extract;
mod imports;
mod jsx;
mod matcher;
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
pub use session::Extractor;

use napi_derive::napi;

// Shared cross-module types live here so every submodule can refer to them
// via `crate::*`.

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
    pub message: String,
    pub severity: DiagnosticSeverity,
    /// UTF-8 byte offsets.
    pub span: Option<Span>,
    /// Human-readable line/column range covering `span`.
    pub location: Option<SourceRange>,
}

/// Tagged shape for one extracted call argument. Disambiguates a real
/// `null` literal (`kind: "value", value: null`) from a non-extractable
/// argument (`kind: "missing", value: undefined`) — the previous shape
/// `Array<unknown | null>` collapsed those two cases.
#[napi(string_enum = "camelCase")]
pub enum ExtractedArgKind {
    /// The argument folded to a literal. `value` is the folded JSON
    /// (which may itself be `null` for a literal `null`).
    Value,
    /// The argument was present in the source but not statically
    /// foldable (identifier without resolution, function call, etc.).
    /// `value` is `undefined`.
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
