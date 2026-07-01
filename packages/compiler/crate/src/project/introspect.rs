use super::interop::{json_value_to_literal, resolve_base, utility_value_source_to_json};
use super::{
    Compiler, Diagnostic, ProjectSummary, ResolveUtilityValueInput, ResolvedUtilityValue,
    SourceEntry,
};

use napi_derive::napi;

#[napi]
impl Compiler {
    /// Stateless source inspection for tooling (reporting, lint, IDE). Returns
    /// classified Panda usage sites plus file-local extraction diagnostics.
    ///
    /// # Errors
    /// Returns an error if the result fails to serialize.
    #[napi(js_name = inspectFileSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn inspect_file_source(
        &self,
        path: String,
        source: String,
    ) -> napi::Result<serde_json::Value> {
        let result = self.inner.inspect_file_source(&path, &source);
        serde_json::to_value(&result).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Resolve selector and CSS metadata for one utility value.
    ///
    /// # Errors
    /// Returns an error if the value cannot be represented by the extractor
    /// literal model.
    #[napi(js_name = resolveUtilityValue)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn resolve_utility_value(
        &self,
        input: ResolveUtilityValueInput,
    ) -> napi::Result<Option<ResolvedUtilityValue>> {
        let Some(value) = json_value_to_literal(&input.value) else {
            return Err(napi::Error::from_reason(
                "resolveUtilityValue() requires a JSON-serializable value",
            ));
        };

        let Some(resolved) = self.inner.resolve_utility_value(&input.prop, &value) else {
            return Ok(None);
        };

        Ok(Some(ResolvedUtilityValue {
            utility: resolved.utility,
            class_name: resolved.class_name,
            css_value: resolved.css_value.to_json(),
            important: resolved.important,
            source: utility_value_source_to_json(resolved.source),
        }))
    }

    /// Tokens that carry a hardcoded value, ranked (safe equivalents first).
    /// Empty when nothing matches. The rule lists these for the developer.
    #[napi(js_name = suggestTokens)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn suggest_tokens(&self, prop: String, value: String) -> serde_json::Value {
        let suggestions: Vec<serde_json::Value> = self
            .inner
            .suggest_tokens(&prop, &value)
            .into_iter()
            .map(|suggestion| {
                serde_json::json!({
                    "token": suggestion.token,
                    "semantic": suggestion.semantic,
                    "conditional": suggestion.conditional,
                })
            })
            .collect();
        serde_json::Value::Array(suggestions)
    }

    /// Source globs + their static base dirs for the host watcher. `pattern` is
    /// relative to `base`, so `(base, pattern)` is a ready-to-use `(dir, glob)` pair.
    #[napi]
    #[must_use]
    pub fn sources(&self) -> Vec<SourceEntry> {
        self.user_config
            .include
            .iter()
            .map(|pattern| SourceEntry {
                base: resolve_base(&self.user_config.cwd, pattern),
                pattern: pandacss_fs::relative_glob(pattern).to_owned(),
            })
            .collect()
    }

    /// Config validation diagnostics from construction. Per-file and
    /// compile diagnostics live on [`ParseFileReport`] / [`CompileOutput`].
    #[napi]
    #[must_use]
    pub fn diagnostics(&self) -> Vec<Diagnostic> {
        self.inner
            .diagnostics()
            .iter()
            .cloned()
            .map(crate::convert::convert_diagnostic)
            .collect()
    }

    /// Aggregate counts.
    #[napi]
    #[must_use]
    pub fn summary(&self) -> ProjectSummary {
        let s = self.inner.summary();
        ProjectSummary {
            files_processed: u32::try_from(s.files_processed).unwrap_or(u32::MAX),
            atom_count: u32::try_from(s.atom_count).unwrap_or(u32::MAX),
            recipe_count: u32::try_from(s.recipe_count).unwrap_or(u32::MAX),
            slot_recipe_count: u32::try_from(s.slot_recipe_count).unwrap_or(u32::MAX),
        }
    }
}
