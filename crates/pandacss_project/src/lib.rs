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

use std::collections::BTreeMap;

use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::{Map, Value};

use pandacss_config::{DerivedEngineConfig, SerializedConfig};
use pandacss_encoder::{Atom, Encoder};
use pandacss_extractor::{
    CrossFileResolver, ExtractorConfig, JsxExtractionConfig, JsxStyleProps, Literal, MatchCategory,
    Matcher as ExtractorMatcher, Matchers, NameMatcher as ExtractorNameMatcher, TokenDictionary,
    css_property_names, extract,
};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_utility::Utility;

/// One project. Hold one per build / dev-server session and feed
/// every file through `parse_file`.
pub struct Project {
    serialized_config: Option<SerializedConfig>,
    config: ExtractorConfig,
    utility: Option<Utility>,
    conditions: ProjectConditionMatcher,
    files: FxHashMap<String, FileEntry>,
    /// Deduplicated union of every value in `files`. Rebuilt eagerly on
    /// every add / remove so [`Self::atoms`] hands out a stable
    /// `&FxHashSet` borrow without recomputing on the read.
    atoms_cache: FxHashSet<Atom>,
    /// Recipes keyed by `(file, span)` so re-parsing a path drops every
    /// matching entry and span shifts don't leave orphans.
    recipes: BTreeMap<RecipeKey, Recipe>,
    slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
}

// Private so the bucket shape (cached LineIndex, structured stats, …) can
// change without disturbing callers — [`ParsedFile`] is the public view.
struct FileEntry {
    atoms: FxHashSet<Atom>,
    diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
struct RecipeKey {
    file: String,
    span_start: u32,
}

impl Project {
    #[must_use]
    pub fn new(matchers: Matchers) -> Self {
        Self::from_matchers(matchers)
    }

    #[must_use]
    pub fn from_matchers(matchers: Matchers) -> Self {
        Self::from_config(ExtractorConfig::new(matchers))
    }

