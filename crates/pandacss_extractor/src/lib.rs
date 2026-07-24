//! Oxc-based source extractor for Panda usages.
//!
//! Per file, one parse drives the pipeline: [`scan_imports`] reads imports →
//! [`match_imports`] matches them against the configured import map →
//! [`extract_calls`]/[`extract_jsx`] find `css()`/`cva()`/styled-prop usages →
//! style objects fold through [`style_tree`] (encode `data` via [`project_literal`]),
//! with [`literal`] for token/pure-fn/leaf fallback and non-style contexts, using
//! [`scope`] for same-file identifier resolution and [`cross_file`] for imported
//! references. [`extract`] runs the whole thing; the individual entrypoints exist
//! for tooling and parity tests.

mod adapter;
mod astro_adapter;
mod calls;
mod cross_file;
mod css_template;
mod design_system_imports;
mod export_names;
mod extract;
mod fragment;
mod imports;
mod jsx;
mod jsx_react_runtime;
mod literal;
mod matcher;
mod pure_fn;
mod scope;
mod source;
mod source_refs;
mod style_tree;
mod svelte_adapter;
mod template_styles;
mod transform_facts;
mod vue_adapter;

pub use calls::{
    CallCalleeKind, CallFacts, CallSyntax, ExtractedCall, ExtractedCallsResult, extract_calls,
};
pub use design_system_imports::{
    DesignSystemImportSelection, DesignSystemPackageQuery, collect_design_system_imports,
    collect_design_system_imports_for_packages, selection_from_import_records,
};
pub use extract::{
    ExtractDebugResult, ExtractUsage, ExtractVerboseResult, ImportBindingFacts, ModuleFacts,
    TokenRef, analyze_module, extract, extract_debug, extract_for_transform, extract_verbose,
    extract_with_pattern_raw_transform,
};
pub use imports::{
    ImportKind, ImportRecord, ImportScanResult, ImportSpecifier, ImportSpecifierKind,
    ScanImportsOptions, scan_imports, scan_imports_with,
};
// Internal helpers that take Oxc-shaped inputs — kept out of the public
// surface so consumers don't accidentally couple to oxc_ast / oxc_diagnostics.
pub use cross_file::CrossFileResolver;
pub(crate) use export_names::collect_export_info;
pub use export_names::{ExportInfo, ReExport};
pub use fragment::{
    FragmentCall, FragmentLogicalAnd, FragmentLogicalOrNullish, FragmentProperty, FragmentTernary,
    LogicalOrNullishOp, is_logical_expression, parse_call_fragment, parse_logical_and_fragment,
    parse_logical_or_nullish_fragment, parse_object_fragment, parse_ternary_fragment,
};
pub(crate) use imports::{collect_imports, collect_parser_diagnostics};
pub use jsx::{
    ExtractedJsx, ExtractedJsxResult, JsxAttr, JsxSourceFacts, JsxSourceKind, extract_jsx,
};
pub use literal::Literal;
pub use matcher::{
    CssSyntaxKind, ExtractorConfig, JsxExtractionConfig, JsxKind, JsxStyleProps, MatchCategory,
    MatchedImport, Matcher, Matchers, NameMatcher, TokenDictionary, match_import_records,
    match_import_records_resolved, match_imports,
};
pub use pandacss_shared::{
    Diagnostic, DiagnosticLabel, DiagnosticSeverity, SourceLocation, SourceRange, Span,
    diagnostic_codes,
};
pub use style_tree::{StyleObject, StyleSpread, StyleTree, project_literal};
pub use transform_facts::{
    ConditionalExpressionFacts, ExpressionFacts, ExpressionKind, LogicalExpressionFacts,
    LogicalExpressionOperator, ObjectFacts, ObjectPropertyFacts,
};

// Internal-only: keep `VisitorContext` accessible to sibling modules but out
// of the public API.
pub(crate) use adapter::adapt_source;
pub(crate) use matcher::VisitorContext;
pub(crate) use scope::Resolver;
pub use source::LineIndex;
pub use source_refs::{StyleSourceOwner, StyleSourceOwnerKind, StyleSourceRef};

pub(crate) fn span_from_oxc(span: oxc_span::Span) -> Span {
    Span {
        start: span.start,
        end: span.end,
    }
}
