//! `panda.buildinfo.json` — the serialized encoder state a design-system library
//! ships so a consuming app hydrates its pre-extracted styles without
//! re-extracting (Linear OSS-2355). Condensed via a string intern table +
//! positional atom encoding; per-module atom indices drive tree-shaking (the
//! consumer hydrates only the modules it imports). See
//! `design-notes/build-info.md`.

use std::collections::BTreeMap;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;

use pandacss_encoder::{
    Atom, AtomValue, ConditionList, EncodedRecipesSnapshot, RecipeStyleEntry,
    RecipeStyleGroupSnapshot,
};
use pandacss_extractor::ExportInfo;
use rustc_hash::{FxHashMap, FxHashSet};
use serde::{Deserialize, Serialize};

use crate::recipes::EncodedRecipes;
use crate::{FileEntry, ParseFileReport};

/// Bumped when the on-disk shape changes; a consumer with a different
/// `SCHEMA_VERSION` falls back to re-extracting the library's source.
pub const SCHEMA_VERSION: u32 = 2;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BuildInfo {
    pub schema_version: u32,
    /// Peer Panda version range the artifact was built against (collision guard).
    pub panda: String,
    /// Engine fingerprint of the producing library's output-affecting config.
    pub config_fingerprint: String,
    /// Intern table — every prop / condition / value string is referenced by index.
    pub strings: Vec<String>,
    pub atoms: Vec<BuildAtom>,
    /// Interned recipe / slot-recipe styles. Omitted when the library has none.
    #[serde(default, skip_serializing_if = "BuildRecipes::is_empty")]
    pub recipes: BuildRecipes,
    /// Per published module (source-file key) → indices into `atoms` /
    /// `recipes`. Lets the consumer hydrate only imported modules.
    pub modules: BTreeMap<String, ModuleEntry>,
    /// Exported component name → module key, for modules that contribute styles
    /// (atoms or recipes). Lets a consumer resolve a barrel import
    /// (`import { Button } from '@acme/ds'`) to the module it must hydrate.
    /// Omitted when empty.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub exports: BTreeMap<String, String>,
}

/// Recipe + slot-recipe groups, mirroring `EncodedRecipesSnapshot` but interned.
/// Base groups index `[0, base.len())`, variant groups continue from there — the
/// combined index is what `ModuleEntry.recipes` references.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct BuildRecipes {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub base: Vec<BuildRecipeGroup>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub variants: Vec<BuildRecipeGroup>,
    /// Recipe-level atomic styles (hydrated wholesale — they're recipe-wide).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub atomic: Vec<BuildAtom>,
}

