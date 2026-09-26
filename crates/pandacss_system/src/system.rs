use std::borrow::Cow;
use std::sync::Arc;

use pandacss_config::{UserConfig, ValidationMode, validate_config};
use pandacss_encoder::Atom;
use pandacss_literal::Literal;
use pandacss_shared::Diagnostic;
use pandacss_tokens::TokenDictionary;

use std::collections::BTreeMap;

use rustc_hash::FxHashSet;
use smallvec::SmallVec;

use pandacss_config::OptimizeConfig;
use pandacss_extractor::{CrossFileResolver, ExtractorConfig};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{PositionTryStyle, ViewTransitionStyle};
use pandacss_utility::Utility;

use crate::patterns::PatternRegistry;
use crate::recipes::RecipeRegistry;
use crate::{EncodedRecipes, PatternTransformFn, ProjectConditionMatcher, Result};

pub(crate) type ConfigRecipe<T> = (Arc<str>, u32, T);

/// Immutable runtime model compiled from a [`UserConfig`]: extractor matchers,
/// utilities, conditions, and recipe/pattern registries. Separate from
/// `pandacss_project::Project`: config compiles once here, while a project owns
/// watch-mode file state and extraction caches.
#[allow(
    clippy::struct_field_names,
    reason = "field names mirror the config sections they hold"
)]
pub struct System {
    pub(crate) extractor_config: ExtractorConfig,
    pub(crate) utility: Option<Utility>,
    /// Kept when [`Self::utility`] is dropped (empty utilities map).
    pub(crate) class_name_prefix: String,
    pub(crate) conditions: ProjectConditionMatcher,
    pub(crate) breakpoints: Vec<String>,
    pub(crate) patterns: PatternRegistry,
    pub(crate) recipes: RecipeRegistry,
    pub(crate) config_recipes: Vec<ConfigRecipe<Recipe>>,
    pub(crate) config_slot_recipes: Vec<ConfigRecipe<SlotRecipe>>,
    pub(crate) keyframes: FxHashSet<String>,
    pub(crate) view_transitions: BTreeMap<String, ViewTransitionStyle>,
    pub(crate) position_try: BTreeMap<String, PositionTryStyle>,
    pub(crate) optimize: OptimizeConfig,
    pub(crate) config_fingerprint: Arc<str>,
    pub(crate) diagnostics: Vec<Diagnostic>,
}

pub struct SystemInput {
    pub config: UserConfig,
    pub diagnostics: Option<Vec<Diagnostic>>,
    pub token_dictionary: Option<Arc<TokenDictionary>>,
}

impl From<UserConfig> for SystemInput {
    fn from(config: UserConfig) -> Self {
        Self {
            config,
            diagnostics: None,
            token_dictionary: None,
        }
    }
}

impl System {
    /// # Errors
    /// Returns a `ConfigError` when validation fails in error mode or the
    /// config can't be compiled (invalid tokens/recipes).
    pub fn new(input: impl Into<SystemInput>) -> Result<Self> {
        let _span = tracing::debug_span!(target: "config", "compile_config").entered();
        let input = input.into();
        let diagnostics = input
            .diagnostics
            .unwrap_or_else(|| validate_config(&input.config));
        if input.config.validation == ValidationMode::Error && !diagnostics.is_empty() {
            return Err(crate::ConfigError::config(format_config_diagnostics(
                &diagnostics,
            )));
        }
        let config_fingerprint = config_fingerprint(&input.config);
        crate::config::compile_system(
            &input.config,
            input.token_dictionary,
            config_fingerprint,
            diagnostics,
        )
    }

    /// Fingerprint of the config's output-affecting fields, stamped into
    /// build info as a collision guard. See [`config_fingerprint`].
    #[must_use]
    pub fn config_fingerprint(&self) -> &str {
        &self.config_fingerprint
    }

    /// Attach a cross-file resolver so extraction can fold imported values.
    pub fn set_cross_file(&mut self, resolver: CrossFileResolver) {
        self.extractor_config.cross_file = Some(resolver);
    }

    #[must_use]
    pub fn breakpoints(&self) -> &[String] {
        &self.breakpoints
    }

    /// Config recipes with their stable config source name and declaration order.
    pub fn config_recipes(&self) -> impl Iterator<Item = (Arc<str>, u32, &Recipe)> {
        self.config_recipes
            .iter()
            .map(|(source, index, recipe)| (Arc::clone(source), *index, recipe))
    }

    /// Config slot recipes with their stable config source name and declaration order.
    pub fn config_slot_recipes(&self) -> impl Iterator<Item = (Arc<str>, u32, &SlotRecipe)> {
        self.config_slot_recipes
            .iter()
            .map(|(source, index, recipe)| (Arc::clone(source), *index, recipe))
    }

