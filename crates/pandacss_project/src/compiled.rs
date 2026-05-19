use std::collections::BTreeMap;

use pandacss_config::UserConfig;
use pandacss_extractor::ExtractorConfig;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_utility::Utility;

use crate::conditions::ProjectConditionMatcher;
use crate::config;
use crate::patterns::PatternRegistry;
use crate::recipes::RecipeRegistry;
use crate::{RecipeKey, Result};

/// Immutable, read-optimized runtime config derived from a Panda user config.
///
/// `UserConfig` is the deserialized resolved input shape. This `Config`
/// is the compiled model consumed by extraction and project state.
pub struct Config {
    pub(crate) extractor_config: ExtractorConfig,
    pub(crate) utility: Option<Utility>,
    pub(crate) conditions: ProjectConditionMatcher,
    pub(crate) breakpoints: Vec<String>,
    pub(crate) patterns: PatternRegistry,
    pub(crate) recipes: RecipeRegistry,
    pub(crate) config_recipes: BTreeMap<RecipeKey, Recipe>,
    pub(crate) config_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
}

impl Config {
    pub fn from_user_config(config: &UserConfig) -> Result<Self> {
        let _span = tracing::debug_span!("config_from_user_config").entered();
        config::compile_config(config)
    }
}
