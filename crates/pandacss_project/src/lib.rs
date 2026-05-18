//! High-level project façade — the recommended entry point for Rust
//! consumers and the binding layer.
//!
//! `Project` ties the lower-level pieces (extractor, recipes, encoder)
//! into a single stateful object you feed source files to. Each
//! `parse_file` call extracts usages, decomposes any `cva()` / `sva()`
//! recipes, and feeds the resulting style objects into a shared atomic
//! encoder. [`Project::atoms`] returns the deduplicated set the
//! emitter consumes; the global view is always the union of every
//! currently-known file, so removed or replaced files never leave ghost
//! atoms in watch mode.
//!
//! ```rust,ignore
//! use pandacss_project::Project;
//! use pandacss_extractor::{Matchers, Matcher, NameMatcher};
//!
//! let matchers = Matchers {
//!     css: Matcher {
//!         modules: vec!["@panda/css".into()],
//!         names: NameMatcher::only(["css", "cva", "sva"]),
//!     },
//!     ..Default::default()
//! };
//!
//! let mut project = Project::from_matchers(matchers);
//! project.parse_file("button.tsx", "import {{ css }} from '@panda/css'; css({{ color: 'red' }});");
//! project.parse_file("card.tsx", /* … */);
//!
//! let atoms = project.atoms();          // deduped across both files
//! let recipes = project.recipes();      // every cva/sva encountered
//! let summary = project.summary();      // counts for tooling / reporting
//! ```

mod conditions;
mod config;
mod error;
mod parsed_file;
mod patterns;
mod recipes;
mod system;

use std::borrow::Cow;
use std::collections::BTreeMap;
use std::hash::{Hash, Hasher};
use std::sync::Arc;

use rustc_hash::{FxHashMap, FxHashSet, FxHasher};
use smallvec::SmallVec;

use pandacss_config::Config;
use pandacss_encoder::{Atom, Encoder};
use pandacss_extractor::{
    CrossFileResolver, ExtractorConfig, Literal, MatchCategory, Matchers, extract,
};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_utility::StyleNormalizer;

pub(crate) use conditions::ProjectConditionMatcher;
pub use error::{ConfigError, Result};
pub use parsed_file::ParsedFile;
use recipes::EncodedRecipesCache;
pub use recipes::{
    EncodedRecipes, EncodedRecipesSnapshot, RecipeStyleEntry, RecipeStyleGroup,
    RecipeStyleGroupSnapshot,
};
pub use system::System;

/// One project. Hold one per build / dev-server session and feed
/// every file through `parse_file`.
pub struct Project {
    system: Arc<System>,
    files: FxHashMap<Arc<str>, FileEntry>,
    /// Deduplicated union of every value in `files`. Updated by reference
    /// counts on add/remove so [`Self::atoms`] hands out a stable
    /// `&FxHashSet` without walking the whole project on each save.
    atoms_cache: FxHashSet<Atom>,
    atom_counts: FxHashMap<Atom, u32>,
    encoded_recipes_cache: EncodedRecipesCache,
    /// Recipes keyed by `(file, span)` so re-parsing a path drops every
    /// matching entry and span shifts don't leave orphans.
    config_recipes: BTreeMap<RecipeKey, Recipe>,
    config_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    inline_recipes: BTreeMap<RecipeKey, Recipe>,
    inline_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    inline_recipe_spans: FxHashMap<Arc<str>, SmallVec<[u32; 4]>>,
    inline_slot_recipe_spans: FxHashMap<Arc<str>, SmallVec<[u32; 4]>>,
}

// Private so the bucket shape (cached LineIndex, structured stats, …) can
// change without disturbing callers — [`ParsedFile`] is the public view.
struct FileEntry {
    source_hash: u64,
    atoms: FxHashSet<Atom>,
    encoded_recipes: EncodedRecipes,
    diagnostics: Vec<Diagnostic>,
    report: ParseFileReport,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct RecipeKey {
    pub(crate) file: Arc<str>,
    pub(crate) span_start: u32,
}

impl Project {
    #[must_use]
    pub fn new(system: System) -> Self {
        Self::from_system(system)
    }

