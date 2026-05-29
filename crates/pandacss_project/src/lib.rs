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
//! use pandacss_config::UserConfig;
//! use pandacss_project::{Project, System};
//!
//! let config = UserConfig::default();
//! let system = System::new(config)?;
//! let mut project = Project::new(system);
//! project.parse_file("button.tsx", "import {{ css }} from '@panda/css'; css({{ color: 'red' }});");
//! project.parse_file("card.tsx", /* … */);
//!
//! let atoms = project.atoms();          // deduped across both files
//! let recipes = project.recipes();      // every cva/sva encountered
//! let summary = project.summary();      // counts for tooling / reporting
//! ```

mod config;
mod error;
mod parsed_file;
mod patterns;
mod recipes;
mod runtime_config;
mod static_patterns;
mod system;

use std::collections::BTreeMap;
use std::hash::{Hash, Hasher};
use std::sync::Arc;

use rustc_hash::{FxHashMap, FxHashSet, FxHasher};
use smallvec::SmallVec;

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::{
    CrossFileResolver, ExtractedCall, ExtractedJsx, LineIndex, Literal, MatchCategory, extract,
};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::diagnostic_codes;
use pandacss_utility::{StyleNormalizer, Utility};

pub use error::{ConfigError, Result};
pub use pandacss_encoder::{
    EncodedRecipesSnapshot, RecipeStyleEntry, RecipeStyleGroup, RecipeStyleGroupSnapshot,
};
pub use parsed_file::ParsedFile;
pub use recipes::EncodedRecipes;
use recipes::EncodedRecipesCache;
pub use runtime_config::Config;
pub use system::{System, SystemInput};

pub(crate) type ProjectConditionMatcher = pandacss_encoder::ConditionSet;

/// One project. Hold one per build / dev-server session and feed
/// every file through `parse_file`.
pub struct Project {
    config: Arc<Config>,
    files: FxHashMap<Arc<str>, FileEntry>,
    /// Deduplicated union of every value in `files`. Updated by reference
    /// counts on add/remove so [`Self::atoms`] hands out a stable
    /// `&FxHashSet` without walking the whole project on each save.
    atoms_cache: FxHashSet<Atom>,
    atom_counts: FxHashMap<Atom, u32>,
    encoded_recipes_cache: EncodedRecipesCache,
    atoms_snapshot_cache: Option<Vec<Atom>>,
    encoded_recipes_snapshot_cache: Option<EncodedRecipesSnapshot>,
    static_encoded_recipes_snapshot_cache: Option<(serde_json::Value, EncodedRecipesSnapshot)>,
    /// Recipes keyed by `(file, span)` so re-parsing a path drops every
    /// matching entry and span shifts don't leave orphans.
    config_recipes: BTreeMap<RecipeKey, Recipe>,
    config_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    inline_recipes: BTreeMap<RecipeKey, Recipe>,
    inline_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    inline_recipe_spans: FxHashMap<Arc<str>, SmallVec<[u32; 4]>>,
    inline_slot_recipe_spans: FxHashMap<Arc<str>, SmallVec<[u32; 4]>>,
    config_diagnostics: Vec<Diagnostic>,
}

