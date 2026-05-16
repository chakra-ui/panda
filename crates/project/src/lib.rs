//! High-level project façade — the recommended entry point for
//! Rust consumers and the binding layer.
//!
//! `PandaProject` ties together the lower-level pieces (extractor,
//! recipes, encoder) into a single stateful object you feed source
//! files to. Each `parse_file` call extracts usages, decomposes any
//! `cva()` / `sva()` recipes, and feeds the resulting style objects
//! into a shared atomic encoder. When you're done, [`Self::atoms`]
//! returns the deduplicated set the emitter consumes.
//!
//! ## DX shape
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
//!
//! Cross-file imports and a token dictionary are opt-in via builder
//! methods so the simple "no plugins" case stays simple.

use std::collections::BTreeMap;

use rustc_hash::{FxHashMap, FxHashSet};

use encoder::{Atom, Encoder};
use extractor::{CrossFileResolver, ExtractorConfig, Matchers, TokenDictionary, extract};
use recipes::{Recipe, SlotRecipe};

/// One Panda project. Hold one per build / dev-server session and
/// feed every file through `parse_file`. Internally owns:
///
/// - an [`ExtractorConfig`] (matchers + optional token dictionary +
///   optional cross-file resolver),
/// - a per-file atom registry plus a deduplicated union view,
/// - registries of every named [`Recipe`] / [`SlotRecipe`] seen so
///   far (for tooling / report flows).
///
/// ## Watch-mode semantics
///
/// Atoms are stored per file. Re-adding a path replaces that file's
/// contribution; [`Self::remove_file`] drops it entirely. The global
/// view returned by [`Self::atoms`] is always the union of every
/// currently-known file — no stale atoms linger when a style is
/// deleted or renamed.
pub struct PandaProject {
    config: ExtractorConfig,
    /// Per-file compile state — atoms produced by a single fresh
    /// [`Encoder`] plus the diagnostics surfaced for that file.
    /// Within-file atom dedup is already applied; across files, see
    /// `atoms_cache`.
    files: FxHashMap<String, FileEntry>,
    /// Deduplicated union of every value in `files`. Rebuilt eagerly on
    /// every add / remove so [`Self::atoms`] can hand out a stable
    /// `&FxHashSet` borrow without recomputing on the read.
    atoms_cache: FxHashSet<Atom>,
    /// Every `cva(...)` extracted, keyed by `(file, span)`. Re-adding a
    /// path drops every entry with `file == path` first, then inserts
    /// fresh ones — span shifts (line edits) don't leave orphans.
    recipes: BTreeMap<RecipeKey, Recipe>,
    slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
}