impl BuildRecipes {
    fn is_empty(&self) -> bool {
        self.base.is_empty() && self.variants.is_empty() && self.atomic.is_empty()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BuildRecipeGroup {
    /// Recipe name (interned).
    pub r: u32,
    /// Slot name (interned), for slot recipes; omitted for plain recipes.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slot: Option<u32>,
    /// Class name (interned).
    pub cls: u32,
    /// Condition string indices.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub cond: Vec<u32>,
    /// Declarations (same shape as [`BuildAtom`]).
    pub entries: Vec<BuildAtom>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BuildAtom {
    /// Prop string index.
    pub p: u32,
    /// Value (see [`BuildValue`]).
    pub v: BuildValue,
    /// Condition string indices (outer→inner). Omitted when empty.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub c: Vec<u32>,
    /// `!important`. Omitted when false.
    #[serde(default, skip_serializing_if = "is_false")]
    pub i: bool,
}

/// A bare integer is a string-interned value (the common case); token-derived
/// values are `{ "t": pathIdx, "v": valueIdx }`; a number-typed value (drives
/// px) is `{ "n": idx }`; booleans and null are themselves.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum BuildValue {
    Str(u32),
    Token { t: u32, v: u32 },
    Num { n: u32 },
    Bool(bool),
    Null,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct ModuleEntry {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub atoms: Vec<u32>,
    /// Combined indices into `recipes` (base then variants) this module uses.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub recipes: Vec<u32>,
}

#[allow(
    clippy::trivially_copy_pass_by_ref,
    reason = "serde `skip_serializing_if` requires `fn(&T) -> bool`"
)]
fn is_false(value: &bool) -> bool {
    !*value
}

/// Builds the intern table while encoding.
#[derive(Default)]
struct Interner {
    table: Vec<String>,
    index: FxHashMap<String, u32>,
}

impl Interner {
    #[allow(
        clippy::cast_possible_truncation,
        reason = "intern tables never approach u32::MAX entries"
    )]
    fn intern(&mut self, value: &str) -> u32 {
        if let Some(&id) = self.index.get(value) {
            return id;
        }
        let id = self.table.len() as u32;
        self.table.push(value.to_owned());
        self.index.insert(value.to_owned(), id);
        id
    }

    fn build_value(&mut self, value: &AtomValue) -> BuildValue {
        match value {
            AtomValue::String(s) => BuildValue::Str(self.intern(s)),
            AtomValue::Token { path, value } => BuildValue::Token {
                t: self.intern(path),
                v: self.intern(value),
            },
            AtomValue::Number(s) => BuildValue::Num { n: self.intern(s) },
            AtomValue::Bool(b) => BuildValue::Bool(*b),
            AtomValue::Null => BuildValue::Null,
        }
    }

    fn build_atom(&mut self, atom: &Atom) -> BuildAtom {
        BuildAtom {
            p: self.intern(atom.prop()),
            v: self.build_value(atom.value()),
            c: atom.conditions().iter().map(|c| self.intern(c)).collect(),
            i: atom.important(),
        }
    }

    fn build_entry(&mut self, entry: &RecipeStyleEntry) -> BuildAtom {
        BuildAtom {
            p: self.intern(&entry.prop),
            v: self.build_value(&entry.value),
            c: entry.conditions.iter().map(|c| self.intern(c)).collect(),
            i: entry.important,
        }
    }

    fn build_recipe_group(&mut self, group: &RecipeStyleGroupSnapshot) -> BuildRecipeGroup {
        BuildRecipeGroup {
            r: self.intern(&group.recipe),
            slot: group.slot.as_str().map(|slot| self.intern(slot)),
            cls: self.intern(&group.class_name),
            cond: group.conditions.iter().map(|c| self.intern(c)).collect(),
            entries: group.entries.iter().map(|e| self.build_entry(e)).collect(),
        }
    }

    fn build_recipes(&mut self, snapshot: &EncodedRecipesSnapshot) -> BuildRecipes {
        BuildRecipes {
            base: snapshot
                .base
                .iter()
                .map(|g| self.build_recipe_group(g))
                .collect(),
            variants: snapshot
                .variants
                .iter()
                .map(|g| self.build_recipe_group(g))
                .collect(),
            atomic: snapshot.atomic.iter().map(|a| self.build_atom(a)).collect(),
        }
    }
}

fn string_at(strings: &[String], idx: u32) -> Option<Box<str>> {
    strings.get(idx as usize).map(|s| s.as_str().into())
}

fn value_from_build(value: &BuildValue, strings: &[String]) -> Option<AtomValue> {
    Some(match value {
        BuildValue::Str(idx) => AtomValue::String(string_at(strings, *idx)?),
        BuildValue::Token { t, v } => AtomValue::Token {
            path: string_at(strings, *t)?,
            value: string_at(strings, *v)?,
        },
        BuildValue::Num { n } => AtomValue::Number(string_at(strings, *n)?),
        BuildValue::Bool(b) => AtomValue::Bool(*b),
        BuildValue::Null => AtomValue::Null,
    })
}

fn conditions_from_build(indices: &[u32], strings: &[String]) -> Option<ConditionList> {
    indices.iter().map(|idx| string_at(strings, *idx)).collect()
}

fn entry_from_build(build: &BuildAtom, strings: &[String]) -> Option<RecipeStyleEntry> {
    Some(RecipeStyleEntry {
        prop: string_at(strings, build.p)?,
        value: value_from_build(&build.v, strings)?,
        conditions: conditions_from_build(&build.c, strings)?,
        important: build.i,
    })
}

fn group_from_build(
    build: &BuildRecipeGroup,
    strings: &[String],
) -> Option<RecipeStyleGroupSnapshot> {
    Some(RecipeStyleGroupSnapshot {
        recipe: string_at(strings, build.r)?,
        slot: build.slot.map_or(serde_json::Value::Null, |idx| {
            strings
                .get(idx as usize)
                .map_or(serde_json::Value::Null, |s| {
                    serde_json::Value::String(s.clone())
                })
        }),
        class_name: string_at(strings, build.cls)?,
        conditions: conditions_from_build(&build.cond, strings)?,
        entries: build
            .entries
            .iter()
            .filter_map(|entry| entry_from_build(entry, strings))
            .collect(),
    })
}

