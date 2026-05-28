mod emitter;
mod sort;
mod static_css;
mod writer;

use std::sync::Arc;

use rustc_hash::{FxHashMap, FxHashSet};

use pandacss_config::UserConfig;
use pandacss_encoder::Atom;
use pandacss_project::{EncodedRecipesSnapshot, RecipeStyleGroupSnapshot};
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::{Utility, UtilityOptions};

#[derive(Debug, Clone, Default)]
pub struct StylesheetOptions {
    pub minify: bool,
    pub include_static: bool,
    pub source_map: bool,
}

#[derive(Debug, Clone, Default)]
pub struct StylesheetOutput {
    pub css: String,
    pub source_map: Option<String>,
    pub diagnostics: Vec<Diagnostic>,
}

pub struct StylesheetInput<'a> {
    pub config: &'a UserConfig,
    pub atoms: Vec<&'a Atom>,
    pub encoded_recipes: &'a EncodedRecipesSnapshot,
    pub static_encoded_recipes: Option<&'a EncodedRecipesSnapshot>,
}

#[must_use]
pub fn compile(input: StylesheetInput<'_>, options: &StylesheetOptions) -> StylesheetOutput {
    let mut diagnostics = Vec::new();
    let utility = utility_from_config(input.config);
    let mut atoms = input.atoms;
    let generated = if options.include_static {
        static_css::expand(input.config, &utility, &mut diagnostics)
    } else {
        Vec::new()
    };
    if !generated.is_empty() {
        atoms.reserve(generated.len());
        atoms.extend(generated.iter());
    }

    let encoded_recipes = if options.include_static {
        if input.static_encoded_recipes.is_none() && static_css::has_static_recipes(input.config) {
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::STATIC_CSS_RECIPES_MISSING_SNAPSHOT,
                "staticCss.recipes requires a precomputed Project static recipe snapshot",
            ));
        }
        input.static_encoded_recipes.and_then(|static_recipes| {
            (!is_empty_encoded_recipes(static_recipes))
                .then(|| merge_encoded_recipes(input.encoded_recipes, static_recipes))
        })
    } else {
        None
    };
    let recipes = encoded_recipes.as_ref().unwrap_or(input.encoded_recipes);
    let css = emitter::emit(input.config, &utility, atoms, recipes, options.minify);

    StylesheetOutput {
        css,
        source_map: options.source_map.then(String::new),
        diagnostics,
    }
}

fn utility_from_config(config: &UserConfig) -> Utility {
    let dictionary = TokenDictionary::from_config(config)
        .ok()
        .flatten()
        .map(Arc::new);
    Utility::from_config_with_options(
        &config.utilities,
        UtilityOptions {
            separator: config.separator.clone(),
            prefix: config.prefix.class_name().map(str::to_owned),
            tokens: dictionary,
        },
    )
}

fn merge_encoded_recipes(
    base: &EncodedRecipesSnapshot,
    static_recipes: &EncodedRecipesSnapshot,
) -> EncodedRecipesSnapshot {
    let mut merged = base.clone();
    extend_recipe_groups(&mut merged.base, &static_recipes.base);
    extend_recipe_groups(&mut merged.variants, &static_recipes.variants);
    let mut atom_set = FxHashSet::default();
    for atom in &merged.atomic {
        atom_set.insert(atom.clone());
    }
    for atom in &static_recipes.atomic {
        if atom_set.insert(atom.clone()) {
            merged.atomic.push(atom.clone());
        }
    }
    merged
}

fn is_empty_encoded_recipes(recipes: &EncodedRecipesSnapshot) -> bool {
    recipes.base.is_empty() && recipes.variants.is_empty() && recipes.atomic.is_empty()
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