/// Internal per-file bucket. Kept private so we can change the shape
/// (e.g., add cached `LineIndex`, structured stats) without disturbing
/// callers — [`ParsedFile`] is the public read view.
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
    /// Build a project with the import-matching config and default
    /// runtime state (no token dictionary, no cross-file resolver).
    #[must_use]
    pub fn new(matchers: Matchers) -> Self {
        Self::from_config(ExtractorConfig::new(matchers))
    }

    /// Build from a fully-formed `ExtractorConfig` — useful when you
    /// already have a token dictionary and / or cross-file resolver
    /// configured upstream.
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

    /// Builder-style attach a [`TokenDictionary`].
    #[must_use]
    pub fn with_token_dictionary(mut self, dictionary: TokenDictionary) -> Self {
        self.config.token_dictionary = Some(dictionary);
        self
    }

    /// Builder-style attach a [`CrossFileResolver`].
    #[must_use]
    pub fn with_cross_file(mut self, resolver: CrossFileResolver) -> Self {
        self.config.cross_file = Some(resolver);
        self
    }

    /// Parse one source file: extract usages, decompose recipes, and
    /// encode atoms into the per-file bucket. Re-parsing a path
    /// replaces the previous bucket (including its recipes) so stale
    /// styles can't linger in watch mode. Returns a per-file
    /// [`FileReport`] for tooling that wants to see exactly what flowed
    /// through.
    pub fn parse_file(&mut self, path: &str, source: &str) -> FileReport {
        let result = extract(source, path, &self.config);
        let mut report = FileReport {
            css_calls: 0,
            cva_calls: 0,
            sva_calls: 0,
            jsx_usages: 0,
            diagnostics: result.diagnostics.clone(),
        };

        // Drop the previous contribution from this path before
        // reprocessing — without this, removed styles would survive as
        // ghost atoms in the global view.
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

    /// Re-parse a file *only if* it is already known. Returns `true`
    /// when the file was present and got re-parsed, `false` when
    /// `path` isn't in the project (no-op).
    ///
    /// Watch-mode contract: filter file-change events through this and
    /// edits to unrelated files (vendored sources, generated output,
    /// anything never explicitly parsed) are ignored automatically.
    pub fn refresh_file(&mut self, path: &str, source: &str) -> bool {
        if !self.files.contains_key(path) {
            return false;
        }
        self.parse_file(path, source);
        true
    }

    /// Borrowed view over everything the project knows about one file
    /// — its path metadata, atoms, diagnostics, and any recipes / slot
    /// recipes extracted from it. `None` if the path was never parsed
    /// (or was removed).
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

    /// Drop everything contributed by `path` — atoms, recipes, slot
    /// recipes, diagnostics — and rebuild the global atom view.
    /// Returns `true` if the path was known to the project. Cheap when
    /// the path isn't present (no rebuild work).
    pub fn remove_file(&mut self, path: &str) -> bool {
        let had_file = self.files.remove(path).is_some();
        let recipes_dropped = self.drop_recipes_for(path);
        if had_file {
            self.rebuild_atoms_cache();
            true
        } else {
            // Defensive: in principle a path can have recipes without
            // a file entry (e.g., a future API that records recipes
            // separately). Rebuild only when something actually
            // changed to avoid the union pass on a no-op.
            recipes_dropped
        }
    }

    /// Clear *every* path's state. Equivalent to `remove_file` for each
    /// known path but in one pass — useful when the user's config
    /// changed and the whole project needs to be re-fed without
    /// dropping the [`ExtractorConfig`].
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
        // Sized to the largest single-file bucket as a starting point;
        // grows on insert if multiple files contribute distinct atoms.
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

    /// Deduplicated atoms across every file currently in the project.
    /// Always reflects the present state — atoms for removed or
    /// replaced files are absent.
    #[must_use]
    pub fn atoms(&self) -> &FxHashSet<Atom> {
        &self.atoms_cache
    }

    /// Every `cva()` recipe seen so far, keyed by (file, span).
    /// Iteration order is stable (`BTreeMap` by key).
    pub fn recipes(&self) -> impl Iterator<Item = (&str, u32, &Recipe)> + '_ {
        self.recipes
            .iter()
            .map(|(k, v)| (k.file.as_str(), k.span_start, v))
    }

    /// Every `sva()` slot-recipe seen so far.
    pub fn slot_recipes(&self) -> impl Iterator<Item = (&str, u32, &SlotRecipe)> + '_ {
        self.slot_recipes
            .iter()
            .map(|(k, v)| (k.file.as_str(), k.span_start, v))
    }

    /// Aggregate counts across the project — handy for tooling /
    /// reporting flows. Cheap; doesn't recompute anything.
    ///
    /// `files_processed` is the *current* unique file count, not a
    /// cumulative call counter — a `remove_file` decrements it and
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

/// Borrowed read-only view of one parsed file. Returned by
/// [`PandaProject::get_file`]; lifetime is tied to the project so the
/// view stays cheap (no cloning).
///
/// **Read-only by design.** Unlike ts-morph's `SourceFile`, this view
/// does not mutate, copy, move, save, or emit anything — Panda is an
/// extractor, not a codemod toolkit. Methods are limited to *path
/// metadata*, *extraction results*, and *diagnostics*. If you need to
/// re-process the file, call [`PandaProject::refresh_file`] or
/// [`PandaProject::parse_file`].
///
/// The recipe iterators filter the project-wide registries by path on
/// the fly. That's fine at the volumes we see — typical files have
/// 0-3 recipes — and keeps the data in one canonical place.
pub struct ParsedFile<'a> {
    path: &'a str,
    atoms: &'a FxHashSet<Atom>,
    diagnostics: &'a [Diagnostic],
    recipes: &'a BTreeMap<RecipeKey, Recipe>,
    slot_recipes: &'a BTreeMap<RecipeKey, SlotRecipe>,
}

