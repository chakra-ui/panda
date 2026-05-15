//! Oxc-based source extractor for Panda usages.

mod calls;
mod extract;
mod imports;
mod jsx;
mod literal;
mod matcher;
mod source;

pub use calls::{ExtractedCall, ExtractedCallsResult, extract_calls};
pub use extract::{ExtractResult, extract};
pub use imports::{
    ImportKind, ImportRecord, ImportScanResult, ImportSpecifier, ImportSpecifierKind,
    collect_imports, collect_parser_diagnostics, scan_imports,
};
pub use jsx::{ExtractedJsx, ExtractedJsxResult, extract_jsx};
pub use literal::Literal;
pub use matcher::{
    MatchCategory, MatchedImport, Matcher, Matchers, NameMatcher, match_import_records,
    match_imports,
};
pub use source::{SourceLocation, SourceRange};

// Internal-only: keep `VisitorContext` accessible to sibling modules but out
// of the public API.
pub(crate) use matcher::VisitorContext;
pub(crate) use source::LineIndex;

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
    /// UTF-8 byte offsets. Useful for slicing the source. `None` when the
    /// underlying error didn't attribute a location.
    pub span: Option<Span>,
    /// Human-readable line/column range covering the same offsets as `span`.
    /// 1-indexed line, 1-indexed UTF-16 column — matches `tsc`/IDE output.
    pub location: Option<SourceRange>,
}
