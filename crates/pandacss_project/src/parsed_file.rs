use std::collections::BTreeMap;

use rustc_hash::FxHashSet;

use pandacss_encoder::Atom;
use pandacss_recipes::{Recipe, SlotRecipe};

use crate::{Diagnostic, RecipeKey};

/// Borrowed read-only view of one parsed file. **Read-only by design** —
/// unlike ts-morph's `SourceFile`, this view does not mutate, copy, move,
/// save, or emit; Panda is an extractor, not a codemod toolkit. Re-process
/// via [`crate::Project::refresh_file`] / [`crate::Project::parse_file`].
pub struct ParsedFile<'a> {
    pub(crate) path: &'a str,
    pub(crate) atoms: &'a FxHashSet<Atom>,
    pub(crate) diagnostics: &'a [Diagnostic],
    pub(crate) recipes: &'a BTreeMap<RecipeKey, Recipe>,
    pub(crate) slot_recipes: &'a BTreeMap<RecipeKey, SlotRecipe>,
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

    pub fn recipes(&self) -> impl Iterator<Item = (u32, &'a Recipe)> + 'a {
        let path = self.path;
        self.recipes
            .iter()
            .filter(move |(k, _)| k.file.as_ref() == path)
            .map(|(k, v)| (k.span_start, v))
    }

    pub fn slot_recipes(&self) -> impl Iterator<Item = (u32, &'a SlotRecipe)> + 'a {
        let path = self.path;
        self.slot_recipes
            .iter()
            .filter(move |(k, _)| k.file.as_ref() == path)
            .map(|(k, v)| (k.span_start, v))
    }
}
