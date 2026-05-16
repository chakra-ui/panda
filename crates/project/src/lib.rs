//! High-level project façade — the recommended entry point for Rust
//! consumers and the binding layer.
//!
//! `PandaProject` ties the lower-level pieces (extractor, recipes, encoder)
//! into a single stateful object you feed source files to. Each
//! `parse_file` call extracts usages, decomposes any `cva()` / `sva()`
//! recipes, and feeds the resulting style objects into a shared atomic
//! encoder. [`PandaProject::atoms`] returns the deduplicated set the
//! emitter consumes; the global view is always the union of every
//! currently-known file, so removed or replaced files never leave ghost
//! atoms in watch mode.
//!
//! ```rust,ignore
//! use project::PandaProject;
//! use extractor::{Matchers, Matcher, NameMatcher};
//!
//! let matchers = Matchers {
//!     css: Matcher {
//!         modules: vec!["@panda/css".into()],
//!         names: NameMatcher::only(["css", "cva", "sva"]),
//!     },
//!     ..Default::default()
//! };
//!
//! let mut project = PandaProject::new(matchers);
//! project.parse_file("button.tsx", "import {{ css }} from '@panda/css'; css({{ color: 'red' }});");
//! project.parse_file("card.tsx", /* … */);
//!
//! let atoms = project.atoms();          // deduped across both files
//! let recipes = project.recipes();      // every cva/sva encountered
//! let summary = project.summary();      // counts for tooling / reporting
//! ```

use std::collections::BTreeMap;

use rustc_hash::{FxHashMap, FxHashSet};

use encoder::{Atom, Encoder};
use extractor::{CrossFileResolver, ExtractorConfig, Matchers, TokenDictionary, extract};
use recipes::{Recipe, SlotRecipe};

/// One Panda project. Hold one per build / dev-server session and feed
/// every file through `parse_file`.
pub struct PandaProject {
    config: ExtractorConfig,
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

impl PandaProject {
    #[must_use]
    pub fn new(matchers: Matchers) -> Self {
        Self::from_config(ExtractorConfig::new(matchers))
    }

    #[must_use]
    pub fn from_config(config: ExtractorConfig) -> Self {
        Self {
            config,
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

        let mut encoder = Encoder::new();
        for call in &result.calls {
            let Some(arg) = call.data.first().and_then(|d| d.as_ref()) else {
                continue;
            };
            match call.name.as_str() {
                "css" => {
                    encoder.process_atomic(arg);
                    report.css_calls += 1;
                }
                "cva" => {
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
                "sva" => {
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
                _ => {}
            }
        }

        for jsx in &result.jsx {
            encoder.process_atomic(&jsx.data);
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

    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms_cache
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
}

/// Borrowed read-only view of one parsed file. **Read-only by design** —
/// unlike ts-morph's `SourceFile`, this view does not mutate, copy, move,
/// save, or emit; Panda is an extractor, not a codemod toolkit. Re-process
/// via [`PandaProject::refresh_file`] / [`PandaProject::parse_file`].
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

pub use encoder::{AtomValue, ConditionMatcher, DefaultConditions};
pub use extractor::Literal as ExtractedLiteral;
pub use extractor::{
    Diagnostic, DiagnosticSeverity, Matcher, NameMatcher, SourceLocation, SourceRange, Span,
};
pub use recipes::{
    CompoundVariant, SlotCompoundVariant, SlotVariantGroup, SlotVariantOption, VariantGroup,
    VariantOption,
};
