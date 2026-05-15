//! Oxc-based source extractor for Panda usages.

mod calls;
mod extract;
mod imports;
mod jsx;
mod literal;
mod matcher;

pub use calls::{ExtractedCall, ExtractedCallsResult, extract_calls};
pub use extract::{ExtractResult, extract};
pub use imports::{
    ImportKind, ImportRecord, ImportScanResult, ImportSpecifier, ImportSpecifierKind,
    collect_imports, collect_parser_diagnostics, scan_imports,
};
pub use jsx::{ExtractedJsx, ExtractedJsxResult, extract_jsx};
pub use matcher::{
    MatchCategory, MatchedImport, Matcher, Matchers, NameMatcher, match_import_records,
    match_imports,
};

// Internal-only: keep `VisitorContext` accessible to sibling modules but out
// of the public API.
pub(crate) use matcher::VisitorContext;

use oxc_span::Span as OxcSpan;
use serde::Serialize;

/// UTF-8 byte offsets, matching `oxc_span::Span`.
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

impl From<OxcSpan> for Span {
    fn from(span: OxcSpan) -> Self {
        Self {
            start: span.start,
            end: span.end,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub message: String,
    pub severity: DiagnosticSeverity,
    pub span: Option<Span>,
}