    #[must_use]
    pub fn from_config(config: ExtractorConfig) -> Self {
        Self {
            serialized_config: None,
            config,
            utility: None,
            conditions: ProjectConditionMatcher::Default(pandacss_encoder::DefaultConditions),
            files: FxHashMap::default(),
            atoms_cache: FxHashSet::default(),
            recipes: BTreeMap::new(),
            slot_recipes: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn from_serialized_config(config: SerializedConfig) -> Self {
        let derived = DerivedProjectConfig::from_serialized_config(&config);
        Self {
            serialized_config: Some(config),
            config: derived.extractor,
            utility: derived.utility,
            conditions: derived.conditions,
            files: FxHashMap::default(),
            atoms_cache: FxHashSet::default(),
            recipes: BTreeMap::new(),
            slot_recipes: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn with_token_dictionary(mut self, dictionary: TokenDictionary) -> Self {
        self.config.token_dictionary = Some(dictionary);
        self
    }

    #[must_use]
    pub fn with_cross_file(mut self, resolver: CrossFileResolver) -> Self {
        self.config.cross_file = Some(resolver);
        self
    }

    /// Extract usages, decompose recipes, encode atoms into the per-file
    /// bucket. Re-parsing a path *replaces* the previous bucket (atoms
    /// and recipes) so stale styles can't linger in watch mode.
    pub fn parse_file(&mut self, path: &str, source: &str) -> FileReport {
        self.parse_file_inner(path, source, None)
    }

    pub fn parse_file_with_pattern_transforms(
        &mut self,
        path: &str,
        source: &str,
        transform: &mut PatternTransformFn<'_>,
    ) -> FileReport {
        self.parse_file_inner(path, source, Some(transform))
    }

    fn parse_file_inner(
        &mut self,
        path: &str,
        source: &str,
        mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
    ) -> FileReport {
        let result = extract(source, path, &self.config);
        let mut report = FileReport {
            css_calls: 0,
            cva_calls: 0,
            sva_calls: 0,
            jsx_usages: 0,
            diagnostics: result.diagnostics.clone(),
        };

        // Drop the previous contribution first; otherwise removed styles
        // survive as ghost atoms in the global view.
        self.drop_file_state(path);

        let mut encoder = Encoder::with_conditions(self.conditions.clone());
        for call in &result.calls {
            let Some(arg) = call.data.first().and_then(|d| d.as_ref()) else {
                continue;
            };
            match (call.category, call.name.as_str()) {
                (MatchCategory::Css, "css") => {
                    let normalized = self.normalize_style_object(arg);
                    encoder.process_atomic(&normalized);
                    report.css_calls += 1;
                }
                (MatchCategory::Css, "cva") => {
                    if let Some(recipe) = Recipe::from_literal(arg) {
                        encoder.process_atomic_recipe(&recipe);
                        self.recipes.insert(
                            RecipeKey {
                                file: path.to_owned(),
                                span_start: call.span.start,
                            },
                            recipe,
                        );
                        report.cva_calls += 1;
                    }
                }
                (MatchCategory::Css, "sva") => {
                    if let Some(recipe) = SlotRecipe::from_literal(arg) {
                        encoder.process_atomic_slot_recipe(&recipe);
                        self.slot_recipes.insert(
                            RecipeKey {
                                file: path.to_owned(),
                                span_start: call.span.start,
                            },
                            recipe,
                        );
                        report.sva_calls += 1;
                    }
                }
                (MatchCategory::Pattern, _) => {
                    if let Some(transform) = pattern_transform.as_deref_mut() {
                        match transform(&call.name, arg) {
                            Ok(Some(style)) => {
                                let normalized = self.normalize_style_object(&style);
                                encoder.process_atomic(&normalized);
                            }
                            Ok(None) => {}
                            Err(diagnostic) => report.diagnostics.push(diagnostic),
                        }
                    }
                }
                _ => {}
            }
        }

        for jsx in &result.jsx {
            let style = if let Some(transform) = pattern_transform.as_deref_mut() {
                match transform(&jsx.name, &jsx.data) {
                    Ok(Some(style)) => style,
                    Ok(None) => jsx.data.clone(),
                    Err(diagnostic) => {
                        report.diagnostics.push(diagnostic);
                        jsx.data.clone()
                    }
                }
            } else {
                jsx.data.clone()
            };
            let normalized = self.normalize_style_object(&style);
            encoder.process_atomic(&normalized);
            report.jsx_usages += 1;
        }

        self.files.insert(
            path.to_owned(),
            FileEntry {
                atoms: encoder.into_atoms(),
                diagnostics: result.diagnostics,
            },
        );
        self.rebuild_atoms_cache();
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
            recipes: &self.recipes,
            slot_recipes: &self.slot_recipes,
        })
    }

    pub fn remove_file(&mut self, path: &str) -> bool {
        let had_file = self.files.remove(path).is_some();
        let recipes_dropped = self.drop_recipes_for(path);
        if had_file {
            self.rebuild_atoms_cache();
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
        self.recipes.clear();
        self.slot_recipes.clear();
    }

    fn drop_file_state(&mut self, path: &str) {
        self.files.remove(path);
        self.drop_recipes_for(path);
    }

    fn drop_recipes_for(&mut self, path: &str) -> bool {
        let before = self.recipes.len() + self.slot_recipes.len();
        self.recipes.retain(|k, _| k.file != path);
        self.slot_recipes.retain(|k, _| k.file != path);
        before != self.recipes.len() + self.slot_recipes.len()
    }

    fn rebuild_atoms_cache(&mut self) {
        // PERF(port): size to the largest single-file bucket; grows on
        // insert if multiple files contribute distinct atoms.
        let cap = self
            .files
            .values()
            .map(|e| e.atoms.len())
            .max()
            .unwrap_or(0);
        self.atoms_cache = FxHashSet::with_capacity_and_hasher(cap, rustc_hash::FxBuildHasher);
        for entry in self.files.values() {
            self.atoms_cache.extend(entry.atoms.iter().cloned());
        }
    }

    fn normalize_style_object(&self, style: &Literal) -> Literal {
        self.utility.as_ref().map_or_else(
            || style.clone(),
            |utility| utility.normalize_style_object(style),
        )
    }

    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms_cache
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.files.is_empty()
            && self.atoms_cache.is_empty()
            && self.recipes.is_empty()
            && self.slot_recipes.is_empty()
    }

    /// Every `cva()` recipe, keyed by `(file, span_start)`. Stable order
    /// (`BTreeMap`).
    pub fn recipes(&self) -> impl Iterator<Item = (&str, u32, &Recipe)> + '_ {
        self.recipes
            .iter()
            .map(|(k, v)| (k.file.as_str(), k.span_start, v))
    }

    pub fn slot_recipes(&self) -> impl Iterator<Item = (&str, u32, &SlotRecipe)> + '_ {
        self.slot_recipes
            .iter()
            .map(|(k, v)| (k.file.as_str(), k.span_start, v))
    }

