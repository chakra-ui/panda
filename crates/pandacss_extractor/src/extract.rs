use crate::calls::collect_calls;
use crate::jsx::collect_jsx;
use crate::scope::Resolver;
use crate::{
    Diagnostic, ExtractedCall, ExtractedJsx, ExtractorConfig, ImportRecord, MatchCategory,
    MatchedImport, VisitorContext, collect_imports, collect_parser_diagnostics,
    match_import_records,
};
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

/// Lean extraction result for the production hot path — strips `imports`
/// and `matched` so callers don't pay serialization cost for fields they
/// don't use.
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractUsage {
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
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
    let extraction_span =
        tracing::trace_span!("extraction", path = path, source_len = source.len()).entered();
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = {
        let _span = tracing::trace_span!("oxc_parse", path = path).entered();
        Parser::new(&allocator, source, source_type).parse()
    };

    let imports = collect_imports(&parser_return.program);
    let diagnostics = collect_parser_diagnostics(&parser_return.errors, source);
    let matched = match_import_records(&imports, &config.matchers);

    if should_skip_extraction(&matched, config) {
        drop(extraction_span);
        return ExtractUsage {
            calls: Vec::new(),
            jsx: Vec::new(),
            diagnostics,
        };
    }

    let resolver = Resolver::build(
        &parser_return.program,
        &matched,
        Some(&config.matchers),
        config.token_dictionary.as_deref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = VisitorContext::new(&matched, config).with_resolver(&resolver);

    let calls = if should_collect_calls(&matched) {
        collect_calls(&parser_return.program, &ctx)
    } else {
        Vec::new()
    };
    let jsx = if should_collect_jsx(&matched, config) {
        collect_jsx(&parser_return.program, &ctx)
    } else {
        Vec::new()
    };

    ExtractUsage {
        calls,
        jsx,
        diagnostics,
    }
}

#[must_use]
pub fn extract_debug(source: &str, path: &str, config: &ExtractorConfig) -> ExtractDebugResult {
    let _span =
        tracing::trace_span!("extraction_debug", path = path, source_len = source.len()).entered();
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = {
        let _span = tracing::trace_span!("oxc_parse", path = path).entered();
        Parser::new(&allocator, source, source_type).parse()
    };

    let imports = collect_imports(&parser_return.program);
    let diagnostics = collect_parser_diagnostics(&parser_return.errors, source);
    let matched = match_import_records(&imports, &config.matchers);

    if should_skip_extraction(&matched, config) {
        return ExtractDebugResult {
            imports,
            matched,
            calls: Vec::new(),
            jsx: Vec::new(),
            diagnostics,
        };
    }

    let resolver = Resolver::build(
        &parser_return.program,
        &matched,
        Some(&config.matchers),
        config.token_dictionary.as_deref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = VisitorContext::new(&matched, config).with_resolver(&resolver);

    let calls = if should_collect_calls(&matched) {
        collect_calls(&parser_return.program, &ctx)
    } else {
        Vec::new()
    };
    let jsx = if should_collect_jsx(&matched, config) {
        collect_jsx(&parser_return.program, &ctx)
    } else {
        Vec::new()
    };

    ExtractDebugResult {
        imports,
        matched,
        calls,
        jsx,
        diagnostics,
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
