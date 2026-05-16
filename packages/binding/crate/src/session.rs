//! Session-style extractor API — the recommended path for batch /
//! production extraction.
//!
//! The free `extract()` / `extract_debug()` functions rebuild the token
//! dictionary on every call (O(tokens × files) overhead for nothing in
//! a Vite-style batch). [`Extractor`] flips the trade-off: build it once
//! from `Matchers`, then call `extract` / `extractDebug` per file with a
//! shared, pre-materialized `ExtractorConfig`. Free functions stay for
//! one-off CLI use and tests.

use napi_derive::napi;

use crate::convert::{
    convert_diagnostic, convert_record, matched_record, to_call, to_core_config, to_jsx,
};
use crate::extract::{ExtractDebugResult, ExtractResult};
use crate::imports::ImportScanResult;
use crate::matcher::to_core_record;
use crate::{MatchedImport, Matchers};

/// ```js
/// const extractor = new Extractor(matchers)
/// for (const file of files) {
///   const result = extractor.extract(file.source, file.path)
/// }
/// ```
#[napi]
pub struct Extractor {
    config: extractor::ExtractorConfig,
}

#[napi]
impl Extractor {
    /// Token dictionary (if any) is materialized once so each subsequent
    /// `extract` call is a lean parse + visit.
    #[napi(constructor)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned constructor arguments"
    )]
    pub fn new(matchers: Matchers) -> Self {
        Self {
            config: to_core_config(matchers),
        }
    }

    #[napi]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn extract(&self, source: String, path: String) -> ExtractResult {
        let result = extractor::extract(&source, &path, &self.config);
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
    pub fn extract_debug(&self, source: String, path: String) -> ExtractDebugResult {
        let result = extractor::extract_debug(&source, &path, &self.config);
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

    /// Run the matched-imports filter without re-parsing. Uses the
    /// session's `Matchers` config.
    #[napi]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn match_imports(&self, scan: ImportScanResult) -> Vec<MatchedImport> {
        let records: Vec<extractor::ImportRecord> =
            scan.imports.into_iter().map(to_core_record).collect();
        extractor::match_import_records(&records, &self.config.matchers)
            .into_iter()
            .map(matched_record)
            .collect()
    }
}