    /// Aggregate counts; cheap, doesn't recompute. `files_processed` is
    /// the current unique file count — `remove_file` decrements it and
    /// re-parsing the same path doesn't double-count.
    #[must_use]
    pub fn summary(&self) -> ProjectSummary {
        ProjectSummary {
            files_processed: self.files.len(),
            atom_count: self.atoms_cache.len(),
            recipe_count: self.recipes.len(),
            slot_recipe_count: self.slot_recipes.len(),
        }
    }

    #[must_use]
    pub fn serialized_config(&self) -> Option<&SerializedConfig> {
        self.serialized_config.as_ref()
    }
}

pub type PatternTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> Result<Option<Literal>, Diagnostic> + 'a;

struct DerivedProjectConfig {
    extractor: ExtractorConfig,
    utility: Option<Utility>,
    conditions: ProjectConditionMatcher,
}

impl DerivedProjectConfig {
    fn from_serialized_config(config: &SerializedConfig) -> Self {
        let derived = DerivedEngineConfig::from_serialized_config(config);
        let utility = Utility::from_serialized(&config.utilities);
        Self {
            extractor: ExtractorConfig::new(matchers_from_derived_config(&derived)).with_jsx(
                jsx_extraction_config_from_serialized_config(config, &utility),
            ),
            utility: (!utility.is_empty()).then_some(utility),
            conditions: ProjectConditions::from_derived_config(&derived),
        }
    }
}

#[derive(Debug, Clone)]
enum ProjectConditionMatcher {
    Default(pandacss_encoder::DefaultConditions),
    Config(ProjectConditions),
}

impl ConditionMatcher for ProjectConditionMatcher {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        match self {
            Self::Default(matcher) => matcher.is_condition(key),
            Self::Config(matcher) => matcher.is_condition(key),
        }
    }
}

#[derive(Debug, Clone, Default)]
struct ProjectConditions {
    names: FxHashSet<Box<str>>,
}

impl ProjectConditions {
    fn from_derived_config(config: &DerivedEngineConfig) -> ProjectConditionMatcher {
        let mut conditions = Self::default();
        conditions.extend(config.condition_names.iter().map(String::as_str));
        ProjectConditionMatcher::Config(conditions)
    }

    fn extend<'a>(&mut self, names: impl IntoIterator<Item = &'a str>) {
        self.names.extend(
            names
                .into_iter()
                .filter(|name| !name.is_empty())
                .map(Box::<str>::from),
        );
    }
}

impl ConditionMatcher for ProjectConditions {
    #[inline]
    fn is_condition(&self, key: &str) -> bool {
        key.starts_with('_') || self.names.contains(key)
    }
}

