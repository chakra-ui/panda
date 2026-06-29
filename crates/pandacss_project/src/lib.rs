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

mod build_info;
mod codegen;
mod config;
mod design_system;
mod error;
mod hook_filter;
mod inspection;
mod parsed_file;
mod patterns;
mod recipes;
mod runtime_config;
mod static_patterns;
mod system;
mod transform_cache;
mod usages;

use std::collections::BTreeMap;
use std::hash::{Hash, Hasher};
use std::sync::Arc;

use rustc_hash::{FxHashMap, FxHashSet, FxHasher};
use smallvec::SmallVec;

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, Encoder, compare_atoms_by_emit_order};
use pandacss_extractor::{
    CrossFileResolver, ExportInfo, ExtractedCall, ExtractedJsx, LineIndex, Literal, MatchCategory,
    extract,
};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::diagnostic_codes;
use pandacss_utility::{ShorthandPolicy, StyleNormalizer, Utility};

/// Key into the utility-transform override map: `(prop, original_value)`. The
/// style object is a pure function of this key (conditions ride on the carrier
/// atom), so the map refcounts as a plain key→value union.
pub type UtilityStyleKey = (Box<str>, AtomValue);

pub use build_info::{BuildAtom, BuildInfo, BuildValue, ModuleEntry, SCHEMA_VERSION};
pub use design_system::{
    ChainPlan, DesignSystemManifest, MANIFEST_SCHEMA_VERSION, ManifestImportMap, ManifestInput,
    resolve_chain, token_conflicts,
};
pub use error::{ConfigError, Result};
pub use hook_filter::HookFilter;
pub use inspection::{
    ComponentEntryKind, ComponentEntryRef, FileInspectionResult, StyleEntryFixability,
    StyleEntryKind, StyleEntryOrigin, StyleEntryRef, StyleEntrySyntax, TokenRefSite, UsageKind,
    UsageSite,
};
pub use pandacss_encoder::{
    EncodedRecipesSnapshot, RecipeStyleEntry, RecipeStyleGroup, RecipeStyleGroupSnapshot,
};
pub use pandacss_utility::{ResolvedUtilityValue, UtilityValueSource};
pub use parsed_file::ParsedFile;
pub use recipes::EncodedRecipes;
use recipes::EncodedRecipesCache;
pub use runtime_config::Config;
pub use system::{System, SystemInput};
pub use transform_cache::{
    AtomValueCacheKey, LiteralCacheKey, atom_value_cache_key, literal_cache_key,
};

pub(crate) type ProjectConditionMatcher = pandacss_encoder::ConditionSet;

/// One project. Hold one per build / dev-server session and feed
/// every file through `parse_file`.
pub struct Project {
    config: Arc<Config>,
    config_fingerprint: Arc<str>,
    files: FxHashMap<Arc<str>, FileEntry>,
    /// Deduplicated union of every value in `files`. Updated by reference
    /// counts on add/remove so [`Self::atoms`] hands out a stable
    /// `&FxHashSet` without walking the whole project on each save.
    atoms_cache: FxHashSet<Atom>,
    atom_counts: FxHashMap<Atom, u32>,
    /// Deduplicated union of every file's `utility_styles`, refcounted in
    /// lockstep with `atoms_cache` (see [`Self::add_file_state`]).
    utility_styles_cache: FxHashMap<UtilityStyleKey, Literal>,
    utility_styles_counts: FxHashMap<UtilityStyleKey, u32>,
    encoded_recipes_cache: EncodedRecipesCache,
    atoms_snapshot_cache: Option<Vec<Atom>>,
    encoded_recipes_snapshot_cache: Option<EncodedRecipesSnapshot>,
    static_encoded_recipes_snapshot_cache:
        Option<(serde_json::Value, bool, EncodedRecipesSnapshot)>,
    token_refs_snapshot_cache: Option<Vec<String>>,
    parse_epoch: u64,
    /// Recipes keyed by `(file, span)` so re-parsing a path drops every
    /// matching entry and span shifts don't leave orphans.
    config_recipes: BTreeMap<RecipeKey, Recipe>,
    config_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    inline_recipes: BTreeMap<RecipeKey, Recipe>,
    inline_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    inline_recipe_spans: FxHashMap<Arc<str>, SmallVec<[u32; 4]>>,
    inline_slot_recipe_spans: FxHashMap<Arc<str>, SmallVec<[u32; 4]>>,
    config_diagnostics: Vec<Diagnostic>,
    /// Recipe snapshots hydrated from external build info, keyed by the source
    /// library name. Merged into the emit snapshot in [`Self::stylesheet_snapshots`].
    hydrated_recipes: FxHashMap<Arc<str>, EncodedRecipesSnapshot>,
}

pub struct ProjectStylesheetSnapshots<'a> {
    pub atoms: &'a [Atom],
    pub encoded_recipes: &'a EncodedRecipesSnapshot,
    pub static_encoded_recipes: &'a EncodedRecipesSnapshot,
    pub token_refs: &'a [String],
    /// Custom-utility transform styles by `(prop, value)`; the emitter looks
    /// these up in `transform_atom` to emit one class per usage.
    pub utility_styles: &'a FxHashMap<UtilityStyleKey, Literal>,
}

