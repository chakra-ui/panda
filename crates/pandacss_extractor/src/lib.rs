//! Oxc-based source extractor for Panda usages.

mod calls;
mod cross_file;
mod css_property;
mod css_template;
mod extract;
mod generated {
    pub(crate) mod css_properties;
}
mod imports;
mod jsx;
mod literal;
mod matcher;
mod scope;
mod source;

pub use calls::{ExtractedCall, ExtractedCallsResult, extract_calls};
pub use css_property::{css_property_names, is_css_property};
pub use extract::{ExtractDebugResult, ExtractUsage, extract, extract_debug};
pub use imports::{
    ImportKind, ImportRecord, ImportScanResult, ImportSpecifier, ImportSpecifierKind, scan_imports,
};
// Internal helpers that take Oxc-shaped inputs — kept out of the public
// surface so consumers don't accidentally couple to oxc_ast / oxc_diagnostics.
pub use cross_file::CrossFileResolver;
pub(crate) use imports::{collect_imports, collect_parser_diagnostics};
pub use jsx::{ExtractedJsx, ExtractedJsxResult, extract_jsx};
pub use literal::Literal;
pub use matcher::{
    ExtractorConfig, JsxExtractionConfig, JsxStyleProps, MatchCategory, MatchedImport, Matcher,
    Matchers, NameMatcher, TokenDictionary, match_import_records, match_imports,
};
pub use source::{SourceLocation, SourceRange};

// Internal-only: keep `VisitorContext` accessible to sibling modules but out
// of the public API.
pub(crate) use matcher::VisitorContext;
pub(crate) use scope::Resolver;
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
