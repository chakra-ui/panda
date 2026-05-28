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
pub use pandacss_shared::{
    Diagnostic, DiagnosticSeverity, SourceLocation, SourceRange, Span, diagnostic_codes,
};

// Internal-only: keep `VisitorContext` accessible to sibling modules but out
// of the public API.
pub(crate) use matcher::VisitorContext;
pub(crate) use scope::Resolver;
pub use source::LineIndex;

pub(crate) fn span_from_oxc(span: oxc_span::Span) -> Span {
    Span {
        start: span.start,
        end: span.end,
    }
}