fn matchers_from_derived_config(config: &DerivedEngineConfig) -> Matchers {
    Matchers {
        css: ExtractorMatcher {
            modules: config.import_map.css.clone(),
            names: ExtractorNameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: ExtractorMatcher {
            modules: config.import_map.recipe.clone(),
            names: ExtractorNameMatcher::Any,
        },
        pattern: ExtractorMatcher {
            modules: config.import_map.pattern.clone(),
            names: ExtractorNameMatcher::Any,
        },
        jsx: Some(ExtractorMatcher {
            modules: config.import_map.jsx.clone(),
            names: ExtractorNameMatcher::only(config.jsx_names.clone()),
        }),
        tokens: ExtractorMatcher {
            modules: config.import_map.tokens.clone(),
            names: ExtractorNameMatcher::only(["token"]),
        },
        jsx_factories: Some(vec![config.jsx_factory.clone()]),
    }
}

fn collect_string_array(value: Option<&Value>, names: &mut Vec<String>) {
    let Some(items) = value.and_then(Value::as_array) else {
        return;
    };

    names.extend(items.iter().filter_map(Value::as_str).map(str::to_owned));
}

fn jsx_extraction_config_from_serialized_config(
    config: &SerializedConfig,
    utility: &Utility,
) -> JsxExtractionConfig {
    let mut component_props = FxHashMap::default();
    collect_pattern_jsx_props(&config.patterns, &mut component_props);
    let valid_style_props = valid_jsx_style_props_from_serialized_config(utility);
    let Some(theme) = config.theme.as_object() else {
        return JsxExtractionConfig {
            style_props: jsx_style_props_from_serialized_config(config),
            component_props,
            valid_style_props,
        };
    };
    collect_recipe_jsx_props(theme.get("recipes"), &mut component_props);
    collect_slot_recipe_jsx_props(theme.get("slotRecipes"), &mut component_props);
    if let Some(extend) = theme.get("extend").and_then(Value::as_object) {
        collect_recipe_jsx_props(extend.get("recipes"), &mut component_props);
        collect_slot_recipe_jsx_props(extend.get("slotRecipes"), &mut component_props);
    }
    JsxExtractionConfig {
        style_props: jsx_style_props_from_serialized_config(config),
        component_props,
        valid_style_props,
    }
}

fn valid_jsx_style_props_from_serialized_config(utility: &Utility) -> FxHashSet<String> {
    let mut props: FxHashSet<String> = css_property_names()
        .iter()
        .map(|prop| (*prop).to_owned())
        .collect();
    props.extend(utility.known_prop_names().map(str::to_owned));
    props
}

fn jsx_style_props_from_serialized_config(config: &SerializedConfig) -> JsxStyleProps {
    match config.jsx_style_props.as_deref() {
        Some("minimal") => JsxStyleProps::Minimal,
        Some("none") => JsxStyleProps::None,
        _ => JsxStyleProps::All,
    }
}

fn collect_pattern_jsx_props(value: &Value, out: &mut FxHashMap<String, FxHashSet<String>>) {
    let Some(patterns) = value.as_object() else {
        return;
    };
    collect_pattern_map_jsx_props(patterns, out);
    if let Some(extend) = patterns.get("extend").and_then(Value::as_object) {
        collect_pattern_map_jsx_props(extend, out);
    }
}

fn collect_pattern_map_jsx_props(
    patterns: &Map<String, Value>,
    out: &mut FxHashMap<String, FxHashSet<String>>,
) {
    for (name, pattern) in patterns {
        if name == "extend" {
            continue;
        }
        let mut jsx_names = vec![
            pattern
                .get("jsxName")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| capitalize(name)),
        ];
        collect_string_array(pattern.get("jsx"), &mut jsx_names);
        let props = object_keys(pattern.get("properties"));
        insert_jsx_props(out, jsx_names, props);
    }
}

fn collect_recipe_jsx_props(value: Option<&Value>, out: &mut FxHashMap<String, FxHashSet<String>>) {
    let Some(recipes) = value.and_then(Value::as_object) else {
        return;
    };

    for (name, recipe) in recipes {
        let mut jsx_names = vec![capitalize(name)];
        collect_string_array(recipe.get("jsx"), &mut jsx_names);
        let props = object_keys(recipe.get("variants"));
        insert_jsx_props(out, jsx_names, props);
    }
}