    /// Apply pattern defaults and resolve aliases before invoking a host transform.
    #[must_use]
    pub fn pattern_transform_input<'a>(
        &'a self,
        name: &'a str,
        styles: &'a Literal,
    ) -> (&'a str, Cow<'a, Literal>) {
        let input = self.patterns.transform_input(name, styles);
        (input.name, input.styles)
    }

    /// Resolve one config-recipe usage into its emitted style groups.
    pub fn process_recipe_usage(
        &self,
        encoded: &mut EncodedRecipes,
        recipe_name: &str,
        selected: &Literal,
    ) {
        encoded.process_usage(
            &self.recipes,
            recipe_name,
            selected,
            &self.conditions,
            &self.breakpoints,
        );
    }

    /// Atomic style props attached to the selected config recipes.
    #[must_use]
    pub fn recipe_style_props(&self, recipe_names: &[&str], selected: &Literal) -> Option<Literal> {
        self.recipes.style_props_for_recipes(recipe_names, selected)
    }

    /// Expand config recipe entries selected by `staticCss`.
    pub fn process_static_recipe_css(&self, encoded: &mut EncodedRecipes, config: &UserConfig) {
        self.recipes
            .process_static_css(encoded, config, &self.conditions, &self.breakpoints);
    }

    /// Expand `staticCss.patterns` using this system's compiled pattern state.
    pub fn static_pattern_atoms(
        &self,
        config: &UserConfig,
        pattern_transform: Option<&mut PatternTransformFn<'_>>,
        diagnostics: &mut Vec<Diagnostic>,
    ) -> Vec<Atom> {
        crate::static_patterns::expand_static_patterns(
            config,
            &self.patterns,
            self.utility.as_ref(),
            self.extractor_config.token_dictionary.as_deref(),
            pattern_transform,
            diagnostics,
        )
    }

    /// Keyframe names declared in `theme.keyframes`.
    #[must_use]
    pub fn keyframes(&self) -> &FxHashSet<String> {
        &self.keyframes
    }

    #[must_use]
    #[doc(hidden)]
    pub fn optimize(&self) -> &OptimizeConfig {
        &self.optimize
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

    #[must_use]
    pub fn view_transition(&self, name: &str) -> Option<&ViewTransitionStyle> {
        self.view_transitions.get(name)
    }

    #[must_use]
    pub fn position_try(&self, name: &str) -> Option<&PositionTryStyle> {
        self.position_try.get(name)
    }

    #[must_use]
    pub fn class_name_prefix(&self) -> &str {
        &self.class_name_prefix
    }

    /// Config recipes a JSX tag renders (exact name or regex match).
    #[must_use]
    pub fn jsx_recipe_names(&self, jsx_name: &str) -> SmallVec<[&str; 2]> {
        self.recipes.find_by_jsx(jsx_name)
    }

    /// The slot of `recipe_name` that a JSX tag like `Card.Header` renders.
    #[must_use]
    pub fn jsx_recipe_slot(&self, recipe_name: &str, jsx_name: &str) -> Option<&str> {
        self.recipes.slot_for_jsx(recipe_name, jsx_name)
    }

    /// The config pattern a JSX tag renders.
    #[must_use]
    pub fn jsx_pattern_name(&self, jsx_name: &str) -> Option<&str> {
        self.patterns.resolve_name(jsx_name)
    }

    /// Variant prop names of the config recipes a JSX tag renders.
    #[must_use]
    pub fn jsx_recipe_variant_props(&self, jsx_name: &str) -> FxHashSet<&str> {
        self.recipes
            .variant_props_for(&self.recipes.find_by_jsx(jsx_name))
    }

    /// Variant prop names of one config recipe.
    #[must_use]
    pub fn recipe_variant_props(&self, recipe_name: &str) -> FxHashSet<&str> {
        self.recipes.variant_props_for(&[recipe_name])
    }

    /// Prop names a pattern fills from its `defaultValues`.
    #[must_use]
    pub fn pattern_default_value_keys(&self, pattern_name: &str) -> FxHashSet<&str> {
        self.patterns.default_value_keys(pattern_name)
    }

    #[must_use]
    pub fn diagnostics(&self) -> &[Diagnostic] {
        &self.diagnostics
    }
}

/// Keys that don't affect a library's shipped atoms/recipes — machine-local
/// IO, extraction wiring, codegen options. Excluded so a changed `include`
/// glob doesn't make two otherwise-identical libraries look incompatible.
const FINGERPRINT_IGNORED_KEYS: &[&str] = &[
    "cwd",
    "outdir",
    "include",
    "exclude",
    "importMap",
    "jsxFramework",
    "jsxFactory",
    "jsxStyleProps",
    "outExtension",
    "forceImportExtension",
    "validation",
    "strictTokens",
    "strictPropertyValues",
];

/// Deterministic fingerprint of a resolved [`UserConfig`]'s output-affecting
/// fields. Stable across machines: IO/codegen fields are dropped and object
/// keys are canonically ordered before hashing.
#[must_use]
pub fn config_fingerprint(config: &UserConfig) -> Arc<str> {
    let mut value = serde_json::to_value(config).unwrap_or(serde_json::Value::Null);
    if let Some(object) = value.as_object_mut() {
        for key in FINGERPRINT_IGNORED_KEYS {
            object.remove(*key);
        }
    }

    let mut canonical = String::new();
    write_canonical(&mut canonical, &value);

    let hash = pandacss_shared::fx_hash(&canonical);
    Arc::from(format!("cfg1-{hash:016x}").as_str())
}

/// Serialize a JSON value with object keys in sorted order, so the fingerprint
/// is independent of `serde_json`'s map ordering.
fn write_canonical(out: &mut String, value: &serde_json::Value) {
    use std::fmt::Write;
    match value {
        serde_json::Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort_unstable();
            out.push('{');
            for (index, key) in keys.into_iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                let _ = write!(out, "{key:?}:");
                write_canonical(out, &map[key]);
            }
            out.push('}');
        }
        serde_json::Value::Array(items) => {
            out.push('[');
            for (index, item) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                write_canonical(out, item);
            }
            out.push(']');
        }
        other => {
            let _ = write!(out, "{other}");
        }
    }
}

pub(crate) fn format_config_diagnostics(diagnostics: &[Diagnostic]) -> String {
    let mut message = String::from("Invalid config:");
    for diagnostic in diagnostics {
        message.push_str("\n- [");
        message.push_str(&diagnostic.code);
        message.push_str("] ");
        message.push_str(&diagnostic.message);
    }
    message
}
