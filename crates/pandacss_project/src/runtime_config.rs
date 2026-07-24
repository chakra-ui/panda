use std::{collections::BTreeMap, sync::Arc};

use rustc_hash::FxHashSet;

use pandacss_config::{OptimizeConfig, UserConfig};
use pandacss_extractor::ExtractorConfig;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;

use crate::config;
use crate::patterns::PatternRegistry;
use crate::recipes::RecipeRegistry;
use crate::{ProjectConditionMatcher, RecipeKey, Result};

/// Immutable, read-optimized runtime config compiled from [`UserConfig`] (the
/// deserialized resolved input) for extraction and project state to consume.
#[allow(
    clippy::struct_field_names,
    reason = "field names mirror the config sections they hold"
)]
pub struct Config {
    pub(crate) extractor_config: ExtractorConfig,
    pub(crate) utility: Option<Utility>,
    /// Kept when [`Self::utility`] is dropped (empty utilities map).
    pub(crate) class_name_prefix: String,
    pub(crate) conditions: ProjectConditionMatcher,
    pub(crate) breakpoints: Vec<String>,
    pub(crate) patterns: PatternRegistry,
    pub(crate) recipes: RecipeRegistry,
    pub(crate) config_recipes: BTreeMap<RecipeKey, Recipe>,
    pub(crate) config_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
    pub(crate) keyframes: FxHashSet<String>,
    pub(crate) optimize: OptimizeConfig,
}

impl Config {
    /// # Errors
    /// Returns a `ConfigError` when the config has invalid tokens or recipes.
    pub fn from_user_config(config: &UserConfig) -> Result<Self> {
        let _span = tracing::debug_span!(target: "config", "compile_config").entered();
        config::compile_config(config)
    }

    #[must_use]
    pub fn token_dictionary(&self) -> Option<Arc<TokenDictionary>> {
        self.extractor_config.token_dictionary.clone()
    }

    #[must_use]
    pub fn utility(&self) -> Option<&Utility> {
        self.utility.as_ref()
    }

    #[must_use]
    pub fn extractor_config(&self) -> &ExtractorConfig {
        &self.extractor_config
    }

    #[must_use]
    pub fn conditions(&self) -> &ProjectConditionMatcher {
        &self.conditions
    }
}