// Private so the bucket shape (cached LineIndex, structured stats, …) can
// change without disturbing callers — [`ParsedFile`] is the public view.
struct FileEntry {
    source_hash: u64,
    parse_epoch: u64,
    cacheable: bool,
    atoms: FxHashSet<Atom>,
    encoded_recipes: EncodedRecipes,
    /// Custom-utility transform styles, refcounted alongside `atoms` so a
    /// carrier atom and its styles add/remove together.
    utility_styles: FxHashMap<UtilityStyleKey, Literal>,
    token_refs: Vec<String>,
    /// Top-level export facts for the build-info `exports` map. Empty for
    /// hydrated/synthetic files.
    exports: ExportInfo,
    diagnostics: Vec<Diagnostic>,
    report: ParseFileReport,
}

#[derive(Clone, Copy)]
enum ParseMode {
    Replace,
    Additive,
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
        let config_fingerprint = system.config_fingerprint_arc();
        let config_diagnostics = system.diagnostics().to_vec();
        let config_recipes = config.config_recipes.clone();
        let config_slot_recipes = config.config_slot_recipes.clone();
        Self {
            config,
            config_fingerprint,
            files: FxHashMap::default(),
            atoms_cache: FxHashSet::default(),
            atom_counts: FxHashMap::default(),
            utility_styles_cache: FxHashMap::default(),
            utility_styles_counts: FxHashMap::default(),
            encoded_recipes_cache: EncodedRecipesCache::default(),
            atoms_snapshot_cache: None,
            encoded_recipes_snapshot_cache: None,
            static_encoded_recipes_snapshot_cache: None,
            token_refs_snapshot_cache: None,
            parse_epoch: 0,
            config_recipes,
            config_slot_recipes,
            inline_recipes: BTreeMap::new(),
            inline_slot_recipes: BTreeMap::new(),
            inline_recipe_spans: FxHashMap::default(),
            inline_slot_recipe_spans: FxHashMap::default(),
            config_diagnostics,
            hydrated_recipes: FxHashMap::default(),
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
    /// and recipes) so full rebuilds can clear stale styles.
    pub fn parse_file(&mut self, path: &str, source: &str) -> ParseFileReport {
        self.parse_file_inner(path, source, None, None, None, ParseMode::Replace)
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
        self.parse_file_inner(
            path,
            source,
            transforms.source,
            transforms.pattern,
            transforms.utility,
            ParseMode::Replace,
        )
    }

    /// Stateless single-file extraction using this project's configured
    /// matchers + token dictionary. Unlike [`Self::parse_file`], it does not
    /// encode, decompose recipes, or register anything — it returns the raw
    /// extracted usages directly. Backs `compiler.extractFileSource(...)` on the
    /// bindings.
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
        source_transform: Option<&mut SourceTransformFn<'_>>,
        mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
        utility_transform: Option<&mut UtilityTransformFn<'_>>,
        mode: ParseMode,
    ) -> ParseFileReport {
        let span = tracing::trace_span!(
            "file_parse",
            path = path,
            source_len = source.len(),
            cache_hit = tracing::field::Empty
        );
        let _guard = span.enter();
        let source_hash = hash_source(source);
        if self.files.get(path).is_some_and(|entry| {
            entry.cacheable
                && entry.source_hash == source_hash
                && entry.parse_epoch == self.parse_epoch
        }) {
            span.record("cache_hit", true);
            return self.files.get(path).expect("checked above").report.clone();
        }
        span.record("cache_hit", false);

        let transformed_source;
        let source = match source_transform {
            Some(transform) => match transform(path, source) {
                Ok(Some(next)) => {
                    transformed_source = next;
                    transformed_source.as_str()
                }
                Ok(None) => source,
                Err(diagnostic) => {
                    if matches!(mode, ParseMode::Replace) {
                        self.drop_file_state(path);
                    }
                    return ParseFileReport {
                        css_calls: 0,
                        cva_calls: 0,
                        sva_calls: 0,
                        jsx_usages: 0,
                        diagnostics: vec![diagnostic],
                    };
                }
            },
            None => source,
        };

        let result = if pattern_transform.is_some() {
            let compiled = self.config.as_ref();
            let mut raw_transform = |name: &str, styles: &Literal| {
                let pattern = compiled.patterns.transform_input(name, styles);
                let Some(transform) = pattern_transform.as_deref_mut() else {
                    return Ok(Some(styles.clone()));
                };
                transform(pattern.name, pattern.styles.as_ref()).map_err(|diagnostic| {
                    with_callback_target(diagnostic, "pattern", pattern.name, None)
                })
            };
            pandacss_extractor::extract_with_pattern_raw_transform(
                source,
                path,
                &self.config.extractor_config,
                &mut raw_transform,
            )
        } else {
            extract(source, path, &self.config.extractor_config)
        };
        let token_refs = result
            .token_refs
            .iter()
            .filter(|token_ref| token_ref.needs_css_var)
            .map(|token_ref| token_ref.path.clone())
            .collect::<Vec<_>>();

        // Per-file export facts feed build-info barrel resolution (project-side).
        let exports = result.exports;

        let mut diagnostics = result.diagnostics;
        let line_index = LineIndex::new(source);
        if let Some(utility) = self.config.utility.as_ref() {
            if !utility.deprecated_props().is_empty() {
                push_deprecated_utility_diagnostics(
                    &result.calls,
                    &result.jsx,
                    utility,
                    &line_index,
                    &mut diagnostics,
                );
            }
            push_invalid_color_opacity_modifier_diagnostics(
                &result.calls,
                &result.jsx,
                utility,
                &line_index,
                &mut diagnostics,
            );
        }
        push_unknown_condition_diagnostics(
            &result.calls,
            &result.jsx,
            &self.config.conditions,
            &line_index,
            &mut diagnostics,
        );
        let mut report = ParseFileReport {
            css_calls: 0,
            cva_calls: 0,
            sva_calls: 0,
            jsx_usages: 0,
            diagnostics: diagnostics.clone(),
        };

        if matches!(mode, ParseMode::Replace) {
            // Drop the previous contribution first; otherwise removed styles
            // survive as ghost atoms in the global view.
            self.drop_file_state(path);
        }
        let path_key: Arc<str> = Arc::from(path);

        let compiled = self.config.as_ref();
        let mut encoder = Encoder::with_conditions(compiled.conditions.clone());
        let mut encoded_recipes = EncodedRecipes::new(compiled.optimize.smart_compound_variants);
        let empty_object = Literal::Object(Vec::new());
        let diagnose_unextractable_calls = !compiled.extractor_config.has_jsx_framework;
        for call in result.calls {
            if diagnose_unextractable_calls
                && call.category != MatchCategory::Recipe
                && call.data.iter().any(Option::is_none)
            {
                report.diagnostics.push(dynamic_style_value_diagnostic(
                    call.category,
                    &call.name,
                    call.span,
                    &line_index,
                ));
            }
            // Move the whole arg vector out so each arm consumes exactly what it
            // needs; `css` takes all args, the rest take theirs by position.
            let data = call.data;
            match (call.category, call.name.as_str()) {
                (MatchCategory::Css, "css") => {
                    // Panda merges every css() arg (last-wins) at runtime, so
                    // emit every arg's atoms, not just the first.
                    let mut processed = false;
                    for arg in data.into_iter().flatten() {
                        self.process_css_arg(&mut encoder, &arg);
                        processed = true;
                    }
                    if processed {
                        report.css_calls += 1;
                    }
                }
                (MatchCategory::Css, "cva") => {
                    let Some(arg) = data.into_iter().next().flatten() else {
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
                    let Some(arg) = data.into_iter().next().flatten() else {
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
                    // A missing or non-object arg (`center()`, dynamic props)
                    // still renders the pattern's base styles — fall back to
                    // the empty object so the transform runs with defaults.
                    let arg = data.into_iter().next().flatten();
                    let arg = arg
                        .as_ref()
                        .filter(|literal| matches!(literal, Literal::Object(_)))
                        .unwrap_or(&empty_object);
                    if let Some(transform) = pattern_transform.as_deref_mut() {
                        let pattern = compiled.patterns.transform_input(&call.name, arg);
                        match transform(pattern.name, pattern.styles.as_ref()) {
                            Ok(Some(style)) => {
                                self.process_style_props(
                                    &mut encoder,
                                    &style,
                                    ShorthandPolicy::Internal,
                                );
                            }
                            Ok(None) => {}
                            Err(diagnostic) => report.diagnostics.push(with_callback_target(
                                diagnostic, "pattern", &call.name, None,
                            )),
                        }
                    }
                }
                (MatchCategory::Recipe, _) => {
                    let arg = data.into_iter().next().flatten();
                    // A non-object arg (scalar / dynamic) carries no variant
                    // selection — fall back to the empty object so base +
                    // defaults still resolve.
                    let arg = arg
                        .as_ref()
                        .filter(|literal| matches!(literal, Literal::Object(_)))
                        .unwrap_or(&empty_object);
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
                        &compiled.breakpoints,
                    );
                }
                (MatchCategory::Jsx, _) => {
                    let mut args = data.into_iter();
                    let arg = args.next().flatten();
                    let second_arg = args.next().flatten();
                    let third_arg = args.next().flatten();
                    if let Some(recipe_name) = call.jsx_recipe_ident.as_deref()
                        && let Some(default_props) = default_props_from_options(third_arg.as_ref())
                    {
                        if let Some(style_props) = compiled
                            .recipes
                            .style_props_for_recipes(&[recipe_name], default_props)
                        {
                            self.process_style_props(
                                &mut encoder,
                                &style_props,
                                ShorthandPolicy::Internal,
                            );
                        }
                        encoded_recipes.process_usage(
                            &compiled.recipes,
                            recipe_name,
                            default_props,
                            &compiled.conditions,
                            &compiled.breakpoints,
                        );
                        report.jsx_usages += 1;
                        continue;
                    }
                    let Some(style) =
                        jsx_factory_static_style(second_arg.as_ref().or(arg.as_ref()))
                    else {
                        continue;
                    };
                    match style {
                        JsxFactoryStaticStyle::Style(style) => {
                            self.process_style_props(
                                &mut encoder,
                                style,
                                ShorthandPolicy::UserFacing,
                            );
                        }
                        JsxFactoryStaticStyle::Recipe(config) => {
                            let Some(recipe) = Recipe::from_literal(config) else {
                                continue;
                            };
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
                        }
                    }
                    report.jsx_usages += 1;
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
                    self.process_style_props(&mut encoder, &style_props, ShorthandPolicy::Internal);
                }
                for recipe_name in &recipe_names {
                    encoded_recipes.process_usage(
                        &compiled.recipes,
                        recipe_name,
                        &jsx.data,
                        &compiled.conditions,
                        &compiled.breakpoints,
                    );
                }
                report.jsx_usages += 1;
                continue;
            }

            let (style, shorthand_policy) =
                if let Some(transform) = pattern_transform.as_deref_mut() {
                    let pattern = compiled.patterns.transform_input(&jsx.name, &jsx.data);
                    match transform(pattern.name, pattern.styles.as_ref()) {
                        Ok(Some(style)) => (style, ShorthandPolicy::Internal),
                        Ok(None) => (jsx.data.clone(), ShorthandPolicy::UserFacing),
                        Err(diagnostic) => {
                            report
                                .diagnostics
                                .push(with_callback_target(diagnostic, "pattern", &jsx.name, None));
                            (jsx.data.clone(), ShorthandPolicy::UserFacing)
                        }
                    }
                } else {
                    (jsx.data.clone(), ShorthandPolicy::UserFacing)
                };
            self.process_style_props(&mut encoder, &style, shorthand_policy);
            report.jsx_usages += 1;
        }

        let mut atoms = encoder.into_atoms();
        let mut utility_styles = FxHashMap::default();
        if let Some(transform) = utility_transform {
            let utility = compiled.utility.as_ref();
            atoms = transform_atoms(
                atoms,
                utility,
                transform,
                &mut utility_styles,
                &mut report.diagnostics,
            );
            encoded_recipes.transform_utilities(
                utility,
                &compiled.conditions,
                &compiled.breakpoints,
                transform,
                &mut report.diagnostics,
            );
        }

        let entry = FileEntry {
            source_hash,
            parse_epoch: self.parse_epoch,
            cacheable: !report
                .diagnostics
                .iter()
                .any(|diagnostic| diagnostic.code == diagnostic_codes::TRANSFORM_CALLBACK_FAILED),
            atoms,
            encoded_recipes,
            utility_styles,
            token_refs,
            exports,
            diagnostics: report.diagnostics.clone(),
            report: report.clone(),
        };
        match mode {
            ParseMode::Replace => self.add_file_state(path_key, entry),
            ParseMode::Additive => self.add_file_state_additive(path_key, entry),
        }
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
        self.parse_file_inner(path, source, None, None, None, ParseMode::Additive);
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
        self.parse_file_inner(
            path,
            source,
            transforms.source,
            transforms.pattern,
            transforms.utility,
            ParseMode::Additive,
        );
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
        self.utility_styles_cache.clear();
        self.utility_styles_counts.clear();
        self.encoded_recipes_cache.clear();
        self.invalidate_stylesheet_snapshots();
        self.inline_recipes.clear();
        self.inline_slot_recipes.clear();
        self.inline_recipe_spans.clear();
        self.inline_slot_recipe_spans.clear();
    }

    /// Invalidate same-source parse short-circuiting while retaining the
    /// current project output. Hosts call this when external transform
    /// callbacks change; the next `parse_file` for any path recomputes even if
    /// source text is unchanged.
    pub fn bump_parse_epoch(&mut self) {
        self.parse_epoch = self.parse_epoch.wrapping_add(1);
    }

    fn drop_file_state(&mut self, path: &str) {
        self.remove_file_entry(path);
        self.drop_recipes_for(path);
    }

    /// Store a recipe snapshot hydrated from build info, keyed by source library
    /// name (re-hydration replaces). Merged into the emit snapshot in
    /// [`Self::stylesheet_snapshots`].
    pub(crate) fn set_hydrated_recipes(&mut self, name: &str, snapshot: EncodedRecipesSnapshot) {
        self.invalidate_stylesheet_snapshots();
        if snapshot.base.is_empty() && snapshot.variants.is_empty() && snapshot.atomic.is_empty() {
            self.hydrated_recipes.remove(name);
        } else {
            self.hydrated_recipes.insert(Arc::from(name), snapshot);
        }
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
        for (key, styles) in &entry.utility_styles {
            let count = self.utility_styles_counts.entry(key.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                self.utility_styles_cache
                    .insert(key.clone(), styles.clone());
            }
        }
        self.encoded_recipes_cache.add_from(&entry.encoded_recipes);
        self.files.insert(path, entry);
    }

    fn add_file_state_additive(&mut self, path: Arc<str>, entry: FileEntry) {
        if !self.files.contains_key(&path) {
            self.add_file_state(path, entry);
            return;
        }

        self.invalidate_stylesheet_snapshots();
        let mut missing_atoms = Vec::new();
        let mut missing_utility_styles = Vec::new();
        let missing_recipes = {
            let existing = self
                .files
                .get_mut(&path)
                .expect("file presence checked before mutation");
            for atom in &entry.atoms {
                if existing.atoms.insert(atom.clone()) {
                    missing_atoms.push(atom.clone());
                }
            }
            for (key, styles) in &entry.utility_styles {
                if !existing.utility_styles.contains_key(key) {
                    existing.utility_styles.insert(key.clone(), styles.clone());
                    missing_utility_styles.push((key.clone(), styles.clone()));
                }
            }
            let missing_recipes = existing
                .encoded_recipes
                .extend_missing_from(&entry.encoded_recipes);
            existing.source_hash = entry.source_hash;
            existing.parse_epoch = entry.parse_epoch;
            existing.cacheable = entry.cacheable;
            existing.token_refs = entry.token_refs;
            existing.exports = entry.exports;
            existing.diagnostics = entry.diagnostics;
            existing.report = entry.report;
            missing_recipes
        };

        for atom in missing_atoms {
            let count = self.atom_counts.entry(atom.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                self.atoms_cache.insert(atom);
            }
        }

        for (key, styles) in missing_utility_styles {
            let count = self.utility_styles_counts.entry(key.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                self.utility_styles_cache.insert(key, styles);
            }
        }

        self.encoded_recipes_cache.add_from(&missing_recipes);
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
        for key in entry.utility_styles.keys() {
            if let Some(count) = self.utility_styles_counts.get_mut(key) {
                *count -= 1;
                if *count == 0 {
                    self.utility_styles_counts.remove(key);
                    self.utility_styles_cache.remove(key);
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
        self.token_refs_snapshot_cache = None;
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

    fn process_atomic(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        style: &Literal,
        policy: ShorthandPolicy,
    ) {
        let _span = tracing::trace_span!("encoding_atomic").entered();
        let normalizer = StyleNormalizer::new(
            self.config.utility.as_ref(),
            &self.config.breakpoints,
            policy,
        );
        encoder.process_atomic_with(style, &normalizer);
    }

    /// One `css()` arg. At the argument level an array is a merge-list of style
    /// objects (not a responsive array) and a conditional (`cond ? a : b`) could
    /// resolve to either branch — and each branch is itself an arg, so an array
    /// inside a branch stays a merge-list too. Recurse into both, treating each
    /// element/branch as its own arg; only style objects reach `process_atomic`
    /// (where the encoder still expands any *value*-level conditionals).
    fn process_css_arg(&self, encoder: &mut Encoder<ProjectConditionMatcher>, arg: &Literal) {
        match arg {
            Literal::Array(items) | Literal::Conditional(items) => {
                for item in items {
                    if !matches!(item, Literal::Null | Literal::Bool(false)) {
                        self.process_css_arg(encoder, item);
                    }
                }
            }
            _ => self.process_atomic(encoder, arg, ShorthandPolicy::UserFacing),
        }
    }

    fn process_style_props(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        style: &Literal,
        policy: ShorthandPolicy,
    ) {
        let _span = tracing::trace_span!("encoding_style_props").entered();
        let Literal::Object(entries) = style else {
            self.process_atomic(encoder, style, policy);
            return;
        };

        let mut rest = Vec::with_capacity(entries.len());
        for (key, value) in entries {
            if is_css_prop(key) {
                self.process_nested_css_prop(encoder, value, policy);
            } else {
                rest.push((key.clone(), value.clone()));
            }
        }

        if !rest.is_empty() {
            self.process_atomic(encoder, &Literal::Object(rest), policy);
        }
    }

    fn process_nested_css_prop(
        &self,
        encoder: &mut Encoder<ProjectConditionMatcher>,
        value: &Literal,
        policy: ShorthandPolicy,
    ) {
        match value {
            Literal::Array(items) => {
                for item in items {
                    if !matches!(item, Literal::Null) {
                        self.process_atomic(encoder, item, policy);
                    }
                }
            }
            Literal::Null | Literal::Bool(false) => {}
            _ => self.process_atomic(encoder, value, policy),
        }
    }

    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms_cache
    }

    #[must_use]
    pub fn resolve_utility_value(
        &self,
        prop: &str,
        value: &Literal,
    ) -> Option<ResolvedUtilityValue> {
        self.config
            .utility()
            .and_then(|utility| utility.resolve_utility_value(prop, value))
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
    #[allow(
        clippy::missing_panics_doc,
        reason = "snapshot caches are populated immediately above the expects"
    )]
    pub fn stylesheet_snapshots(
        &mut self,
        user_config: &UserConfig,
    ) -> ProjectStylesheetSnapshots<'_> {
        self.stylesheet_snapshots_inner(user_config, None)
    }

    pub fn stylesheet_snapshots_with_utility_transform(
        &mut self,
        user_config: &UserConfig,
        utility_transform: &mut UtilityTransformFn<'_>,
    ) -> ProjectStylesheetSnapshots<'_> {
        self.stylesheet_snapshots_inner(user_config, Some(utility_transform))
    }

    fn stylesheet_snapshots_inner(
        &mut self,
        user_config: &UserConfig,
        mut utility_transform: Option<&mut UtilityTransformFn<'_>>,
    ) -> ProjectStylesheetSnapshots<'_> {
        if self.atoms_snapshot_cache.is_none() {
            let mut atoms = self.atoms_cache.iter().cloned().collect::<Vec<_>>();
            atoms.sort_by(compare_atoms_by_emit_order);
            self.atoms_snapshot_cache = Some(atoms);
        }
        if self.encoded_recipes_snapshot_cache.is_none() {
            let mut snapshot = self.encoded_recipes_cache.view().snapshot();
            // Merge externally hydrated recipes (from build info) into the emit
            // snapshot. Sorted by source name so multi-library output is stable.
            let mut names: Vec<&Arc<str>> = self.hydrated_recipes.keys().collect();
            names.sort();
            for name in names {
                let hydrated = &self.hydrated_recipes[name];
                snapshot.base.extend(hydrated.base.iter().cloned());
                snapshot.variants.extend(hydrated.variants.iter().cloned());
                snapshot.atomic.extend(hydrated.atomic.iter().cloned());
            }
            self.encoded_recipes_snapshot_cache = Some(snapshot);
        }
        if self.token_refs_snapshot_cache.is_none() {
            let mut token_refs = self
                .files
                .values()
                .flat_map(|entry| entry.token_refs.iter().cloned())
                .collect::<Vec<_>>();
            token_refs.sort();
            token_refs.dedup();
            self.token_refs_snapshot_cache = Some(token_refs);
        }
        let static_cache_matches = self
            .static_encoded_recipes_snapshot_cache
            .as_ref()
            .is_some_and(|(static_css, transformed, _)| {
                static_css == &user_config.static_css && *transformed == utility_transform.is_some()
            });
        if !static_cache_matches {
            let mut encoded = EncodedRecipes::default();
            self.config.recipes.process_static_css(
                &mut encoded,
                user_config,
                &self.config.conditions,
                &self.config.breakpoints,
            );
            if let Some(transform) = utility_transform.as_deref_mut() {
                let mut diagnostics = Vec::new();
                encoded.transform_utilities(
                    self.config.utility.as_ref(),
                    &self.config.conditions,
                    &self.config.breakpoints,
                    transform,
                    &mut diagnostics,
                );
            }
            self.static_encoded_recipes_snapshot_cache = Some((
                user_config.static_css.clone(),
                utility_transform.is_some(),
                encoded.snapshot(),
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
                .map(|(_, _, snapshot)| snapshot)
                .expect("static recipe snapshot was initialized"),
            token_refs: self
                .token_refs_snapshot_cache
                .as_deref()
                .expect("token refs snapshot was initialized"),
            utility_styles: &self.utility_styles_cache,
        }
    }

    #[must_use]
    pub fn diagnostics(&self) -> &[Diagnostic] {
        &self.config_diagnostics
    }

    #[must_use]
    pub fn file_diagnostics(&self) -> Vec<&Diagnostic> {
        let mut files = self.files.iter().collect::<Vec<_>>();
        files.sort_by(|(left, _), (right, _)| left.cmp(right));
        files
            .into_iter()
            .flat_map(|(_, entry)| entry.diagnostics.iter())
            .collect()
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
            && self.hydrated_recipes.is_empty()
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

    /// Engine-owned fingerprint of the resolved config's output-affecting fields,
    /// stamped into [`BuildInfo`] as `configFingerprint`.
    #[must_use]
    pub fn config_fingerprint(&self) -> &str {
        &self.config_fingerprint
    }
}

fn is_css_prop(key: &str) -> bool {
    key == "css" || key.ends_with("Css")
}

enum JsxFactoryStaticStyle<'a> {
    Style(&'a Literal),
    Recipe(&'a Literal),
}

fn default_props_from_options(options: Option<&Literal>) -> Option<&Literal> {
    literal_entries(options?)?
        .iter()
        .find_map(|(key, value)| (key == "defaultProps").then_some(value))
}

fn jsx_factory_static_style(config: Option<&Literal>) -> Option<JsxFactoryStaticStyle<'_>> {
    let config = config?;
    let Literal::Object(entries) = config else {
        return None;
    };

    let has_recipe_config = entries.iter().any(|(key, _)| {
        matches!(
            key.as_str(),
            "base" | "variants" | "defaultVariants" | "compoundVariants"
        )
    });
    Some(if has_recipe_config {
        JsxFactoryStaticStyle::Recipe(config)
    } else {
        JsxFactoryStaticStyle::Style(config)
    })
}

/// Scan source files via the platform filesystem engine and hand each
/// `(path, source)` to `parse`. Globs `opts` through `fs`, reads every match,
/// and skips files that fail to read. Returns the number of files handed to
/// `parse`.
///
/// The caller supplies `parse` (rather than this fn owning a [`Project`]) so the
/// binding layer can wire its per-call transform callbacks, or — when it needs
/// to interleave with `&mut self` — collect `(path, source)` pairs first and
/// parse them in a second pass.
///
/// # Errors
/// Propagates an I/O error from the initial glob (e.g. a non-existent `cwd`).
pub fn scan_files<F, P>(
    fs: &F,
    opts: &pandacss_fs::GlobOptions,
    mut parse: P,
) -> std::io::Result<usize>
where
    F: pandacss_fs::FileSystem,
    P: FnMut(&str, &str),
{
    let _span = tracing::trace_span!("scan").entered();
    let mut count = 0;
    for path in fs.glob(opts)? {
        let Ok(source) = fs.read_to_string(&path) else {
            continue;
        };
        parse(path.to_string_lossy().as_ref(), &source);
        count += 1;
    }
    Ok(count)
}

pub type PatternTransformFn<'a> =
    dyn FnMut(&str, &Literal) -> std::result::Result<Option<Literal>, Diagnostic> + 'a;

pub type SourceTransformFn<'a> =
    dyn FnMut(&str, &str) -> std::result::Result<Option<String>, Diagnostic> + 'a;

/// JS `transform` for a custom utility: `(prop, resolved_value, original_value)`
/// → raw style object (NOT decomposed atoms; className/layer stay with the
/// [`Utility`]). `Ok(None)` = no transform for this prop, keep the atom.
pub type UtilityTransformFn<'a> = dyn FnMut(&str, &AtomValue, &AtomValue) -> std::result::Result<Option<Literal>, Diagnostic>
    + 'a;

/// Per-call transform callbacks for [`Project::parse_file_with`] /
/// [`Project::refresh_file_with`]. The binding layer builds these fresh per
/// call (the closures capture the per-call JS environment), so they're passed
/// in rather than stored on the project.
#[derive(Default)]
pub struct ParseTransforms<'a> {
    pub source: Option<&'a mut SourceTransformFn<'a>>,
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
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
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

/// Warn on `_`-prefixed style keys that aren't a known condition (typos like
/// `_hovr`). The encoder drops these — see `pandacss_encoder::atom_from_path` —
/// so this surfaces the user's mistake instead of silently emitting nothing.
fn push_unknown_condition_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    conditions: &ProjectConditionMatcher,
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
) {
    let mut seen: Vec<String> = Vec::new();
    for call in calls {
        seen.clear();
        for lit in call.data.iter().flatten() {
            collect_unknown_conditions(lit, conditions, &mut seen);
        }
        for key in seen.drain(..) {
            out.push(unknown_condition_diagnostic(
                &key, conditions, call.span, line_index,
            ));
        }
    }
    for entry in jsx {
        seen.clear();
        collect_unknown_conditions(&entry.data, conditions, &mut seen);
        for key in seen.drain(..) {
            out.push(unknown_condition_diagnostic(
                &key, conditions, entry.span, line_index,
            ));
        }
    }
}

fn collect_unknown_conditions(
    value: &Literal,
    conditions: &ProjectConditionMatcher,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                if key.starts_with('_')
                    && !conditions.is_condition(key)
                    && !out.iter().any(|seen| seen == key)
                {
                    out.push(key.clone());
                }
                collect_unknown_conditions(child, conditions, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_unknown_conditions(item, conditions, out);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
    }
}

fn unknown_condition_diagnostic(
    key: &str,
    conditions: &ProjectConditionMatcher,
    span: pandacss_extractor::Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    let suggestion =
        pandacss_shared::closest_match(key, conditions.names().filter(|n| n.starts_with('_')))
            .map(|name| format!(", did you mean `{name}`?"))
            .unwrap_or_default();
    let mut diagnostic = Diagnostic::warning(
        diagnostic_codes::UNKNOWN_CONDITION,
        format!("unknown condition `{key}`{suggestion}"),
    );
    diagnostic.span = Some(span);
    diagnostic.location = Some(line_index.locate_range(span.start, span.end));
    diagnostic
}

fn push_invalid_color_opacity_modifier_diagnostics(
    calls: &[ExtractedCall],
    jsx: &[ExtractedJsx],
    utility: &Utility,
    line_index: &LineIndex<'_>,
    out: &mut Vec<Diagnostic>,
) {
    let mut values = Vec::new();
    for call in calls {
        values.clear();
        for lit in call.data.iter().flatten() {
            collect_invalid_color_opacity_modifiers(lit, utility, &mut values);
        }
        for value in values.drain(..) {
            out.push(invalid_color_opacity_modifier_diagnostic(
                &value, call.span, line_index,
            ));
        }
    }
    for entry in jsx {
        values.clear();
        collect_invalid_color_opacity_modifiers(&entry.data, utility, &mut values);
        for value in values.drain(..) {
            out.push(invalid_color_opacity_modifier_diagnostic(
                &value, entry.span, line_index,
            ));
        }
    }
}

fn collect_invalid_color_opacity_modifiers(
    value: &Literal,
    utility: &Utility,
    out: &mut Vec<String>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, child) in entries {
                let canonical = utility.resolve_shorthand(key);
                if utility.token_category(canonical) == Some("colors")
                    && let Literal::String(value) | Literal::Token { value, .. } = child
                    && utility.is_invalid_color_opacity_modifier(value)
                    && !out.contains(value)
                {
                    out.push(value.clone());
                }
                collect_invalid_color_opacity_modifiers(child, utility, out);
            }
        }
        Literal::Array(items) | Literal::Conditional(items) => {
            for item in items {
                collect_invalid_color_opacity_modifiers(item, utility, out);
            }
        }
        Literal::String(_)
        | Literal::Token { .. }
        | Literal::Number(_)
        | Literal::Bool(_)
        | Literal::Null => {}
    }
}

