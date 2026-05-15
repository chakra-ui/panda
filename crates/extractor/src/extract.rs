use crate::calls::collect_calls;
use crate::jsx::collect_jsx;
use crate::{
    Diagnostic, ExtractedCall, ExtractedJsx, ImportRecord, MatchedImport, Matchers, VisitorContext,
    collect_imports, collect_parser_diagnostics, match_import_records,
};
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::Serialize;

#[derive(Debug, Clone, Default, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExtractResult {
    pub imports: Vec<ImportRecord>,
    pub matched: Vec<MatchedImport>,
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Single-parse entrypoint: scan → match → extract calls + JSX in one pass.
/// Prefer this over the staged `scan_imports` + `match_imports` +
/// `extract_calls` + `extract_jsx` for production use — those each re-parse
/// the source and are intended for testing/debugging individual stages.
#[must_use]
pub fn extract(source: &str, path: &str, matchers: &Matchers) -> ExtractResult {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parser_return = Parser::new(&allocator, source, source_type).parse();

    let imports = collect_imports(&parser_return.program);
    let diagnostics = collect_parser_diagnostics(&parser_return.errors);

    let matched = match_import_records(&imports, matchers);
    let ctx = VisitorContext::new(&matched, matchers);

    let calls = collect_calls(&parser_return.program, &ctx);
    let jsx = collect_jsx(&parser_return.program, &ctx);

    ExtractResult {
        imports,
        matched,
        calls,
        jsx,
        diagnostics,
    }
}
