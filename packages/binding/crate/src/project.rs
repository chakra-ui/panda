//! NAPI `Project` — JS-facing wrapper around `pandacss_project::PandaProject`.
//!
//! Stateful project orchestration. Holds a per-file atom registry, drops a
//! file's contribution on `removeFile` / `refreshFile`, runs the encoder over
//! every extracted style so callers see `Atom[]` directly (not raw
//! `ExtractedCall` records — for that, use `Extractor`).

use napi_derive::napi;

use crate::convert::{convert_diagnostic, to_atoms, to_core_matchers, to_core_token_dictionary};
use crate::{Diagnostic, Matchers, TokenDictionary};

/// Per-call telemetry from `parseFile`. Mirrors `pandacss_project::FileReport`.
#[napi(object)]
pub struct FileReport {
    pub css_calls: u32,
    pub cva_calls: u32,
    pub sva_calls: u32,
    pub jsx_usages: u32,
    pub diagnostics: Vec<Diagnostic>,
}

/// Aggregate counts across the project. Cheap; doesn't recompute anything.
#[napi(object)]
pub struct ProjectSummary {
    pub files_processed: u32,
    pub atom_count: u32,
    pub recipe_count: u32,
    pub slot_recipe_count: u32,
}

/// Optional project-construction inputs.
#[napi(object)]
pub struct ProjectOptions {
    pub token_dictionary: Option<TokenDictionary>,
    /// When `true` (default), construct a `CrossFileResolver` over the
    /// native filesystem. Set to `false` to disable cross-file folding.
    pub cross_file: Option<bool>,
}

/// One `(file, span_start, value)` entry for the recipe and slot-recipe
/// iterators. `value` is the serialized recipe shape (matches
/// `pandacss_recipes::Recipe` / `SlotRecipe`).
#[napi(object)]
pub struct RecipeEntry {
    pub file: String,
    pub span_start: u32,
    pub recipe: serde_json::Value,
}

#[napi]
pub struct Project {
    inner: pandacss_project::PandaProject,
}

#[napi]
impl Project {
    /// Construct a project bound to a matchers config. Cross-file folding
    /// is enabled by default.
    #[napi(constructor)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned constructor arguments"
    )]
    pub fn new(matchers: Matchers, options: Option<ProjectOptions>) -> Self {
        let opts = options.unwrap_or(ProjectOptions {
            token_dictionary: None,
            cross_file: None,
        });
        let mut project = pandacss_project::PandaProject::new(to_core_matchers(matchers));
        if let Some(dict) = opts.token_dictionary.map(to_core_token_dictionary) {
            project = project.with_token_dictionary(dict);
        }
        if opts.cross_file.unwrap_or(true) {
            project = project.with_cross_file(pandacss_extractor::CrossFileResolver::new());
        }
        Self { inner: project }
    }

    /// Extract + encode a single file. Re-parsing a path replaces its prior
    /// contribution (atoms, recipes, diagnostics) — safe for watch mode.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file(&mut self, path: String, source: String) -> FileReport {
        let report = self.inner.parse_file(&path, &source);
        FileReport {
            css_calls: u32::try_from(report.css_calls).unwrap_or(u32::MAX),
            cva_calls: u32::try_from(report.cva_calls).unwrap_or(u32::MAX),
            sva_calls: u32::try_from(report.sva_calls).unwrap_or(u32::MAX),
            jsx_usages: u32::try_from(report.jsx_usages).unwrap_or(u32::MAX),
            diagnostics: report.diagnostics.into_iter().map(convert_diagnostic).collect(),
        }
    }

    /// Re-parse a path *only if* it is already known to the project.
    /// Returns `true` if the path was present and got re-parsed; `false`
    /// if the path is unknown (no-op). Watch-mode contract.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn refresh_file(&mut self, path: String, source: String) -> bool {
        self.inner.refresh_file(&path, &source)
    }

    /// Drop a file's contribution. Returns `true` if the path was known.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn remove_file(&mut self, path: String) -> bool {
        self.inner.remove_file(&path)
    }

    /// Drop every path's state. Keeps the matchers / token dictionary /
    /// cross-file resolver intact.
    #[napi]
    pub fn clear(&mut self) {
        self.inner.clear();
    }

    /// Deduplicated atoms across every currently-known file. Sorted by
    /// `(prop, conditions, value)` for stable iteration / snapshot tests.
    #[napi]
    #[must_use]
    pub fn atoms(&self) -> Vec<crate::Atom> {
        to_atoms(self.inner.atoms())
    }

    /// Every `cva()` recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn recipes(&self) -> Vec<RecipeEntry> {
        self.inner
            .recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect()
    }

    /// Every `sva()` slot recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn slot_recipes(&self) -> Vec<RecipeEntry> {
        self.inner
            .slot_recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
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