    #[must_use]
    pub fn from_system(system: System) -> Self {
        let config_recipes = system.config_recipes.clone();
        let config_slot_recipes = system.config_slot_recipes.clone();
        Self {
            system: Arc::new(system),
            files: FxHashMap::default(),
            atoms_cache: FxHashSet::default(),
            atom_counts: FxHashMap::default(),
            encoded_recipes_cache: EncodedRecipesCache::default(),
            config_recipes,
            config_slot_recipes,
            inline_recipes: BTreeMap::new(),
            inline_slot_recipes: BTreeMap::new(),
            inline_recipe_spans: FxHashMap::default(),
            inline_slot_recipe_spans: FxHashMap::default(),
        }
    }

    pub fn from_config(config: Config) -> Result<Self> {
        Ok(Self::from_system(System::new(config)?))
    }

    #[must_use]
    pub fn from_matchers(matchers: Matchers) -> Self {
        Self::from_extractor_config(ExtractorConfig::new(matchers))
    }

    #[must_use]
    pub fn from_extractor_config(extractor_config: ExtractorConfig) -> Self {
        Self::from_system(System::from_extractor_config(extractor_config))
    }

    #[must_use]
    pub fn with_cross_file(mut self, resolver: CrossFileResolver) -> Self {
        Arc::get_mut(&mut self.system)
            .expect("project system is uniquely owned during construction")
            .extractor_config
            .cross_file = Some(resolver);
        self
    }

    /// Extract usages, decompose recipes, encode atoms into the per-file
    /// bucket. Re-parsing a path *replaces* the previous bucket (atoms
    /// and recipes) so stale styles can't linger in watch mode.
    pub fn parse_file(&mut self, path: &str, source: &str) -> ParseFileReport {
        self.parse_file_inner(path, source, None)
    }

    pub fn parse_file_with_pattern_transforms(
        &mut self,
        path: &str,
        source: &str,
        transform: &mut PatternTransformFn<'_>,
    ) -> ParseFileReport {
        self.parse_file_inner(path, source, Some(transform))
    }

