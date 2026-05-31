mod emitter;
mod preflight;
mod sort;
mod static_css;
mod writer;

pub use sort::order_properties;

use std::{ops::Range, sync::Arc};

use rustc_hash::{FxHashMap, FxHashSet};

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, EncodedRecipesSnapshot, RecipeStyleGroupSnapshot};
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
    pub layer_ranges: StylesheetLayerRanges,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StylesheetLayer {
    Reset,
    Base,
    Tokens,
    Recipes,
    Utilities,
}

#[derive(Debug, Clone, Default)]
pub struct StylesheetLayerRanges {
    pub reset: Option<Range<usize>>,
    pub base: Option<Range<usize>>,
    pub tokens: Option<Range<usize>>,
    pub recipes: Option<Range<usize>>,
    pub utilities: Option<Range<usize>>,
}

impl StylesheetOutput {
    #[must_use]
    pub fn get_layer_css(&self, layers: &[StylesheetLayer]) -> String {
        let mut out = String::new();
        for layer in layers {
            let Some(css) = self.layer_css(*layer) else {
                continue;
            };
            out.push_str(css);
        }
        out
    }

    #[must_use]
    pub fn layer_css(&self, layer: StylesheetLayer) -> Option<&str> {
        self.layer_ranges
            .get(layer)
            .and_then(|range| self.css.get(range.clone()))
    }
}

impl StylesheetLayerRanges {
    #[must_use]
    pub fn get(&self, layer: StylesheetLayer) -> Option<&Range<usize>> {
        match layer {
            StylesheetLayer::Reset => self.reset.as_ref(),
            StylesheetLayer::Base => self.base.as_ref(),
            StylesheetLayer::Tokens => self.tokens.as_ref(),
            StylesheetLayer::Recipes => self.recipes.as_ref(),
            StylesheetLayer::Utilities => self.utilities.as_ref(),
        }
    }
}

pub struct StylesheetInput<'a> {
    pub config: &'a UserConfig,
    pub token_dictionary: Option<Arc<TokenDictionary>>,
    pub atoms: &'a [Atom],
    pub encoded_recipes: &'a EncodedRecipesSnapshot,
    pub static_encoded_recipes: Option<&'a EncodedRecipesSnapshot>,
    pub static_pattern_atoms: &'a [Atom],
}

/// Compile the project's atoms + recipes (plus the static-CSS subset when
/// `include_static` is set) into a single stylesheet. Diagnostics for
/// unsupported config (`preflight.scope`, layer-name collisions, …) are
/// collected alongside the CSS rather than failing the compile.
#[must_use]
pub fn compile(input: StylesheetInput<'_>, options: &StylesheetOptions) -> StylesheetOutput {
    let mut diagnostics = Vec::new();
    push_layer_collision_diagnostics(&input.config.layers, &mut diagnostics);

    // Use the caller's token dictionary, else build one from config (a build
    // failure degrades to no tokens + a diagnostic rather than aborting).
    let token_dictionary = match input.token_dictionary {
        Some(dictionary) => Some(dictionary),
        None => match TokenDictionary::from_config(input.config) {
            Ok(dictionary) => dictionary.map(Arc::new),
            Err(error) => {
                diagnostics.push(Diagnostic::error(
                    diagnostic_codes::TOKEN_DICTIONARY_BUILD_FAILED,
                    format!("Failed to build token dictionary: {error}"),
                ));
                None
            }
        },
    };
    let utility = utility_from_config(input.config, token_dictionary.clone());

    // Assemble the atom set: extracted atoms + (optionally) static-CSS and
    // static-pattern atoms.
    let mut atoms = input.atoms.iter().collect::<Vec<_>>();
    let generated = if options.include_static {
        static_css::expand(input.config, &utility, &mut diagnostics)
    } else {
        Vec::new()
    };
    if !generated.is_empty() {
        atoms.reserve(generated.len());
        atoms.extend(generated.iter());
    }
    if options.include_static && !input.static_pattern_atoms.is_empty() {
        atoms.reserve(input.static_pattern_atoms.len());
        atoms.extend(input.static_pattern_atoms.iter());
    }

    // Fold any precomputed static recipe snapshot into the dynamic recipes.
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
    let emitted = emitter::emit(
        input.config,
        &utility,
        token_dictionary.as_deref(),
        atoms,
        recipes,
        options.minify,
    );

    StylesheetOutput {
        css: emitted.css,
        source_map: options.source_map.then(String::new),
        diagnostics,
        layer_ranges: emitted.layer_ranges,
    }
}

/// Emits one warning per duplicate name when two or more semantic layers
/// map to the same string (e.g. `{reset: "x", base: "x"}`). The output
/// still emits each block under the colliding name — matches v1's
/// permissive behavior. With only five layers a linear scan is faster
/// (and clearer) than a `HashMap`.
fn push_layer_collision_diagnostics(
    layers: &pandacss_config::CascadeLayers,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let entries = layers.ordered();
    for (i, (semantic_a, name)) in entries.iter().enumerate() {
        // Only report a name once, on its first collision. Skip if any
        // earlier slot already used the same name (handled in the prior
        // iteration's `j` loop).
        if entries[..i].iter().any(|(_, prior)| prior == name) {
            continue;
        }
        if let Some((semantic_b, _)) = entries[i + 1..].iter().find(|(_, other)| other == name) {
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::LAYER_NAME_COLLISION,
                format!(
                    "layers.{semantic_a} and layers.{semantic_b} both resolve to \"{name}\"; the cascade order becomes ambiguous"
                ),
            ));
        }
    }
}

fn utility_from_config(config: &UserConfig, dictionary: Option<Arc<TokenDictionary>>) -> Utility {
    let mut utility = Utility::from_config_with_options(
        &config.utilities,
        UtilityOptions {
            separator: config.separator.clone(),
            prefix: config.prefix.class_name().map(str::to_owned),
            tokens: dictionary,
        },
    );
    utility.register_compositions(&config.theme);
    utility
}

/// Merge a static recipe snapshot into the dynamic one: recipe groups with the
/// same `(recipe, slot, class)` key have their entries concatenated; atoms are
/// unioned (deduped).
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

/// Append `source` groups into `target`, merging entries into an existing
/// group when their `(recipe, slot, class)` key already exists.
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
