//! `panda.buildinfo.json` — serialized encoder state a design-system library
//! ships so a consuming app hydrates pre-extracted styles instead of
//! re-extracting. Condensed via a string intern table and positional atom
//! encoding; per-module atom indices drive tree-shaking. See
//! `design-notes/build-info.md`.

use std::collections::BTreeMap;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;

use pandacss_encoder::{
    Atom, AtomValue, ConditionList, EncodedRecipesSnapshot, RecipeStyleEntry,
    RecipeStyleGroupSnapshot,
};
use pandacss_extractor::ExportInfo;
use pandacss_shared::ViewTransitionStyle;
use rustc_hash::{FxHashMap, FxHashSet};
use serde::{Deserialize, Serialize};

use crate::recipes::EncodedRecipes;
use crate::{FileEntry, ParseFileReport};

/// Bumped when the on-disk shape changes; a consumer with a different
/// `SCHEMA_VERSION` falls back to re-extracting the library's source.
pub const SCHEMA_VERSION: u32 = 5;

/// Synthetic file-key prefix for atoms hydrated from a parent design system.
/// Excluded from serialized build info so a published artifact carries only
/// this project's own extraction, not a hydrated parent's.
pub(crate) const HYDRATED_FILE_PREFIX: &str = "buildinfo:";

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
    /// Token paths (as string-table indices) referenced outside encoded styles.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub token_refs: Vec<u32>,
    /// Interned recipe / slot-recipe styles. Omitted when the library has none.
    #[serde(default, skip_serializing_if = "BuildRecipes::is_empty")]
    pub recipes: BuildRecipes,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub view_transitions: Vec<BuildViewTransition>,
    /// Per published module (source-file key) → indices into `atoms` /
    /// `recipes` / `viewTransitions`. Lets the consumer hydrate only imported modules.
    pub modules: BTreeMap<String, ModuleEntry>,
    /// Exported component name -> module key, so a consumer can resolve a
    /// barrel import (`import { Button } from '@acme/ds'`) to the module it
    /// must hydrate. Omitted when empty.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub exports: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BuildViewTransition {
    pub cls: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub image_pair: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub old: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub new: Option<serde_json::Value>,
}

/// Recipe + slot-recipe groups, mirroring `EncodedRecipesSnapshot` but interned.
/// Base groups index `[0, base.len())`, variants continue from there — that
/// combined index is what `ModuleEntry.recipes` references.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct BuildRecipes {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub base: Vec<BuildRecipeGroup>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub variants: Vec<BuildRecipeGroup>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub compounds: Vec<BuildRecipeGroup>,
    /// Recipe-level atomic styles (hydrated wholesale — they're recipe-wide).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub atomic: Vec<BuildAtom>,
}