pub struct ProjectStylesheetSnapshots<'a> {
    pub atoms: &'a [Atom],
    pub encoded_recipes: &'a EncodedRecipesSnapshot,
    pub static_encoded_recipes: &'a EncodedRecipesSnapshot,
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
    #[allow(
        clippy::needless_pass_by_value,
        reason = "Project conceptually takes ownership of the System"
    )]
    pub fn new(system: System) -> Self {
        let config = system.config_arc();
        let config_diagnostics = system.diagnostics().to_vec();
        let config_recipes = config.config_recipes.clone();
        let config_slot_recipes = config.config_slot_recipes.clone();
        Self {
            config,
            files: FxHashMap::default(),
            atoms_cache: FxHashSet::default(),
            atom_counts: FxHashMap::default(),
            encoded_recipes_cache: EncodedRecipesCache::default(),
            atoms_snapshot_cache: None,
            encoded_recipes_snapshot_cache: None,
            static_encoded_recipes_snapshot_cache: None,
            config_recipes,
            config_slot_recipes,
            inline_recipes: BTreeMap::new(),
            inline_slot_recipes: BTreeMap::new(),
            inline_recipe_spans: FxHashMap::default(),
            inline_slot_recipe_spans: FxHashMap::default(),
            config_diagnostics,
        }
    }

    /// # Panics
    /// Panics if the config `Arc` is already shared — only valid immediately
    /// after [`Self::new`], before any clone of the config escapes.
    #[must_use]
    pub fn with_cross_file(mut self, resolver: CrossFileResolver) -> Self {
        Arc::get_mut(&mut self.config)
            .expect("project config is uniquely owned during construction")
            .extractor_config
            .cross_file = Some(resolver);
        self
    }

    /// Extract usages, decompose recipes, encode atoms into the per-file
    /// bucket. Re-parsing a path *replaces* the previous bucket (atoms
    /// and recipes) so stale styles can't linger in watch mode.
    pub fn parse_file(&mut self, path: &str, source: &str) -> ParseFileReport {
        self.parse_file_inner(path, source, None, None)
    }

    /// [`Self::parse_file`] with transform callbacks. The binding layer
    /// builds `transforms` fresh per call — the closures capture the
    /// per-call JS environment, so they can't be stored on the project.
    pub fn parse_file_with(
        &mut self,
        path: &str,
        source: &str,
        transforms: ParseTransforms<'_>,
    ) -> ParseFileReport {
        self.parse_file_inner(path, source, transforms.pattern, transforms.utility)
    }

    /// Stateless single-file extraction using this project's configured
    /// matchers + token dictionary. Unlike [`Self::parse_file`], it does not
    /// encode, decompose recipes, or register anything — it returns the raw
    /// extracted usages directly. Backs `compiler.extract(...)` on the bindings.
    #[must_use]
    pub fn extract(&self, path: &str, source: &str) -> pandacss_extractor::ExtractUsage {
        extract(source, path, &self.config.extractor_config)
    }

    #[allow(
        clippy::too_many_lines,
        reason = "single-pass dispatch over every extracted call/jsx kind"
    )]
    fn parse_file_inner(
        &mut self,
        path: &str,
        source: &str,
        mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
        utility_transform: Option<&mut UtilityTransformFn<'_>>,
    ) -> ParseFileReport {
        let span = tracing::trace_span!(
            "file_parse",
            path = path,
            source_len = source.len(),
            cache_hit = tracing::field::Empty
        );
        let _guard = span.enter();
        let source_hash = hash_source(source);
        if pattern_transform.is_none()
            && utility_transform.is_none()
            && self
                .files
                .get(path)
                .is_some_and(|entry| entry.source_hash == source_hash)
        {
            span.record("cache_hit", true);
            return self.files.get(path).expect("checked above").report.clone();
        }
        span.record("cache_hit", false);

        let result = extract(source, path, &self.config.extractor_config);
        let mut diagnostics = result.diagnostics;
        if let Some(utility) = self.config.utility.as_ref()
            && !utility.deprecated_props().is_empty()
        {
            let line_index = LineIndex::new(source);
            push_deprecated_utility_diagnostics(
                &result.calls,
                &result.jsx,
                utility,
                &line_index,
                &mut diagnostics,
            );
        }
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

        let compiled = self.config.as_ref();
        let mut encoder = Encoder::with_conditions(compiled.conditions.clone());
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
                    let _span = tracing::trace_span!("recipe_resolution", kind = "cva").entered();
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
                    let _span = tracing::trace_span!("recipe_resolution", kind = "sva").entered();
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
                        let pattern = compiled.patterns.transform_input(&call.name, &arg);
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
                    let _span = tracing::trace_span!(
                        "recipe_resolution",
                        kind = "config_call",
                        name = call.name.as_str()
                    )
                    .entered();
                    encoded_recipes.process_usage(
                        &compiled.recipes,
                        &call.name,
                        arg,
                        &compiled.conditions,
                    );
                }
                _ => {}
            }
        }

        for jsx in result.jsx {
            let recipe_names = compiled.recipes.find_by_jsx(&jsx.name);
            if !recipe_names.is_empty() {
                let _span = tracing::trace_span!(
                    "recipe_resolution",
                    kind = "jsx",
                    name = jsx.name.as_str(),
                    recipe_count = recipe_names.len()
                )
                .entered();
                if let Some(style_props) = compiled
                    .recipes
                    .style_props_for_recipes(&recipe_names, &jsx.data)
                {
                    self.process_style_props(&mut encoder, &style_props);
                }
                for recipe_name in &recipe_names {
                    encoded_recipes.process_usage(
                        &compiled.recipes,
                        recipe_name,
                        &jsx.data,
                        &compiled.conditions,
                    );
                }
                report.jsx_usages += 1;
                continue;
            }

            let style = if let Some(transform) = pattern_transform.as_deref_mut() {
                let pattern = compiled.patterns.transform_input(&jsx.name, &jsx.data);
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

        let mut atoms = encoder.into_atoms();
        if let Some(transform) = utility_transform {
            atoms = transform_atoms(atoms, transform, &mut report.diagnostics);
            encoded_recipes.transform_utilities(transform, &mut report.diagnostics);
        }

        let entry = FileEntry {
            source_hash,
            atoms,
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

    pub fn refresh_file_with(
        &mut self,
        path: &str,
        source: &str,
        transforms: ParseTransforms<'_>,
    ) -> bool {
        if !self.files.contains_key(path) {
            return false;
        }
        self.parse_file_with(path, source, transforms);
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

    /// Clear every path's state in one pass; the compiled [`Config`] is
    /// kept. Useful when the source graph needs to be re-fed.
    pub fn clear(&mut self) {
        self.files.clear();
        self.atoms_cache.clear();
        self.atom_counts.clear();
        self.encoded_recipes_cache.clear();
        self.invalidate_stylesheet_snapshots();
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
        self.invalidate_stylesheet_snapshots();
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
        self.invalidate_stylesheet_snapshots();
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

    fn invalidate_stylesheet_snapshots(&mut self) {
        self.atoms_snapshot_cache = None;
        self.encoded_recipes_snapshot_cache = None;
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

    fn process_atomic(&self, encoder: &mut Encoder<ProjectConditionMatcher>, style: &Literal) {
        let _span = tracing::trace_span!("encoding_atomic").entered();
        let normalizer = StyleNormalizer {
            utility: self.config.utility.as_ref(),
            breakpoints: &self.config.breakpoints,
            shorthand: true,
        };
        encoder.process_atomic_with(style, &normalizer);
    }

    fn process_style_props(&self, encoder: &mut Encoder<ProjectConditionMatcher>, style: &Literal) {
        let _span = tracing::trace_span!("encoding_style_props").entered();
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
    pub fn static_pattern_atoms(
        &self,
        user_config: &UserConfig,
        pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> (Vec<Atom>, Vec<Diagnostic>) {
        let mut diagnostics = Vec::new();
        let atoms = static_patterns::expand_static_patterns(
            user_config,
            &self.config.patterns,
            self.config.utility.as_ref(),
            self.config.token_dictionary().as_deref(),
            pattern_transform,
            &mut diagnostics,
        );
        (atoms, diagnostics)
    }

    #[must_use]
    pub(crate) fn static_encoded_recipes(
        &self,
        user_config: &UserConfig,
    ) -> EncodedRecipesSnapshot {
        let mut encoded = EncodedRecipes::default();
        self.config.recipes.process_static_css(
            &mut encoded,
            user_config,
            &self.config.conditions,
            &self.config.breakpoints,
        );
        encoded.snapshot()
    }

    #[must_use]
    #[allow(
        clippy::missing_panics_doc,
        reason = "snapshot caches are populated immediately above the expects"
    )]
    pub fn stylesheet_snapshots(
        &mut self,
        user_config: &UserConfig,
    ) -> ProjectStylesheetSnapshots<'_> {
        if self.atoms_snapshot_cache.is_none() {
            let mut atoms = self.atoms_cache.iter().cloned().collect::<Vec<_>>();
            atoms.sort_by(compare_atoms_by_emit_order);
            self.atoms_snapshot_cache = Some(atoms);
        }
        if self.encoded_recipes_snapshot_cache.is_none() {
            self.encoded_recipes_snapshot_cache =
                Some(self.encoded_recipes_cache.view().snapshot());
        }
        let static_cache_matches = self
            .static_encoded_recipes_snapshot_cache
            .as_ref()
            .is_some_and(|(static_css, _)| static_css == &user_config.static_css);
        if !static_cache_matches {
            self.static_encoded_recipes_snapshot_cache = Some((
                user_config.static_css.clone(),
                self.static_encoded_recipes(user_config),
            ));
        }

        ProjectStylesheetSnapshots {
            atoms: self
                .atoms_snapshot_cache
                .as_deref()
                .expect("atom snapshot was initialized"),
            encoded_recipes: self
                .encoded_recipes_snapshot_cache
                .as_ref()
                .expect("encoded recipe snapshot was initialized"),
            static_encoded_recipes: self
                .static_encoded_recipes_snapshot_cache
                .as_ref()
                .map(|(_, snapshot)| snapshot)
                .expect("static recipe snapshot was initialized"),
        }
    }

    #[must_use]
    pub fn diagnostics(&self) -> &[Diagnostic] {
        &self.config_diagnostics
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

    /// `(path, source_hash)` per known file, sorted by path. Hash is
    /// the same one the re-parse short-circuit uses.
    #[must_use]
    pub fn file_manifest(&self) -> Vec<(Arc<str>, u64)> {
        let mut entries: Vec<(Arc<str>, u64)> = self
            .files
            .iter()
            .map(|(path, entry)| (Arc::clone(path), entry.source_hash))
            .collect();
        entries.sort_by(|a, b| a.0.cmp(&b.0));
        entries
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
    pub fn config(&self) -> &Config {
        &self.config
    }
}

fn is_css_prop(key: &str) -> bool {
    key == "css" || key.ends_with("Css")
}

pub type PatternTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> std::result::Result<Option<Literal>, Diagnostic> + 'a;

pub type UtilityTransformFn<'a> =
    dyn FnMut(&str, &AtomValue) -> std::result::Result<Option<Vec<Atom>>, Diagnostic> + 'a;

/// Per-call transform callbacks for [`Project::parse_file_with`] /
/// [`Project::refresh_file_with`]. The binding layer builds these fresh per
/// call (the closures capture the per-call JS environment), so they're passed
/// in rather than stored on the project.
#[derive(Default)]
pub struct ParseTransforms<'a> {
    pub pattern: Option<&'a mut PatternTransformFn<'a>>,
    pub utility: Option<&'a mut UtilityTransformFn<'a>>,
}

fn push_deprecated_utility_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    utility: &Utility,
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
) {
    let deprecated = utility.deprecated_props();
    let mut seen: Vec<String> = Vec::new();
    for call in calls {
        seen.clear();
        for lit in call.data.iter().flatten() {
            collect_deprecated_props(lit, utility, deprecated, &mut seen);
        }
        for prop in seen.drain(..) {
            out.push(deprecated_utility_diagnostic(&prop, call.span, line_index));
        }
    }
    for entry in jsx {
        seen.clear();
        collect_deprecated_props(&entry.data, utility, deprecated, &mut seen);
        for prop in seen.drain(..) {
            out.push(deprecated_utility_diagnostic(&prop, entry.span, line_index));
        }
    }
}

fn collect_deprecated_props(
    value: &Literal,
    utility: &Utility,
    deprecated: &FxHashSet<String>,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                let canonical = utility.resolve_shorthand(key);
                if deprecated.contains(canonical) {
                    let name = canonical.to_owned();
                    if !out.contains(&name) {
                        out.push(name);
                    }
                }
                collect_deprecated_props(child, utility, deprecated, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_deprecated_props(item, utility, deprecated, out);
            }
        }
        Literal::String(_) | Literal::Number(_) | Literal::Bool(_) | Literal::Null => {}
    }
}

fn deprecated_utility_diagnostic(
    prop: &str,
    span: pandacss_extractor::Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    let mut diagnostic = Diagnostic::warning(
        diagnostic_codes::DEPRECATED_UTILITY_USED,
        format!("utility \"{prop}\" is deprecated"),
    );
    diagnostic.span = Some(span);
    diagnostic.location = Some(line_index.locate_range(span.start, span.end));
    diagnostic
}

fn transform_atoms(
    atoms: FxHashSet<Atom>,
    transform: &mut UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) -> FxHashSet<Atom> {
    let mut out = FxHashSet::default();
    for atom in atoms {
        match transform(atom.prop(), atom.value()) {
            Ok(Some(transformed)) => {
                let conditions: SmallVec<[Box<str>; 2]> =
                    atom.conditions().iter().cloned().collect();
                out.extend(
                    transformed
                        .into_iter()
                        .map(|next| next.with_prefixed_conditions(&conditions)),
                );
            }
            Ok(None) => {
                out.insert(atom);
            }
            Err(diagnostic) => {
                diagnostics.push(diagnostic);
            }
        }
    }
    out
}

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