fn invalid_color_opacity_modifier_diagnostic(
    value: &str,
    span: pandacss_extractor::Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    let mut diagnostic = Diagnostic::warning(
        diagnostic_codes::INVALID_COLOR_OPACITY_MODIFIER,
        format!(
            "Color value `{value}` has an invalid opacity modifier; expected a number (e.g. `40`) or an opacity token (e.g. `half`)"
        ),
    );
    diagnostic.span = Some(span);
    diagnostic.location = Some(line_index.locate_range(span.start, span.end));
    diagnostic
}

/// Run the JS transform per atom WITHOUT decomposing: the atom carries
/// `(prop, value, conditions, important)`, and the returned style object is
/// recorded in `overrides` for the emitter to swap in as one grouped class.
fn transform_atoms(
    atoms: FxHashSet<Atom>,
    utility: Option<&Utility>,
    transform: &mut UtilityTransformFn<'_>,
    overrides: &mut FxHashMap<UtilityStyleKey, Literal>,
    diagnostics: &mut Vec<Diagnostic>,
) -> FxHashSet<Atom> {
    let mut out = FxHashSet::default();
    for atom in atoms {
        let resolved = resolved_atom_value(utility, atom.prop(), atom.value());
        match transform(atom.prop(), &resolved, atom.value()) {
            // Empty result drops the carrier atom — parity with node, which
            // emits nothing for a transform that returns `{}`.
            Ok(Some(styles)) if is_empty_style_object(&styles) => {}
            Ok(Some(styles)) => {
                overrides.insert((Box::from(atom.prop()), atom.value().clone()), styles);
                out.insert(atom);
            }
            // No transform registered for this prop — keep the atom verbatim.
            Ok(None) => {
                out.insert(atom);
            }
            Err(diagnostic) => {
                diagnostics.push(with_callback_target(
                    diagnostic,
                    "utility",
                    atom.prop(),
                    Some(&atom_value_summary(atom.value())),
                ));
            }
        }
    }
    out
}

