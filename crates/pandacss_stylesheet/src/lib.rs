mod emitter;
mod static_css;
mod writer;

use rustc_hash::FxHashMap;

use pandacss_config::UserConfig;
use pandacss_encoder::Atom;
use pandacss_project::{EncodedRecipesSnapshot, RecipeStyleGroupSnapshot};
use serde::Serialize;

#[derive(Debug, Clone, Default)]
pub struct StylesheetOptions {
    pub minify: bool,
    pub optimize: bool,
    pub include_static: bool,
    pub source_map: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetDiagnostic {
    pub message: String,
    pub severity: StylesheetDiagnosticSeverity,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum StylesheetDiagnosticSeverity {
    Warning,
    Error,
}

#[derive(Debug, Clone, Default)]
pub struct StylesheetOutput {
    pub css: String,
    pub source_map: Option<String>,
    pub diagnostics: Vec<StylesheetDiagnostic>,
}

pub struct StylesheetInput<'a> {
    pub config: &'a UserConfig,
    pub atoms: &'a [Atom],
    pub encoded_recipes: &'a EncodedRecipesSnapshot,
    pub static_encoded_recipes: Option<&'a EncodedRecipesSnapshot>,
}

#[must_use]
pub fn compile(input: StylesheetInput<'_>, options: &StylesheetOptions) -> StylesheetOutput {
    let mut diagnostics = Vec::new();
    let mut atoms = input.atoms.to_vec();

    if options.include_static {
        let generated = static_css::expand(input.config, &mut diagnostics);
        atoms.extend(generated);
    }

    let encoded_recipes = if options.include_static {
        if input.static_encoded_recipes.is_none() && static_css::has_static_recipes(input.config) {
            diagnostics.push(StylesheetDiagnostic {
                severity: StylesheetDiagnosticSeverity::Warning,
                message: "staticCss.recipes requires a precomputed Project static recipe snapshot"
                    .to_owned(),
            });
        }
        input
            .static_encoded_recipes
            .map(|static_recipes| merge_encoded_recipes(input.encoded_recipes, static_recipes))
    } else {
        None
    };
    let recipes = encoded_recipes.as_ref().unwrap_or(input.encoded_recipes);
    let mut css = emitter::emit(input.config, &atoms, recipes, options.minify);
    if options.optimize {
        css = optimize(css, options.minify);
    }

    StylesheetOutput {
        css,
        source_map: options.source_map.then(String::new),
        diagnostics,
    }
}

fn merge_encoded_recipes(
    base: &EncodedRecipesSnapshot,
    static_recipes: &EncodedRecipesSnapshot,
) -> EncodedRecipesSnapshot {
    let mut merged = base.clone();
    extend_recipe_groups(&mut merged.base, &static_recipes.base);
    extend_recipe_groups(&mut merged.variants, &static_recipes.variants);
    let mut atom_set = FxHashMap::default();
    for (index, atom) in merged.atomic.iter().enumerate() {
        atom_set.insert(atom.clone(), index);
    }
    for atom in &static_recipes.atomic {
        if !atom_set.contains_key(atom) {
            atom_set.insert(atom.clone(), merged.atomic.len());
            merged.atomic.push(atom.clone());
        }
    }
    merged
}

fn extend_recipe_groups(
    target: &mut Vec<RecipeStyleGroupSnapshot>,
    source: &[RecipeStyleGroupSnapshot],
) {
    let mut indexes = FxHashMap::default();
    for (index, group) in target.iter().enumerate() {
        indexes.insert(recipe_group_key(group), index);
    }
    for group in source {
        let key = recipe_group_key(group);
        if let Some(index) = indexes.get(&key).copied() {
            let existing = &mut target[index];
            existing.entries.extend(group.entries.iter().cloned());
        } else {
            indexes.insert(key, target.len());
            target.push(group.clone());
        }
    }
}

fn recipe_group_key(group: &RecipeStyleGroupSnapshot) -> (Box<str>, String, Box<str>) {
    (
        group.recipe.clone(),
        group.slot.to_string(),
        group.class_name.clone(),
    )
}

fn optimize(css: String, minify: bool) -> String {
    if !minify {
        return css;
    }

    let mut out = String::with_capacity(css.len());
    let mut prev_space = false;
    for ch in css.chars() {
        if ch.is_whitespace() {
            prev_space = true;
            continue;
        }
        if prev_space && !matches!(ch, '{' | '}' | ':' | ';' | ',') {
            out.push(' ');
        }
        prev_space = false;
        out.push(ch);
    }
    out
}
