use crate::convert::{
    convert_diagnostic, convert_record, matched_record, to_call, to_core_matchers, to_jsx,
};
use crate::{Diagnostic, ExtractedCall, ExtractedJsx, ImportRecord, MatchedImport, Matchers};
use napi_derive::napi;

/// Lean result returned by `extract()` — the production hot path. Strips
/// `imports` and `matched` so callers don't pay NAPI serialization cost for
/// debug-only data.
#[napi(object)]
pub struct ExtractResult {
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Full result returned by `extractDebug()` — includes `imports` (raw
/// import scan) and `matched` (Panda-filtered imports) for tooling, docs,
/// and parity-compare flows.
#[napi(object)]
pub struct ExtractDebugResult {
    pub imports: Vec<ImportRecord>,
    pub matched: Vec<MatchedImport>,
    pub calls: Vec<ExtractedCall>,
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn extract(source: String, path: String, matchers: Matchers) -> ExtractResult {
    let core_matchers = to_core_matchers(matchers);
    let result = extractor::extract(&source, &path, &core_matchers);
    ExtractResult {
        calls: result.calls.into_iter().map(to_call).collect(),
        jsx: result.jsx.into_iter().map(to_jsx).collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(convert_diagnostic)
            .collect(),
    }
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn extract_debug(source: String, path: String, matchers: Matchers) -> ExtractDebugResult {
    let core_matchers = to_core_matchers(matchers);
    let result = extractor::extract(&source, &path, &core_matchers);
    ExtractDebugResult {
        imports: result.imports.into_iter().map(convert_record).collect(),
        matched: result.matched.into_iter().map(matched_record).collect(),
        calls: result.calls.into_iter().map(to_call).collect(),
        jsx: result.jsx.into_iter().map(to_jsx).collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(convert_diagnostic)
            .collect(),
    }
}
