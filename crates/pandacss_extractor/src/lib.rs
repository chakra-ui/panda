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
mod design_system_imports;
mod export_names;
mod extract;
mod imports;
mod jsx;
mod jsx_react_runtime;
mod literal;
mod local_bindings;
mod matcher;
mod pure_fn;
mod scope;
mod source;
mod source_refs;
mod style_tree;
mod styled_bindings;
mod svelte_adapter;
mod template_styles;
mod transform_facts;
mod vue_adapter;

use pandacss_literal::Literal;

pub use calls::{CallCalleeKind, CallFacts, ExtractedCall, ExtractedCallsResult, extract_calls};
pub use design_system_imports::{
    DesignSystemImportSelection, DesignSystemPackageQuery, collect_design_system_imports,
    collect_design_system_imports_for_packages, selection_from_import_records,
};
pub use extract::{
    CrossFileDependency, ExtractDebugResult, ExtractUsage, ExtractVerboseResult,
    ImportBindingFacts, ImportedRecipeRawCall, ModuleFacts, TokenRef,
    UnresolvedCrossFileDependency, analyze_module, extract, extract_debug, extract_in_session,
    extract_transform, extract_transform_with_recipes, extract_verbose, extract_with_raw_resolvers,
    extract_with_raw_resolvers_in_session,
};
pub use imports::{
    ImportKind, ImportRecord, ImportScanResult, ImportSpecifier, ImportSpecifierKind,
    ScanImportsOptions, scan_imports, scan_imports_with,
};
pub use local_bindings::{LocalBindingCall, LocalCallBinding, LocalDeclarationKind};
// Internal helpers that take Oxc-shaped inputs — kept out of the public
// surface so consumers don't accidentally couple to oxc_ast / oxc_diagnostics.
pub use cross_file::{CrossFileResolver, CrossFileSession};
pub(crate) use export_names::collect_export_info;
pub use export_names::{ExportInfo, ReExport};
pub(crate) use imports::{collect_imports, collect_parser_diagnostics};
pub use jsx::{
    ExtractedJsx, ExtractedJsxResult, JsxAttr, JsxSourceFacts, JsxSourceKind, extract_jsx,
};
pub use matcher::{
    ExtractorConfig, JsxExtractionConfig, JsxKind, JsxStyleProps, MatchCategory, MatchedImport,
    Matcher, Matchers, NameMatcher, TokenDictionary, match_import_records,
    match_import_records_resolved, match_imports,
};
pub use pandacss_shared::{
    Diagnostic, DiagnosticLabel, DiagnosticSeverity, SourceLocation, SourceRange, Span,
    diagnostic_codes,
};
pub use style_tree::{
    StyleObject, StyleSpread, StyleTree, has_nested_spread_branches, project_literal,
    style_tree_has_open_local_value, style_tree_has_open_spread, style_tree_has_open_value,
    style_tree_has_rewrite_sites, style_tree_has_runtime_branch, style_tree_has_value_and,
    style_tree_is_open, style_tree_object_entry,
};
pub use transform_facts::{
    ConditionalExpressionFacts, ExpressionFacts, ExpressionKind, LogicalExpressionFacts,
    LogicalExpressionOperator, ObjectFacts, ObjectLiteralContext, ObjectPropertyFacts,
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