impl BuildRecipes {
    fn is_empty(&self) -> bool {
        self.base.is_empty()
            && self.variants.is_empty()
            && self.compounds.is_empty()
            && self.atomic.is_empty()
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
#[serde(rename_all = "camelCase")]
pub struct ModuleEntry {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub atoms: Vec<u32>,
    /// Combined indices into `recipes` (base then variants) this module uses.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub recipes: Vec<u32>,
    /// Indices into the top-level `tokenRefs` array this module uses.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub token_refs: Vec<u32>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub view_transitions: Vec<u32>,
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
            compounds: snapshot
                .compounds
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
    let slot = match build.slot {
        Some(idx) => serde_json::Value::String(string_at(strings, idx)?.into()),
        None => serde_json::Value::Null,
    };
    let mut entries = Vec::with_capacity(build.entries.len());
    for entry in &build.entries {
        entries.push(entry_from_build(entry, strings)?);
    }
    Some(RecipeStyleGroupSnapshot {
        recipe: string_at(strings, build.r)?,
        slot,
        class_name: string_at(strings, build.cls)?,
        conditions: conditions_from_build(&build.cond, strings)?,
        entries,
    })
}

/// Reconstruct the recipe snapshot, keeping only groups whose combined index is
/// in `groups` (tree-shaking); `None` keeps everything. Recipe atomic is whole.
fn recipes_from_build(
    build: &BuildRecipes,
    strings: &[String],
    groups: Option<&FxHashSet<u32>>,
) -> Option<EncodedRecipesSnapshot> {
    let keep = |combined: usize| {
        groups.is_none_or(|set| u32::try_from(combined).is_ok_and(|index| set.contains(&index)))
    };
    // Like `atom_from_build`, a kept group that fails to reconstruct means the
    // intern table is corrupt; propagate `None` so the caller re-extracts.
    let mut base = Vec::new();
    for (index, group) in build.base.iter().enumerate() {
        if keep(index) {
            base.push(group_from_build(group, strings)?);
        }
    }
    let base_len = build.base.len();
    let variant_len = build.variants.len();
    let mut variants = Vec::new();
    for (index, group) in build.variants.iter().enumerate() {
        if keep(base_len + index) {
            variants.push(group_from_build(group, strings)?);
        }
    }
    let mut compounds = Vec::new();
    for (index, group) in build.compounds.iter().enumerate() {
        if keep(base_len + variant_len + index) {
            compounds.push(group_from_build(group, strings)?);
        }
    }
    let mut atomic = Vec::new();
    for atom in &build.atomic {
        atomic.push(atom_from_build(atom, strings)?);
    }
    Some(EncodedRecipesSnapshot {
        base,
        variants,
        compounds,
        atomic,
    })
}

/// Indices selected by `only_modules`, reading an index field off each named
/// module's [`ModuleEntry`]. `None` means "no restriction" — distinct from an
/// empty set, which would select nothing.
fn selected_module_indices(
    info: &BuildInfo,
    only_modules: Option<&[String]>,
    field: impl Fn(&ModuleEntry) -> &[u32],
) -> Option<FxHashSet<u32>> {
    only_modules.map(|modules| {
        modules
            .iter()
            .filter_map(|module| info.modules.get(module))
            .flat_map(|entry| field(entry).iter().copied())
            .collect()
    })
}

fn selected_indices_in_bounds(indices: Option<&FxHashSet<u32>>, len: usize) -> bool {
    indices.is_none_or(|indices| {
        indices
            .iter()
            .all(|&index| usize::try_from(index).is_ok_and(|index| index < len))
    })
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

#[allow(
    clippy::cast_possible_truncation,
    reason = "a project never holds u32::MAX view transitions"
)]
fn collect_build_view_transitions<'a>(
    view_transitions: &'a BTreeMap<super::RecipeKey, ViewTransitionStyle>,
    interner: &mut Interner,
) -> (Vec<BuildViewTransition>, FxHashMap<&'a str, Vec<u32>>) {
    let mut by_class = BTreeMap::<String, &ViewTransitionStyle>::new();
    for style in view_transitions.values() {
        by_class.entry(style.class_name.clone()).or_insert(style);
    }
    let list: Vec<&ViewTransitionStyle> = by_class.into_values().collect();
    let index: FxHashMap<&str, u32> = list
        .iter()
        .enumerate()
        .map(|(i, style)| (style.class_name.as_str(), i as u32))
        .collect();
    let mut file_indices: FxHashMap<&str, Vec<u32>> = FxHashMap::default();
    for (key, style) in view_transitions {
        let Some(&idx) = index.get(style.class_name.as_str()) else {
            continue;
        };
        file_indices.entry(key.file.as_ref()).or_default().push(idx);
    }
    for indices in file_indices.values_mut() {
        indices.sort_unstable();
        indices.dedup();
    }
    let entries = list
        .iter()
        .map(|style| BuildViewTransition {
            cls: interner.intern(&style.class_name),
            group: style.group.clone(),
            image_pair: style.image_pair.clone(),
            old: style.old.clone(),
            new: style.new.clone(),
        })
        .collect();
    (entries, file_indices)
}

fn view_transitions_from_build(
    builds: &[BuildViewTransition],
    strings: &[String],
    selected: Option<&FxHashSet<u32>>,
) -> Option<Vec<ViewTransitionStyle>> {
    let mut out = Vec::new();
    for (index, build) in builds.iter().enumerate() {
        let keep =
            selected.is_none_or(|set| u32::try_from(index).is_ok_and(|index| set.contains(&index)));
        if !keep {
            continue;
        }
        let class_name = string_at(strings, build.cls)?;
        out.push(ViewTransitionStyle {
            class_name: class_name.into(),
            group: build.group.clone(),
            image_pair: build.image_pair.clone(),
            old: build.old.clone(),
            new: build.new.clone(),
        });
    }
    Some(out)
}