    fn parse_file_inner(
        &mut self,
        path: &str,
        source: &str,
        mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> ParseFileReport {
        let source_hash = hash_source(source);
        if pattern_transform.is_none()
            && self
                .files
                .get(path)
                .is_some_and(|entry| entry.source_hash == source_hash)
        {
            return self.files.get(path).expect("checked above").report.clone();
        }

        let result = extract(source, path, &self.system.extractor_config);
        let diagnostics = result.diagnostics;
        let mut report = ParseFileReport {
            css_calls: 0,
            cva_calls: 0,
            sva_calls: 0,
            jsx_usages: 0,
            diagnostics: diagnostics.clone(),
        };

        // Drop the previous contribution first; otherwise removed styles
        // survive as ghost atoms in the global view.
        self.drop_file_state(path);
        let path_key: Arc<str> = Arc::from(path);

        let mut encoder = Encoder::with_conditions(self.system.conditions.clone());
        let mut encoded_recipes = EncodedRecipes::default();
        let empty_object = Literal::Object(Vec::new());
        for call in result.calls {
            let arg = call.data.into_iter().next().flatten();
            match (call.category, call.name.as_str()) {
                (MatchCategory::Css, "css") => {
                    let Some(arg) = arg else {
                        continue;
                    };
                    self.process_atomic(&mut encoder, &arg);
                    report.css_calls += 1;
                }
                (MatchCategory::Css, "cva") => {
                    let Some(arg) = arg else {
                        continue;
                    };
                    if let Some(recipe) = Recipe::from_literal_owned(arg) {
                        encoder.process_atomic_recipe(&recipe);
                        self.inline_recipes.insert(
                            RecipeKey {
                                file: Arc::clone(&path_key),
                                span_start: call.span.start,
                            },
                            recipe,
                        );
                        self.inline_recipe_spans
                            .entry(Arc::clone(&path_key))
                            .or_default()
                            .push(call.span.start);
                        report.cva_calls += 1;
                    }
                }
                (MatchCategory::Css, "sva") => {
                    let Some(arg) = arg else {
                        continue;
                    };
                    if let Some(recipe) = SlotRecipe::from_literal_owned(arg) {
                        encoder.process_atomic_slot_recipe(&recipe);
                        self.inline_slot_recipes.insert(
                            RecipeKey {
                                file: Arc::clone(&path_key),
                                span_start: call.span.start,
                            },
                            recipe,
                        );
                        self.inline_slot_recipe_spans
                            .entry(Arc::clone(&path_key))
                            .or_default()
                            .push(call.span.start);
                        report.sva_calls += 1;
                    }
                }
                (MatchCategory::Pattern, _) => {
                    let Some(arg) = arg else {
                        continue;
                    };
                    if let Some(transform) = pattern_transform.as_deref_mut() {
                        let pattern = self.system.patterns.transform_input(&call.name, &arg);
                        match transform(pattern.name, pattern.styles.as_ref()) {
                            Ok(Some(style)) => {
                                self.process_style_props(&mut encoder, &style);
                            }
                            Ok(None) => {}
                            Err(diagnostic) => report.diagnostics.push(diagnostic),
                        }
                    }
                }
                (MatchCategory::Recipe, _) => {
                    let arg = arg.as_ref().unwrap_or(&empty_object);
                    encoded_recipes.process_usage(
                        &self.system.recipes,
                        &call.name,
                        arg,
                        &self.system.conditions,
                    );
                }
                _ => {}
            }
        }

        for jsx in result.jsx {
            let recipe_names = self.system.recipes.find_by_jsx(&jsx.name);
            if !recipe_names.is_empty() {
                if let Some(style_props) = self
                    .system
                    .recipes
                    .style_props_for_recipes(&recipe_names, &jsx.data)
                {
                    self.process_style_props(&mut encoder, &style_props);
                }
                for recipe_name in &recipe_names {
                    encoded_recipes.process_usage(
                        &self.system.recipes,
                        recipe_name,
                        &jsx.data,
                        &self.system.conditions,
                    );
                }
                report.jsx_usages += 1;
                continue;
            }

            let style = if let Some(transform) = pattern_transform.as_deref_mut() {
                let pattern = self.system.patterns.transform_input(&jsx.name, &jsx.data);
                match transform(pattern.name, pattern.styles.as_ref()) {
                    Ok(Some(style)) => style,
                    Ok(None) => jsx.data,
                    Err(diagnostic) => {
                        report.diagnostics.push(diagnostic);
                        jsx.data
                    }
                }
            } else {
                jsx.data
            };
            self.process_style_props(&mut encoder, &style);
            report.jsx_usages += 1;
        }

        let entry = FileEntry {
            source_hash,
            atoms: encoder.into_atoms(),
            encoded_recipes,
            diagnostics,
            report: report.clone(),
        };
        self.add_file_state(path_key, entry);
        report
    }

    /// Re-parse a file *only if* already known. Watch-mode contract:
    /// filter file-change events through this and edits to unrelated
    /// files (vendored sources, generated output, anything never
    /// explicitly parsed) are ignored automatically.
    pub fn refresh_file(&mut self, path: &str, source: &str) -> bool {
        if !self.files.contains_key(path) {
            return false;
        }
        self.parse_file(path, source);
        true
    }

    #[must_use]
    pub fn get_file<'a>(&'a self, path: &'a str) -> Option<ParsedFile<'a>> {
        let entry = self.files.get(path)?;
        Some(ParsedFile {
            path,
            atoms: &entry.atoms,
            diagnostics: &entry.diagnostics,
            recipes: &self.inline_recipes,
            slot_recipes: &self.inline_slot_recipes,
        })
    }

    pub fn remove_file(&mut self, path: &str) -> bool {
        let had_file = self.remove_file_entry(path).is_some();
        let recipes_dropped = self.drop_recipes_for(path);
        if had_file {
            true
        } else {
            // Skip rebuild on a no-op. A path with recipes but no file
            // entry is theoretically possible (a future API recording
            // recipes separately) — only rebuild when something changed.
            recipes_dropped
        }
    }

    /// Clear every path's state in one pass; the [`ExtractorConfig`] is
    /// kept. Useful when the user's config changes and the project needs
    /// to be re-fed.
    pub fn clear(&mut self) {
        self.files.clear();
        self.atoms_cache.clear();
        self.atom_counts.clear();
        self.encoded_recipes_cache.clear();
        self.inline_recipes.clear();
        self.inline_slot_recipes.clear();
        self.inline_recipe_spans.clear();
        self.inline_slot_recipe_spans.clear();
    }

    fn drop_file_state(&mut self, path: &str) {
        self.remove_file_entry(path);
        self.drop_recipes_for(path);
    }

    fn add_file_state(&mut self, path: Arc<str>, entry: FileEntry) {
        for atom in &entry.atoms {
            let count = self.atom_counts.entry(atom.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                self.atoms_cache.insert(atom.clone());
            }
        }
        self.encoded_recipes_cache.add_from(&entry.encoded_recipes);
        self.files.insert(path, entry);
    }

    fn remove_file_entry(&mut self, path: &str) -> Option<FileEntry> {
        let entry = self.files.remove(path)?;
        for atom in &entry.atoms {
            if let Some(count) = self.atom_counts.get_mut(atom) {
                *count -= 1;
                if *count == 0 {
                    self.atom_counts.remove(atom);
                    self.atoms_cache.remove(atom);
                }
            }
        }
        self.encoded_recipes_cache
            .remove_from(&entry.encoded_recipes);
        Some(entry)
    }

    fn drop_recipes_for(&mut self, path: &str) -> bool {
        let before = self.inline_recipes.len() + self.inline_slot_recipes.len();
        if let Some((file, spans)) = self.inline_recipe_spans.remove_entry(path) {
            for span_start in spans {
                self.inline_recipes.remove(&RecipeKey {
                    file: Arc::clone(&file),
                    span_start,
                });
            }
        }
        if let Some((file, spans)) = self.inline_slot_recipe_spans.remove_entry(path) {
            for span_start in spans {
                self.inline_slot_recipes.remove(&RecipeKey {
                    file: Arc::clone(&file),
                    span_start,
                });
            }
        }
        before != self.inline_recipes.len() + self.inline_slot_recipes.len()
    }

    fn normalize_style_object<'a>(&self, style: &'a Literal) -> Cow<'a, Literal> {
        StyleNormalizer {
            utility: self.system.utility.as_ref(),
            breakpoints: &self.system.breakpoints,
            shorthand: true,
        }
        .normalize(style)
    }