/// The `values`-resolved value to feed the transform (`spacing.4` →
/// `var(--spacing-4)`); returns the original verbatim (type preserved) when no
/// category matches.
pub(crate) fn resolved_atom_value(
    utility: Option<&Utility>,
    prop: &str,
    value: &AtomValue,
) -> AtomValue {
    let raw = match value {
        AtomValue::String(raw) | AtomValue::Number(raw) | AtomValue::Token { value: raw, .. } => {
            raw
        }
        AtomValue::Bool(_) | AtomValue::Null => return value.clone(),
    };
    let Some(utility) = utility else {
        return value.clone();
    };
    let resolved = utility.resolve_values_value(prop, raw);
    if resolved.as_str() == raw.as_ref() {
        value.clone()
    } else {
        AtomValue::String(resolved.into())
    }
}

pub(crate) fn is_empty_style_object(styles: &Literal) -> bool {
    matches!(styles, Literal::Object(entries) if entries.is_empty())
}

fn dynamic_style_value_diagnostic(
    category: MatchCategory,
    name: &str,
    span: pandacss_extractor::Span,
    line_index: &LineIndex<'_>,
) -> Diagnostic {
    let mut diagnostic = Diagnostic::warning(
        diagnostic_codes::PANDA_CALL_UNEXTRACTABLE,
        format!(
            "{category:?} call `{name}` received a dynamic argument, so no static CSS was generated for this call"
        ),
    );
    diagnostic.span = Some(span);
    diagnostic.location = Some(line_index.locate_range(span.start, span.end));
    diagnostic
}

fn with_callback_target(
    mut diagnostic: Diagnostic,
    kind: &str,
    name: &str,
    value: Option<&str>,
) -> Diagnostic {
    if diagnostic.code != diagnostic_codes::TRANSFORM_CALLBACK_FAILED {
        return diagnostic;
    }
    let target = value.map_or_else(
        || format!("{kind} `{name}`"),
        |value| format!("{kind} `{name}` with value `{value}`"),
    );
    diagnostic.message = format!("{} ({target})", diagnostic.message);
    diagnostic
}

fn atom_value_summary(value: &AtomValue) -> String {
    match value {
        AtomValue::String(value) | AtomValue::Number(value) | AtomValue::Token { value, .. } => {
            value.to_string()
        }
        AtomValue::Bool(value) => value.to_string(),
        AtomValue::Null => "null".to_owned(),
    }
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
