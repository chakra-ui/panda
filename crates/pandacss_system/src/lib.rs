//! The compiled Panda config: [`System`] turns a [`pandacss_config::UserConfig`] into
//! extractor matchers, utilities, conditions, and recipe/pattern registries, and
//! answers read-only questions about styles (atoms, class names, recipe and
//! pattern resolution). Compiled once per config and shared; mutable build and
//! watch state lives in `pandacss_project`.

mod callbacks;
mod config;
mod error;
mod inline_recipe_raw;
mod patterns;
mod recipes;
mod static_patterns;
mod style_encoding;
mod style_values;
mod system;

pub use callbacks::{ParseTransforms, PatternTransformFn, SourceTransformFn, UtilityTransformFn};
pub use config::class_attribute_for_jsx_framework;
pub use error::{ConfigError, Result};
pub use inline_recipe_raw::{
    is_recipe_config, literal_variant_props, raw_call_variant_props, resolve_inline_recipe_raw,
};
pub use recipes::{EncodedRecipes, EncodedRecipesCache};
pub use style_values::{
    atom_value_summary, condition_style_key, is_empty_style_object, literal_entries,
    merge_style_entry, merge_style_props, resolved_atom_value, with_callback_target,
};
pub use system::{System, SystemInput, config_fingerprint};

pub(crate) type ProjectConditionMatcher = pandacss_encoder::ConditionSet;