    fn process_atomic(&self, encoder: &mut Encoder<ProjectConditionMatcher>, style: &Literal) {
        let normalized = self.normalize_style_object(style);
        encoder.process_atomic(normalized.as_ref());
    }

    fn process_style_props(&self, encoder: &mut Encoder<ProjectConditionMatcher>, style: &Literal) {
        let Literal::Object(entries) = style else {
            self.process_atomic(encoder, style);
            return;
        };

        let mut rest = Vec::with_capacity(entries.len());
        for (key, value) in entries {
            if is_css_prop(key) {
                self.process_nested_css_prop(encoder, value);
            } else {
                rest.push((key.clone(), value.clone()));
            }
        }

        if !rest.is_empty() {
            self.process_atomic(encoder, &Literal::Object(rest));
        }
    }

    fn process_nested_css_prop(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        value: &Literal,
    ) {
        match value {
            Literal::Array(items) => {
                for item in items {
                    if !matches!(item, Literal::Null) {
                        self.process_atomic(encoder, item);
                    }
                }
            }
            Literal::Null | Literal::Bool(false) => {}
            _ => self.process_atomic(encoder, value),
        }
    }

    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms_cache
    }

    #[must_use]
    pub fn encoded_recipes(&self) -> &EncodedRecipes {
        self.encoded_recipes_cache.view()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.files.is_empty()
            && self.atoms_cache.is_empty()
            && self.encoded_recipes_cache.is_empty()
            && self.config_recipes.is_empty()
            && self.config_slot_recipes.is_empty()
            && self.inline_recipes.is_empty()
            && self.inline_slot_recipes.is_empty()
            && self.inline_recipe_spans.is_empty()
            && self.inline_slot_recipe_spans.is_empty()
    }

    /// Every `cva()` recipe, keyed by `(file, span_start)`. Stable order
    /// (`BTreeMap`).
    pub fn recipes(&self) -> impl Iterator<Item = (&str, u32, &Recipe)> + '_ {
        self.config_recipes
            .iter()
            .chain(self.inline_recipes.iter())
            .map(|(k, v)| (k.file.as_ref(), k.span_start, v))
    }

    pub fn slot_recipes(&self) -> impl Iterator<Item = (&str, u32, &SlotRecipe)> + '_ {
        self.config_slot_recipes
            .iter()
            .chain(self.inline_slot_recipes.iter())
            .map(|(k, v)| (k.file.as_ref(), k.span_start, v))
    }

    /// Aggregate counts; cheap, doesn't recompute. `files_processed` is
    /// the current unique file count — `remove_file` decrements it and
    /// re-parsing the same path doesn't double-count.
    #[must_use]
    pub fn summary(&self) -> ProjectSummary {
        ProjectSummary {
            files_processed: self.files.len(),
            atom_count: self.atoms_cache.len(),
            recipe_count: self.config_recipes.len() + self.inline_recipes.len(),
            slot_recipe_count: self.config_slot_recipes.len() + self.inline_slot_recipes.len(),
        }
    }

    #[must_use]
    pub fn config(&self) -> Option<&Config> {
        self.system.config()
    }

    #[must_use]
    pub fn serialized_config(&self) -> Option<&Config> {
        self.config()
    }
}

