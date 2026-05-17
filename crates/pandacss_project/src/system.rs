use std::collections::BTreeMap;

use pandacss_config::Config;
use pandacss_extractor::ExtractorConfig;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_utility::Utility;

use crate::conditions::{ProjectConditionMatcher, ProjectConditions};
use crate::config;
use crate::patterns::PatternRegistry;
use crate::recipes::RecipeRegistry;
use crate::{RecipeKey, Result};

/// Immutable runtime model derived from a Panda config.
///
/// `System` is intentionally separate from [`crate::Project`]: config
/// compilation happens once here, while a project owns watch-mode file
/// state and extraction caches.
pub struct System {
    pub(crate) config: Option<Config>,
    pub(crate) extractor_config: ExtractorConfig,
    pub(crate) utility: Option<Utility>,
    pub(crate) conditions: ProjectConditionMatcher,
    pub(crate) breakpoints: Vec<String>,
    pub(crate) patterns: PatternRegistry,
    pub(crate) recipes: RecipeRegistry,
    pub(crate) config_recipes: BTreeMap<RecipeKey, Recipe>,
    pub(crate) config_slot_recipes: BTreeMap<RecipeKey, SlotRecipe>,
}

impl System {
    pub fn new(config: Config) -> Result<Self> {
        config::system_from_config(config)
    }

    #[must_use]
    pub fn from_extractor_config(extractor_config: ExtractorConfig) -> Self {
        Self {
            config: None,
            extractor_config,
            utility: None,
            conditions: ProjectConditions::from_names([]),
            breakpoints: Vec::new(),
            patterns: PatternRegistry::default(),
            recipes: RecipeRegistry::default(),
            config_recipes: BTreeMap::new(),
            config_slot_recipes: BTreeMap::new(),
        }
    }

    #[must_use]
    pub fn config(&self) -> Option<&Config> {
        self.config.as_ref()
    }
}