impl<'a> ParsedFile<'a> {
    /// The full path this view was looked up by.
    #[must_use]
    pub fn path(&self) -> &'a str {
        self.path
    }

    /// Final path segment — `"button.tsx"` for `"src/ui/button.tsx"`.
    /// Falls back to the full path when there is no separator. Pure
    /// `std::path::Path` op; zero allocations.
    #[must_use]
    pub fn basename(&self) -> &'a str {
        std::path::Path::new(self.path)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or(self.path)
    }

    /// File extension without the leading dot — `"tsx"` for
    /// `"button.tsx"`, `""` for an extensionless file. Note: this
    /// differs from ts-morph's `getExtension()` which returns
    /// `".tsx"` (with the dot). We follow Rust convention to keep
    /// the borrow zero-allocation.
    #[must_use]
    pub fn extension(&self) -> &'a str {
        std::path::Path::new(self.path)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
    }

    /// Parent directory path — `"src/ui"` for `"src/ui/button.tsx"`,
    /// `""` for a bare file name. Always a borrow into `self.path()`.
    #[must_use]
    pub fn directory(&self) -> &'a str {
        std::path::Path::new(self.path)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or("")
    }

    /// Deduplicated atoms this file contributed.
    #[must_use]
    pub fn atoms(&self) -> &'a FxHashSet<Atom> {
        self.atoms
    }

    /// Parse / extraction diagnostics surfaced for this file. Empty
    /// when the file parsed cleanly. Each [`Diagnostic`] carries a
    /// span and a 1-indexed line/column range, ready to surface to a
    /// user.
    #[must_use]
    pub fn diagnostics(&self) -> &'a [Diagnostic] {
        self.diagnostics
    }

    /// Every `cva(...)` recipe in this file, paired with its source
    /// span. Stable order (`BTreeMap` by `span_start`).
    pub fn recipes(&self) -> impl Iterator<Item = (u32, &'a Recipe)> + 'a {
        let path = self.path;
        self.recipes
            .iter()
            .filter(move |(k, _)| k.file == path)
            .map(|(k, v)| (k.span_start, v))
    }

    /// Every `sva(...)` slot recipe in this file, paired with its
    /// source span.
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
    /// Parse / extraction diagnostics surfaced for this file. Empty
    /// when the file parsed cleanly. The project also keeps a copy
    /// keyed by path — fetch later via [`PandaProject::get_file`] and
    /// [`ParsedFile::diagnostics`].
    pub diagnostics: Vec<Diagnostic>,
}

/// Aggregate counts across every file the project has seen.
#[derive(Debug, Clone, PartialEq, Eq, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub files_processed: usize,
    pub atom_count: usize,
    pub recipe_count: usize,
    pub slot_recipe_count: usize,
}

// Re-export the most common types so consumers can `use project::*`
// instead of digging through three crates. Concrete types stay in
// their owning crates — this is just an ergonomic alias layer.
pub use encoder::{AtomValue, ConditionMatcher, DefaultConditions};
pub use extractor::{
    Diagnostic, DiagnosticSeverity, Matcher, NameMatcher, SourceLocation, SourceRange, Span,
};
pub use recipes::{
    CompoundVariant, SlotCompoundVariant, SlotVariantGroup, SlotVariantOption, VariantGroup,
    VariantOption,
};

// `Literal` is already brought into scope via `use extractor::…` at
// the top of the module; consumers can reach it as `project::Literal`
// because that import is `pub` via the `use` statement below.
pub use extractor::Literal as ExtractedLiteral;
