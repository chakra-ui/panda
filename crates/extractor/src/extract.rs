use crate::calls::collect_calls;
use crate::jsx::collect_jsx;
use crate::scope::Resolver;
use crate::{
    Diagnostic, ExtractedCall, ExtractedJsx, ExtractorConfig, ImportRecord, MatchedImport,
    VisitorContext, collect_imports, collect_parser_diagnostics, match_import_records,
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
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let imports = collect_imports(&parser_return.program);
    let diagnostics = collect_parser_diagnostics(&parser_return.errors, source);
    let matched = match_import_records(&imports, &config.matchers);

    // PERF(port): fast path — no Panda imports means no extractable calls
    // or JSX (the JSX visitor needs styled/Box/pattern imports matched
    // first). Skip the resolver build and both visitor walks entirely.
    // Parse diagnostics still flow through because they're independent
    // of Panda usage.
    if matched.is_empty() {
        return ExtractUsage {
            calls: Vec::new(),
            jsx: Vec::new(),
            diagnostics,
        };
    }

    let resolver = Resolver::build(
        &parser_return.program,
        &matched,
        config.token_dictionary.as_ref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = VisitorContext::new(&matched, &config.matchers).with_resolver(&resolver);

    let calls = collect_calls(&parser_return.program, &ctx);
    let jsx = collect_jsx(&parser_return.program, &ctx);

    ExtractUsage {
        calls,
        jsx,
        diagnostics,
    }
}

#[must_use]
pub fn extract_debug(source: &str, path: &str, config: &ExtractorConfig) -> ExtractDebugResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let imports = collect_imports(&parser_return.program);
    let diagnostics = collect_parser_diagnostics(&parser_return.errors, source);
    let matched = match_import_records(&imports, &config.matchers);

    let resolver = Resolver::build(
        &parser_return.program,
        &matched,
        config.token_dictionary.as_ref(),
        config.cross_file.as_ref(),
        Some(std::path::PathBuf::from(path)),
    );
    let ctx = VisitorContext::new(&matched, &config.matchers).with_resolver(&resolver);

    let calls = collect_calls(&parser_return.program, &ctx);
    let jsx = collect_jsx(&parser_return.program, &ctx);

    ExtractDebugResult {
        imports,
        matched,
        calls,
        jsx,
        diagnostics,
    }
}
