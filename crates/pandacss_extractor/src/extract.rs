//! Combined single-parse entrypoint: one Oxc parse feeds import scanning,
//! import-map matching, and both the call and JSX collectors, sharing a single
//! [`Resolver`]. [`extract`] returns the lean production result; `extract_debug`
//! additionally surfaces raw + matched imports for tooling/parity tests.

use crate::calls::collect_calls;
use crate::jsx::collect_jsx;
use crate::scope::Resolver;
use crate::{
    Diagnostic, ExtractedCall, ExtractedJsx, ExtractorConfig, ImportRecord, MatchCategory,
    MatchedImport, Span, VisitorContext, collect_imports, collect_parser_diagnostics,
    match_import_records,
};
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

/// A resolved `token()` / `token.var()` call site: the referenced token path and
/// its span. Token-call resolution lowers the call to its value/var, erasing the
/// path, so it is captured at resolution time for on-demand tooling (`usages`).
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TokenRef {
    pub path: String,
    pub span: Span,
}

/// Lean extraction result for the production hot path — strips `imports`
/// and `matched` so callers don't pay serialization cost for fields they
/// don't use.
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractUsage {
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
    /// `token()` call sites, captured for on-demand tooling. Not serialized —
    /// it never crosses the binding boundary and stays off the hot path's wire.
    #[serde(skip)]
    pub token_refs: Vec<TokenRef>,
}

/// Kitchen-sink extraction result — includes raw imports and matched
/// imports for tooling / parity-compare flows.
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractDebugResult {
    pub imports: Vec<ImportRecord>,
    pub matched: Vec<MatchedImport>,
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Single-parse, single-pass extract.
///
/// # Parse-error contract
///
/// Oxc recovers from parse errors and emits a partial AST; visitors run
/// on whatever it produces, so the result may carry extractions *and* a
/// non-empty `diagnostics` list at the same time. **`diagnostics` is the
/// authoritative signal** — callers needing strict correctness should
/// check `diagnostics.is_empty()` before trusting `calls` / `jsx`.
#[must_use]
pub fn extract(source: &str, path: &str, config: &ExtractorConfig) -> ExtractUsage {
    let _span =
        tracing::trace_span!("extraction", path = path, source_len = source.len()).entered();
    let outcome = run_extract(source, path, config);
    ExtractUsage {
        calls: outcome.calls,
        jsx: outcome.jsx,
        diagnostics: outcome.diagnostics,
        token_refs: outcome.token_refs,
    }
}

#[must_use]
pub fn extract_debug(source: &str, path: &str, config: &ExtractorConfig) -> ExtractDebugResult {
    let _span =
        tracing::trace_span!("extraction_debug", path = path, source_len = source.len()).entered();
    let outcome = run_extract(source, path, config);
    ExtractDebugResult {
        imports: outcome.imports,
        matched: outcome.matched,
        calls: outcome.calls,
        jsx: outcome.jsx,
        diagnostics: outcome.diagnostics,
    }
}

/// Everything the extraction pipeline produces. Public entrypoints project
/// this into their narrower result shape — the work is shared.
struct ExtractResult {
    imports: Vec<ImportRecord>,
    matched: Vec<MatchedImport>,
    calls: Vec<ExtractedCall>,
    jsx: Vec<ExtractedJsx>,
    diagnostics: Vec<Diagnostic>,
    token_refs: Vec<TokenRef>,
}

fn run_extract(source: &str, path: &str, config: &ExtractorConfig) -> ExtractResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = {
        let _span = tracing::trace_span!("oxc_parse", path = path).entered();
        Parser::new(&allocator, source, source_type).parse()
    };
    let mut diagnostics = collect_parser_diagnostics(&parser_return.errors, source);
    let imports = {
        let _span = tracing::trace_span!("collect_imports").entered();
        collect_imports(&parser_return.program)
    };
    let matched = {
        let _span = tracing::trace_span!("match_imports").entered();
        match_import_records(&imports, &config.matchers)
    };

    if should_skip_extraction(&matched, config) {
        return ExtractResult {
            imports,
            matched,
            calls: Vec::new(),
            jsx: Vec::new(),
            diagnostics,
            token_refs: Vec::new(),
        };
    }

    let line_index = crate::LineIndex::new(source);
    let resolver = {
        let _span = tracing::trace_span!("semantic_build").entered();
        Resolver::build(
            &parser_return.program,
            &matched,
            Some(&config.matchers),
            config.token_dictionary.as_deref(),
            config.cross_file.as_ref(),
            Some(std::path::PathBuf::from(path)),
            Some(&line_index),
        )
    };
    let ctx = VisitorContext::new(&matched, config).with_resolver(&resolver);

    let calls = if should_collect_calls(&matched) {
        let _span = tracing::trace_span!("visit_calls").entered();
        collect_calls(&parser_return.program, &ctx)
    } else {
        Vec::new()
    };
    let jsx = if should_collect_jsx(&matched, config) {
        let _span = tracing::trace_span!("visit_jsx").entered();
        collect_jsx(&parser_return.program, &ctx)
    } else {
        Vec::new()
    };

    diagnostics.extend(resolver.take_deprecations());
    let token_refs = resolver.take_token_refs();

    ExtractResult {
        imports,
        matched,
        calls,
        jsx,
        diagnostics,
        token_refs,
    }
}

fn should_collect_calls(matched: &[MatchedImport]) -> bool {
    !matched.is_empty()
}

fn should_skip_extraction(matched: &[MatchedImport], config: &ExtractorConfig) -> bool {
    matched.is_empty() && !config.jsx.has_component_matchers()
}

fn should_collect_jsx(matched: &[MatchedImport], config: &ExtractorConfig) -> bool {
    config.jsx.has_component_matchers()
        || matched
            .iter()
            .any(|import| import.category == MatchCategory::Jsx)
}
