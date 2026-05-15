//! Session-style extractor API.
//!
//! The free `extract()` / `extract_debug()` functions accept `Matchers`
//! by value and convert the inner token dictionary on every call. For a
//! Vite-style build extracting thousands of files against the same
//! design tokens, that rebuild cost adds up — O(tokens × files) extra
//! work for nothing.
//!
//! The [`Extractor`] class flips the trade-off: construct it once on
//! the JS side, hand it a `Matchers` config (including the resolved
//! token dictionary), then call `extract` / `extractDebug` per file.
//! The dictionary is built exactly once.
//!
//! This is the recommended path for production / batch extraction.
//! The free functions stay around for one-off CLI use and tests.

use napi_derive::napi;

use crate::convert::{
    convert_diagnostic, convert_record, matched_record, to_call, to_core_config, to_jsx,
};
use crate::extract::{ExtractDebugResult, ExtractResult};
use crate::imports::ImportScanResult;
use crate::matcher::to_core_record;
use crate::{MatchedImport, Matchers};

/// Reusable extractor handle. Owns a prebuilt `extractor::ExtractorConfig`
/// (matchers + resolved token dictionary) so per-file calls skip the
/// dictionary-rebuild step.
///
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
    /// Build the extractor once from a `Matchers` config. The token
    /// dictionary (if any) is materialized here so each subsequent
    /// `extract` call is a lean parse + visit, no rebuild.
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

    /// Single-pass extract over one source file. Returns the lean
    /// result shape (calls + jsx + diagnostics, no debug metadata).
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

    /// Full-detail extract: includes raw imports + matched imports
    /// alongside calls / jsx for tooling and parity-compare flows.
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

    /// Run the matched-imports filter without re-parsing. Uses the same
    /// `Matchers` config the session was built with.
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