/// Reconstruct the recipe snapshot, keeping only groups whose combined index is
/// in `groups` (tree-shaking); `None` keeps everything. Recipe atomic is whole.
fn recipes_from_build(
    build: &BuildRecipes,
    strings: &[String],
    groups: Option<&FxHashSet<u32>>,
) -> EncodedRecipesSnapshot {
    let keep = |combined: usize| {
        groups.is_none_or(|set| u32::try_from(combined).is_ok_and(|index| set.contains(&index)))
    };
    let base: Vec<_> = build
        .base
        .iter()
        .enumerate()
        .filter(|(index, _)| keep(*index))
        .filter_map(|(_, group)| group_from_build(group, strings))
        .collect();
    let base_len = build.base.len();
    let variants: Vec<_> = build
        .variants
        .iter()
        .enumerate()
        .filter(|(index, _)| keep(base_len + *index))
        .filter_map(|(_, group)| group_from_build(group, strings))
        .collect();
    let atomic = build
        .atomic
        .iter()
        .filter_map(|atom| atom_from_build(atom, strings))
        .collect();
    EncodedRecipesSnapshot {
        base,
        variants,
        atomic,
    }
}

/// Reconstruct an [`Atom`] from its build encoding against the intern table.
#[must_use]
fn atom_from_build(build: &BuildAtom, strings: &[String]) -> Option<Atom> {
    Some(Atom::new(
        string_at(strings, build.p)?,
        value_from_build(&build.v, strings)?,
        conditions_from_build(&build.c, strings)?,
        build.i,
    ))
}

