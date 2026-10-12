use super::{
    Compiler, Diagnostic, ProjectSummary, ResolveUtilityValueInput, ResolvedUtilityValue,
    SourceEntry,
};

use napi::Env;
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
        let result = pandacss_compiler::inspect_file_source(self.inner.system(), &path, &source);
        serde_json::to_value(&result).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Collect dependencies of styles selected by fresh sources and configuration.
    ///
    /// # Errors
    /// Returns an error if the input or result cannot be serialized.
    #[napi(js_name = inspectUsageRequirements)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn inspect_usage_requirements(
        &mut self,
        env: Env,
        files: serde_json::Value,
    ) -> napi::Result<serde_json::Value> {
        let files: Vec<pandacss_compiler::UsageSource> = serde_json::from_value(files)
            .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        let mut project = self.inner.fork_empty();
        let cache = std::mem::take(&mut self.callbacks.transform_cache);
        for file in files {
            super::files::parse_project_source(
                &mut project,
                &mut self.callbacks,
                &env,
                &file.path,
                &file.source,
                None,
            );
        }
        let result = super::css::with_project_stylesheet_transforms(
            &mut project,
            &self.user_config,
            &mut self.callbacks,
            &env,
            pandacss_compiler::collect_usage_requirements,
        );
        self.callbacks.transform_cache = cache;
        serde_json::to_value(result).map_err(|err| napi::Error::from_reason(err.to_string()))
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
        let Some(value) = pandacss_literal::Literal::from_json_strict(&input.value) else {
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
            source: pandacss_compiler::utility_value_source_json(resolved.source),
            tokens: resolved.tokens,
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
        let suggestions: Vec<serde_json::Value> =
            pandacss_compiler::suggest_tokens(self.inner.system(), &prop, &value)
                .into_iter()
                .map(|suggestion| pandacss_compiler::token_suggestion_json(&suggestion))
                .collect();
        serde_json::Value::Array(suggestions)
    }

    /// Semantic tokens that carry the same value as a token path.
    #[napi(js_name = suggestSemanticTokens)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn suggest_semantic_tokens(&self, path: String) -> serde_json::Value {
        let suggestions: Vec<serde_json::Value> =
            pandacss_compiler::suggest_semantic_tokens(self.inner.system(), &path)
                .into_iter()
                .map(|suggestion| pandacss_compiler::token_suggestion_json(&suggestion))
                .collect();
        serde_json::Value::Array(suggestions)
    }

    /// Source globs + their static base dirs for the host watcher. `pattern` is
    /// relative to `base`, so `(base, pattern)` is a ready-to-use `(dir, glob)` pair.
    #[napi]
    #[must_use]
    pub fn sources(&self) -> Vec<SourceEntry> {
        pandacss_compiler::source_entries(&self.user_config, &self.paths)
            .into_iter()
            .map(|entry| SourceEntry {
                base: entry.base,
                pattern: entry.pattern,
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
