use crate::convert::{convert_diagnostic, to_call, to_core_matchers, to_matched};
use crate::{Diagnostic, MatchCategory, MatchedImport, Matchers, Span};
use napi_derive::napi;

#[napi(object)]
pub struct ExtractedCall {
    pub category: MatchCategory,
    pub name: String,
    pub alias: String,
    pub data: Vec<serde_json::Value>,
    pub span: Span,
}

#[napi(object)]
pub struct ExtractedCallsResult {
    pub calls: Vec<ExtractedCall>,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn extract_calls(
    source: String,
    path: String,
    matched: Vec<MatchedImport>,
    matchers: Matchers,
) -> ExtractedCallsResult {
    let matched: Vec<extractor::MatchedImport> = matched.into_iter().map(to_matched).collect();
    let core_matchers = to_core_matchers(matchers);
    let result = extractor::extract_calls(&source, &path, &matched, &core_matchers);
    ExtractedCallsResult {
        calls: result.calls.into_iter().map(to_call).collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(convert_diagnostic)
            .collect(),
    }
}