impl super::Project {
    /// Serialize the project's encoded atoms into a [`BuildInfo`], with per-module
    /// provenance for tree-shaking. Producer-side only (`panda buildinfo`) — not on
    /// the compile hot path. `config_fingerprint` is the engine-owned fingerprint
    /// of the resolved config (the caller only supplies the published `panda` range).
    #[must_use]
    #[allow(
        clippy::cast_possible_truncation,
        reason = "a project never holds u32::MAX atoms"
    )]
    pub fn build_info(&self, panda: String) -> BuildInfo {
        let config_fingerprint = self.config_fingerprint.to_string();
        // Deduped, emit-ordered atoms — the index space the modules reference.
        let mut atoms: Vec<&Atom> = self.atoms_cache.iter().collect();
        atoms.sort_by(|a, b| super::compare_atoms_by_emit_order(a, b));
        let position: FxHashMap<&Atom, u32> = atoms
            .iter()
            .enumerate()
            .map(|(index, atom)| (*atom, index as u32))
            .collect();

        let mut interner = Interner::default();
        let build_atoms = atoms.iter().map(|atom| interner.build_atom(atom)).collect();

        // Recipes: serialize the aggregated snapshot, and map each group's class
        // name to its combined (base ++ variants) index for per-module provenance.
        let recipe_snapshot = self.encoded_recipes_cache.view().snapshot();
        let recipes = interner.build_recipes(&recipe_snapshot);
        let recipe_index: FxHashMap<&str, u32> = recipe_snapshot
            .base
            .iter()
            .chain(recipe_snapshot.variants.iter())
            .enumerate()
            .map(|(index, group)| (group.class_name.as_ref(), index as u32))
            .collect();

        let mut modules = BTreeMap::new();
        let mut styled_modules = FxHashSet::default();
        for (path, entry) in &self.files {
            let mut atom_indices: Vec<u32> = entry
                .atoms
                .iter()
                .filter_map(|atom| position.get(atom).copied())
                .collect();
            atom_indices.sort_unstable();

            let file_recipes = entry.encoded_recipes.snapshot();
            let mut recipe_indices: Vec<u32> = file_recipes
                .base
                .iter()
                .chain(file_recipes.variants.iter())
                .filter_map(|group| recipe_index.get(group.class_name.as_ref()).copied())
                .collect();
            recipe_indices.sort_unstable();
            recipe_indices.dedup();

            if !atom_indices.is_empty() || !recipe_indices.is_empty() {
                styled_modules.insert(path.to_string());
            }

            modules.insert(
                path.to_string(),
                ModuleEntry {
                    atoms: atom_indices,
                    recipes: recipe_indices,
                },
            );
        }
        // Fold per-file export facts into a flat name → styled-module map (barrel resolution).
        let exports = ExportResolver::new(&self.files, styled_modules).resolve_all();

        BuildInfo {
            schema_version: SCHEMA_VERSION,
            panda,
            config_fingerprint,
            strings: interner.table,
            atoms: build_atoms,
            recipes,
            modules,
            exports,
        }
    }

    /// Hydrate a library's pre-extracted atoms into this project (additive),
    /// optionally restricted to the named modules so only imported components'
    /// CSS emits (tree-shaking). Atoms hydrate under a synthetic `buildinfo:{name}`
    /// file key, so re-hydration replaces cleanly.
    ///
    /// Returns `false` (no-op) when the artifact's [`SCHEMA_VERSION`] is
    /// incompatible — the caller then falls back to re-extracting the library's
    /// source. The semver peer-range + `config_fingerprint` gate lives in the JS layer
    /// (it knows the consumer's Panda version); this only guards the wire format.
    pub fn hydrate(
        &mut self,
        name: &str,
        info: &BuildInfo,
        only_modules: Option<&[String]>,
    ) -> bool {
        if info.schema_version != SCHEMA_VERSION {
            return false;
        }

        let selected_atoms: Option<FxHashSet<u32>> = only_modules.map(|modules| {
            modules
                .iter()
                .filter_map(|module| info.modules.get(module))
                .flat_map(|entry| entry.atoms.iter().copied())
                .collect()
        });
        let selected_recipes: Option<FxHashSet<u32>> = only_modules.map(|modules| {
            modules
                .iter()
                .filter_map(|module| info.modules.get(module))
                .flat_map(|entry| entry.recipes.iter().copied())
                .collect()
        });

        let atoms: FxHashSet<Atom> = info
            .atoms
            .iter()
            .enumerate()
            .filter(|(index, _)| {
                selected_atoms
                    .as_ref()
                    .is_none_or(|set| u32::try_from(*index).is_ok_and(|index| set.contains(&index)))
            })
            .filter_map(|(_, build)| atom_from_build(build, &info.strings))
            .collect();

        // Recipes hydrate by storing their reconstructed snapshot under the lib's
        // name; `stylesheet_snapshots` merges it into what the emitter sees.
        let recipes = recipes_from_build(&info.recipes, &info.strings, selected_recipes.as_ref());
        self.set_hydrated_recipes(name, recipes);

        let key: Arc<str> = Arc::from(format!("buildinfo:{name}").as_str());
        if self.files.contains_key(&key) {
            self.drop_file_state(&key);
        }
        self.add_file_state(
            key,
            FileEntry {
                source_hash: 0,
                parse_epoch: self.parse_epoch,
                cacheable: true,
                atoms,
                encoded_recipes: EncodedRecipes::new(false),
                utility_styles: FxHashMap::default(),
                token_refs: Vec::new(),
                exports: pandacss_extractor::ExportInfo::default(),
                diagnostics: Vec::new(),
                report: ParseFileReport::default(),
            },
        );
        true
    }
}

/// Resolve export surfaces across already-parsed project files. Only modules that
/// contribute styles (`styled_modules`) map to themselves; everything else is reached
/// via re-export edges collected at extraction time.
struct ExportResolver {
    files: BTreeMap<String, ExportInfo>,
    styled_modules: FxHashSet<String>,
    /// Normalized path → original `Project.files` key (handles `./` prefixes).
    normalized_files: BTreeMap<String, String>,
    surface_memo: BTreeMap<String, BTreeMap<String, String>>,
    export_memo: BTreeMap<(String, String), Option<String>>,
    resolving_surfaces: FxHashSet<String>,
    resolving_exports: FxHashSet<(String, String)>,
}

impl ExportResolver {
    fn new(files: &FxHashMap<Arc<str>, FileEntry>, styled_modules: FxHashSet<String>) -> Self {
        let mut export_files = BTreeMap::new();
        let mut normalized_files = BTreeMap::new();
        for (path, entry) in files {
            let path = path.to_string();
            normalized_files
                .entry(normalize_path(Path::new(&path)))
                .or_insert_with(|| path.clone());
            export_files.insert(path, entry.exports.clone());
        }
        Self {
            files: export_files,
            styled_modules,
            normalized_files,
            surface_memo: BTreeMap::new(),
            export_memo: BTreeMap::new(),
            resolving_surfaces: FxHashSet::default(),
            resolving_exports: FxHashSet::default(),
        }
    }