impl super::Project {
    /// Serializes the project's encoded atoms into a [`BuildInfo`], with
    /// per-module provenance for tree-shaking. Producer-side only
    /// (`panda buildinfo`), not on the compile hot path. The caller supplies
    /// only the published `panda` range; `config_fingerprint` is derived here.
    #[must_use]
    #[allow(
        clippy::cast_possible_truncation,
        reason = "a project never holds u32::MAX atoms"
    )]
    pub fn build_info(&self, panda: String) -> BuildInfo {
        let config_fingerprint = self.config_fingerprint.to_string();

        // Deduped, emit-ordered — modules reference this index space. Only this
        // project's own atoms are serialized; hydrated parent atoms (under
        // `HYDRATED_FILE_PREFIX` files) are excluded so the artifact stays local.
        let mut local_atoms: FxHashSet<&Atom> = FxHashSet::default();
        for (path, entry) in &self.files {
            if path.starts_with(HYDRATED_FILE_PREFIX) {
                continue;
            }
            local_atoms.extend(entry.atoms.iter());
        }
        let mut atoms: Vec<&Atom> = local_atoms.into_iter().collect();
        atoms.sort_by(|a, b| super::compare_atoms_by_emit_order(a, b));
        let position: FxHashMap<&Atom, u32> = atoms
            .iter()
            .enumerate()
            .map(|(index, atom)| (*atom, index as u32))
            .collect();

        let mut interner = Interner::default();
        let build_atoms = atoms.iter().map(|atom| interner.build_atom(atom)).collect();

        // Map each group's class name to its combined (base+variants+compounds)
        // index for per-module provenance.
        let recipe_snapshot = self.encoded_recipes_cache.view().snapshot();
        let recipes = interner.build_recipes(&recipe_snapshot);
        let recipe_index: FxHashMap<&str, u32> = recipe_snapshot
            .base
            .iter()
            .chain(recipe_snapshot.variants.iter())
            .chain(recipe_snapshot.compounds.iter())
            .enumerate()
            .map(|(index, group)| (group.class_name.as_ref(), index as u32))
            .collect();

        let mut token_ref_paths = self
            .files
            .iter()
            .filter(|(path, _)| !path.starts_with(HYDRATED_FILE_PREFIX))
            .flat_map(|(_, entry)| entry.token_refs.iter().map(String::as_str))
            .collect::<Vec<_>>();
        token_ref_paths.sort_unstable();
        token_ref_paths.dedup();
        let token_ref_position: FxHashMap<&str, u32> = token_ref_paths
            .iter()
            .enumerate()
            .map(|(index, path)| (*path, index as u32))
            .collect();
        let token_refs = token_ref_paths
            .iter()
            .map(|path| interner.intern(path))
            .collect();

        let (build_view_transitions, file_view_transitions) =
            collect_build_view_transitions(&self.view_transitions, &mut interner);

        let (modules, styled_modules) = Self::build_module_entries(
            &self.files,
            &position,
            &recipe_index,
            &token_ref_position,
            &file_view_transitions,
        );
        let exports = ExportResolver::new(&self.files, styled_modules).resolve_all();

        BuildInfo {
            schema_version: SCHEMA_VERSION,
            panda,
            config_fingerprint,
            strings: interner.table,
            atoms: build_atoms,
            token_refs,
            recipes,
            view_transitions: build_view_transitions,
            modules,
            exports,
        }
    }

    fn build_module_entries(
        files: &FxHashMap<Arc<str>, FileEntry>,
        position: &FxHashMap<&Atom, u32>,
        recipe_index: &FxHashMap<&str, u32>,
        token_ref_position: &FxHashMap<&str, u32>,
        file_view_transitions: &FxHashMap<&str, Vec<u32>>,
    ) -> (BTreeMap<String, ModuleEntry>, FxHashSet<String>) {
        let mut modules = BTreeMap::new();
        let mut styled_modules = FxHashSet::default();
        for (path, entry) in files {
            if path.starts_with(HYDRATED_FILE_PREFIX) {
                continue;
            }
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
                .chain(file_recipes.compounds.iter())
                .filter_map(|group| recipe_index.get(group.class_name.as_ref()).copied())
                .collect();
            recipe_indices.sort_unstable();
            recipe_indices.dedup();

            let mut token_ref_indices = entry
                .token_refs
                .iter()
                .filter_map(|path| token_ref_position.get(path.as_str()).copied())
                .collect::<Vec<_>>();
            token_ref_indices.sort_unstable();
            token_ref_indices.dedup();

            let view_transition_indices = file_view_transitions
                .get(path.as_ref())
                .cloned()
                .unwrap_or_default();

            if !atom_indices.is_empty()
                || !recipe_indices.is_empty()
                || !token_ref_indices.is_empty()
                || !view_transition_indices.is_empty()
            {
                styled_modules.insert(path.to_string());
            }

            modules.insert(
                path.to_string(),
                ModuleEntry {
                    atoms: atom_indices,
                    recipes: recipe_indices,
                    token_refs: token_ref_indices,
                    view_transitions: view_transition_indices,
                },
            );
        }
        (modules, styled_modules)
    }

    /// Hydrates a library's pre-extracted atoms into this project (additive),
    /// optionally restricted to `only_modules` so only imported components'
    /// CSS emits. Atoms hydrate under a synthetic `buildinfo:{name}` file key,
    /// so re-hydration replaces cleanly.
    ///
    /// Returns `false` (no-op) when [`SCHEMA_VERSION`] doesn't match — the
    /// caller falls back to re-extracting the library's source. This only
    /// guards the wire format; the semver peer-range and `config_fingerprint`
    /// check happens in the JS layer, which knows the consumer's Panda version.
    pub fn hydrate(
        &mut self,
        name: &str,
        info: &BuildInfo,
        only_modules: Option<&[String]>,
    ) -> bool {
        if info.schema_version != SCHEMA_VERSION {
            return false;
        }

        let selected_atoms = selected_module_indices(info, only_modules, |entry| &entry.atoms);
        let selected_recipes = selected_module_indices(info, only_modules, |entry| &entry.recipes);
        let selected_token_refs =
            selected_module_indices(info, only_modules, |entry| &entry.token_refs);
        let selected_view_transitions =
            selected_module_indices(info, only_modules, |entry| &entry.view_transitions);

        let Some(recipe_count) = info
            .recipes
            .base
            .len()
            .checked_add(info.recipes.variants.len())
            .and_then(|count| count.checked_add(info.recipes.compounds.len()))
        else {
            return false;
        };
        // Invalid module references would otherwise look like a successful empty selection.
        if !selected_indices_in_bounds(selected_atoms.as_ref(), info.atoms.len())
            || !selected_indices_in_bounds(selected_recipes.as_ref(), recipe_count)
            || !selected_indices_in_bounds(selected_token_refs.as_ref(), info.token_refs.len())
            || !selected_indices_in_bounds(
                selected_view_transitions.as_ref(),
                info.view_transitions.len(),
            )
        {
            return false;
        }

        // A selected atom that fails to reconstruct means the intern table is
        // corrupt (an out-of-range string index). Refuse to hydrate partial data
        // and let the caller re-extract, same as a schema-version mismatch.
        let mut atoms: FxHashSet<Atom> = FxHashSet::default();
        for (index, build) in info.atoms.iter().enumerate() {
            let selected = selected_atoms
                .as_ref()
                .is_none_or(|set| u32::try_from(index).is_ok_and(|index| set.contains(&index)));
            if !selected {
                continue;
            }
            match atom_from_build(build, &info.strings) {
                Some(atom) => {
                    atoms.insert(atom);
                }
                None => return false,
            }
        }

        // Stored under the lib's name; `stylesheet_snapshots` merges it in.
        let Some(recipes) =
            recipes_from_build(&info.recipes, &info.strings, selected_recipes.as_ref())
        else {
            return false;
        };
        let mut token_refs = Vec::new();
        for (index, &path_index) in info.token_refs.iter().enumerate() {
            let selected = selected_token_refs
                .as_ref()
                .is_none_or(|set| u32::try_from(index).is_ok_and(|index| set.contains(&index)));
            if !selected {
                continue;
            }
            let Some(path) = string_at(&info.strings, path_index) else {
                return false;
            };
            token_refs.push(path.into());
        }
        self.set_hydrated_recipes(name, recipes);

        let Some(view_transitions) = view_transitions_from_build(
            &info.view_transitions,
            &info.strings,
            selected_view_transitions.as_ref(),
        ) else {
            return false;
        };
        self.set_hydrated_view_transitions(name, view_transitions);

        let key: Arc<str> = Arc::from(format!("{HYDRATED_FILE_PREFIX}{name}").as_str());
        if self.files.contains_key(&key) {
            self.drop_file_state(&key);
        }
        self.add_file_state(
            key,
            FileEntry {
                source: Arc::from(""),
                source_hash: 0,
                parse_epoch: self.parse_epoch,
                cacheable: true,
                atoms,
                encoded_recipes: EncodedRecipes::new(false),
                utility_styles: FxHashMap::default(),
                token_refs,
                exports: pandacss_extractor::ExportInfo::default(),
                diagnostics: Vec::new(),
                report: ParseFileReport::default(),
            },
        );
        true
    }
}

/// Resolves export surfaces across already-parsed project files. Modules that
/// contribute styles (`styled_modules`) map to themselves; the rest resolve
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
