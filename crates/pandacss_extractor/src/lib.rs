//! Oxc-based source extractor for Panda usages.
//!
//! Per file, one parse drives the pipeline: [`scan_imports`] reads imports →
//! [`match_imports`] matches them against the configured import map →
//! [`extract_calls`]/[`extract_jsx`] find `css()`/`cva()`/styled-prop usages →
//! the [`literal`] evaluator folds each argument to a static [`Literal`], using
//! [`scope`] for same-file identifier resolution and [`cross_file`] for
//! imported references. [`extract`] runs the whole thing; the individual
//! entrypoints exist for tooling and parity tests.

mod adapter;
mod calls;
mod cross_file;
mod css_template;
mod extract;
mod imports;
mod jsx;
mod literal;
mod matcher;
mod scope;
mod source;
mod svelte_adapter;
mod template_styles;
mod vue_adapter;

pub use calls::{ExtractedCall, ExtractedCallsResult, extract_calls};
pub use extract::{ExtractDebugResult, ExtractUsage, TokenRef, extract, extract_debug};
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
    CssSyntaxKind, ExtractorConfig, JsxExtractionConfig, JsxStyleProps, MatchCategory,
    MatchedImport, Matcher, Matchers, NameMatcher, TokenDictionary, match_import_records,
    match_imports,
};
pub use pandacss_shared::{
    Diagnostic, DiagnosticSeverity, SourceLocation, SourceRange, Span, diagnostic_codes,
};

// Internal-only: keep `VisitorContext` accessible to sibling modules but out
// of the public API.
pub(crate) use adapter::adapt_source;
pub(crate) use matcher::VisitorContext;
pub(crate) use scope::Resolver;
pub use source::LineIndex;

pub(crate) fn span_from_oxc(span: oxc_span::Span) -> Span {
    Span {
        start: span.start,
        end: span.end,
    }
}