fn collect_slot_recipe_jsx_props(
    value: Option<&Value>,
    out: &mut FxHashMap<String, FxHashSet<String>>,
) {
    let Some(recipes) = value.and_then(Value::as_object) else {
        return;
    };

    for (name, recipe) in recipes {
        let capitalized = capitalize(name);
        let mut jsx_names = vec![
            capitalized.clone(),
            format!("{capitalized}.Root"),
            format!("{capitalized}Root"),
        ];
        collect_string_array(recipe.get("jsx"), &mut jsx_names);
        let props = object_keys(recipe.get("variants"));
        insert_jsx_props(out, jsx_names, props);
    }
}

fn object_keys(value: Option<&Value>) -> FxHashSet<String> {
    value
        .and_then(Value::as_object)
        .map(|object| object.keys().cloned().collect())
        .unwrap_or_default()
}

fn insert_jsx_props<I>(
    out: &mut FxHashMap<String, FxHashSet<String>>,
    jsx_names: I,
    props: FxHashSet<String>,
) where
    I: IntoIterator<Item = String>,
{
    if props.is_empty() {
        return;
    }
    for jsx_name in jsx_names {
        out.entry(jsx_name)
            .or_default()
            .extend(props.iter().cloned());
    }
}

fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_uppercase().chain(chars).collect()
}

/// Borrowed read-only view of one parsed file. **Read-only by design** —
/// unlike ts-morph's `SourceFile`, this view does not mutate, copy, move,
/// save, or emit; Panda is an extractor, not a codemod toolkit. Re-process
/// via [`Project::refresh_file`] / [`Project::parse_file`].
pub struct ParsedFile<'a> {
    path: &'a str,
    atoms: &'a FxHashSet<Atom>,
    diagnostics: &'a [Diagnostic],
    recipes: &'a BTreeMap<RecipeKey, Recipe>,
    slot_recipes: &'a BTreeMap<RecipeKey, SlotRecipe>,
}

impl<'a> ParsedFile<'a> {
    #[must_use]
    pub fn path(&self) -> &'a str {
        self.path
    }

    #[must_use]
    pub fn basename(&self) -> &'a str {
        std::path::Path::new(self.path)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or(self.path)
    }

    /// File extension *without* the leading dot — `"tsx"` for
    /// `"button.tsx"`. Differs from ts-morph's `getExtension()` (which
    /// returns `".tsx"`); Rust convention keeps the borrow allocation-free.
    #[must_use]
    pub fn extension(&self) -> &'a str {
        std::path::Path::new(self.path)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
    }

    #[must_use]
    pub fn directory(&self) -> &'a str {
        std::path::Path::new(self.path)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or("")
    }

    #[must_use]
    pub fn atoms(&self) -> &'a FxHashSet<Atom> {
        self.atoms
    }

    #[must_use]
    pub fn diagnostics(&self) -> &'a [Diagnostic] {
        self.diagnostics
    }

    // PERF(port): filter the project-wide registries by path on the fly.
    // Typical files have 0-3 recipes, so a per-file index would cost more
    // than it saves.
    pub fn recipes(&self) -> impl Iterator<Item = (u32, &'a Recipe)> + 'a {
        let path = self.path;
        self.recipes
            .iter()
            .filter(move |(k, _)| k.file == path)
            .map(|(k, v)| (k.span_start, v))
    }

    pub fn slot_recipes(&self) -> impl Iterator<Item = (u32, &'a SlotRecipe)> + 'a {
        let path = self.path;
        self.slot_recipes
            .iter()
            .filter(move |(k, _)| k.file == path)
            .map(|(k, v)| (k.span_start, v))
    }
}

/// What flowed through a single `parse_file` call.
#[derive(Debug, Clone, PartialEq, Eq, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileReport {
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

pub use pandacss_encoder::{AtomValue, ConditionMatcher, DefaultConditions};
pub use pandacss_extractor::Literal as ExtractedLiteral;
pub use pandacss_extractor::{
    Diagnostic, DiagnosticSeverity, Matcher, NameMatcher, SourceLocation, SourceRange, Span,
};
pub use pandacss_recipes::{
    CompoundVariant, SlotCompoundVariant, SlotVariantGroup, SlotVariantOption, VariantGroup,
    VariantOption,
};