fn is_css_prop(key: &str) -> bool {
    key == "css" || key.ends_with("Css")
}

pub type PatternTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> std::result::Result<Option<Literal>, Diagnostic> + 'a;

fn hash_source(source: &str) -> u64 {
    let mut hasher = FxHasher::default();
    source.hash(&mut hasher);
    hasher.finish()
}

pub(crate) fn literal_entries(value: &Literal) -> Option<&[(String, Literal)]> {
    match value {
        Literal::Object(entries) => Some(entries.as_slice()),
        _ => None,
    }
}

/// What flowed through a single `parse_file` call.
#[derive(Debug, Clone, PartialEq, Eq, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseFileReport {
    pub css_calls: usize,
    pub cva_calls: usize,
    pub sva_calls: usize,
    pub jsx_usages: usize,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub files_processed: usize,
    pub atom_count: usize,
    pub recipe_count: usize,
    pub slot_recipe_count: usize,
}

pub use pandacss_encoder::{AtomValue, ConditionMatcher};
pub use pandacss_extractor::Literal as ExtractedLiteral;
pub use pandacss_extractor::{
    Diagnostic, DiagnosticSeverity, Matcher, NameMatcher, SourceLocation, SourceRange, Span,
};
pub use pandacss_recipes::{
    CompoundVariant, SlotCompoundVariant, SlotVariantGroup, SlotVariantOption, VariantGroup,
    VariantOption,
};