    fn resolve_all(&mut self) -> BTreeMap<String, String> {
        let mut out = BTreeMap::new();
        let paths = self.files.keys().cloned().collect::<Vec<_>>();
        for path in paths {
            for (name, module) in self.resolve_surface(&path) {
                out.insert(name, module);
            }
        }
        out
    }

    fn resolve_surface(&mut self, path: &str) -> BTreeMap<String, String> {
        if let Some(cached) = self.surface_memo.get(path) {
            return cached.clone();
        }

        // Cycle guard — re-export loops resolve to an empty surface.
        if !self.resolving_surfaces.insert(path.to_owned()) {
            return BTreeMap::new();
        }

        let info = self.files.get(path).cloned().unwrap_or_default();
        let mut surface = BTreeMap::new();

        // Star re-exports: merge the target module's public surface.
        for source in &info.export_all {
            let Some(target) = self.resolve_source(path, source) else {
                continue;
            };

            for (name, module) in self.resolve_surface(&target) {
                if name != "default" {
                    surface.insert(name, module);
                }
            }
        }

        // Named re-exports: resolve the imported binding in the target module.
        for re_export in &info.re_exports {
            let Some(target) = self.resolve_source(path, &re_export.source) else {
                continue;
            };

            if let Some(module) = self.resolve_export(&target, &re_export.imported) {
                surface.insert(re_export.exported.clone(), module);
            }
        }

        // Local exports from a style-contributing module map to that module.
        if self.styled_modules.contains(path) {
            for name in &info.local {
                surface.insert(name.clone(), path.to_owned());
            }
        }

        self.resolving_surfaces.remove(path);
        self.surface_memo.insert(path.to_owned(), surface.clone());
        surface
    }

    fn resolve_export(&mut self, path: &str, name: &str) -> Option<String> {
        let key = (path.to_owned(), name.to_owned());

        if let Some(cached) = self.export_memo.get(&key) {
            return cached.clone();
        }

        if !self.resolving_exports.insert(key.clone()) {
            return None;
        }

        let info = self.files.get(path).cloned().unwrap_or_default();
        let result = if self.styled_modules.contains(path) && info.local.iter().any(|n| n == name) {
            Some(path.to_owned())
        } else {
            // Walk named re-export edges first (more precise than star).
            info.re_exports
                .iter()
                .filter(|re_export| re_export.exported == name)
                .find_map(|re_export| {
                    let target = self.resolve_source(path, &re_export.source)?;
                    self.resolve_export(&target, &re_export.imported)
                })
                .or_else(|| {
                    // Default bindings are not re-exported through `export *`.
                    if name == "default" {
                        return None;
                    }

                    // Fall back to star re-exports for the same public name.
                    info.export_all.iter().find_map(|source| {
                        let target = self.resolve_source(path, source)?;
                        self.resolve_export(&target, name)
                    })
                })
        };

        self.resolving_exports.remove(&key);
        self.export_memo.insert(key, result.clone());
        result
    }

    fn resolve_source(&self, from: &str, source: &str) -> Option<String> {
        // Only resolve relative sources against already-parsed project keys — no FS walk.
        if !source.starts_with('.') {
            return None;
        }

        let base = Path::new(from)
            .parent()
            .map_or_else(PathBuf::new, Path::to_path_buf)
            .join(source);
        let base = normalize_path(&base);

        let mut candidates = vec![base.clone()];

        // Extension/index probing mirrors typical TS/JS resolution against known scan keys.
        if Path::new(source).extension().is_none() {
            for ext in ["ts", "tsx", "js", "jsx", "mjs", "mts", "cjs", "cts"] {
                candidates.push(format!("{base}.{ext}"));
            }

            for ext in ["ts", "tsx", "js", "jsx", "mjs", "mts", "cjs", "cts"] {
                candidates.push(format!("{base}/index.{ext}"));
            }
        }

        candidates
            .into_iter()
            .find_map(|candidate| self.normalized_files.get(&candidate).cloned())
    }
}

fn normalize_path(path: &Path) -> String {
    let mut absolute = false;
    let mut parts = Vec::new();
    for component in path.components() {
        match component {
            Component::RootDir => absolute = true,
            Component::CurDir => {}
            Component::ParentDir => {
                parts.pop();
            }
            Component::Normal(part) => parts.push(part.to_string_lossy().into_owned()),
            Component::Prefix(prefix) => {
                parts.push(prefix.as_os_str().to_string_lossy().into_owned());
            }
        }
    }
    let joined = parts.join("/");
    if absolute {
        format!("/{joined}")
    } else {
        joined
    }
}
