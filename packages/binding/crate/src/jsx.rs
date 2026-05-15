use crate::convert::{convert_diagnostic, to_core_matchers, to_jsx, to_matched};
use crate::{Diagnostic, MatchCategory, MatchedImport, Matchers, Span};
use napi_derive::napi;

#[napi(object)]
pub struct ExtractedJsx {
    pub category: MatchCategory,
    pub name: String,
    pub alias: String,
    pub data: serde_json::Value,
    pub span: Span,
}

#[napi(object)]
pub struct ExtractedJsxResult {
    pub jsx: Vec<ExtractedJsx>,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned arguments"
)]
pub fn extract_jsx(
    source: String,
    path: String,
    matched: Vec<MatchedImport>,
    matchers: Matchers,
) -> ExtractedJsxResult {
    let matched: Vec<extractor::MatchedImport> = matched.into_iter().map(to_matched).collect();
    let core_matchers = to_core_matchers(matchers);
    let result = extractor::extract_jsx(&source, &path, &matched, &core_matchers);
    ExtractedJsxResult {
        jsx: result.jsx.into_iter().map(to_jsx).collect(),
        diagnostics: result
            .diagnostics
            .into_iter()
            .map(convert_diagnostic)
            .collect(),
    }
}
