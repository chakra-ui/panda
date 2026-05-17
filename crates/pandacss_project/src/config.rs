use std::collections::BTreeMap;
use std::sync::Arc;

use rustc_hash::{FxHashMap, FxHashSet};

use pandacss_config::{DerivedEngineConfig, EngineConfig, SerializedConfig};
use pandacss_extractor::{
    ExtractorConfig, JsxExtractionConfig, JsxStyleProps, Matcher as ExtractorMatcher, Matchers,
    NameMatcher as ExtractorNameMatcher, css_property_names,
};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_utility::Utility;

use crate::{ProjectConditionMatcher, ProjectConditions, RecipeKey};

pub(crate) struct DerivedProjectConfig {
    pub(crate) extractor: ExtractorConfig,
    pub(crate) utility: Option<Utility>,
    pub(crate) conditions: ProjectConditionMatcher,
}

impl DerivedProjectConfig {
    pub(crate) fn from_engine_config(config: &SerializedConfig, engine: &EngineConfig) -> Self {
        let derived = engine.derived();
        let utility = Utility::from_serialized(&config.utilities);
        Self {
            extractor: ExtractorConfig::new(matchers_from_derived_config(&derived)).with_jsx(
                jsx_extraction_config_from_engine_config(config, engine, &utility),
            ),
            utility: (!utility.is_empty()).then_some(utility),
            conditions: ProjectConditions::from_derived_config(&derived),
        }
    }
}

pub(crate) fn config_recipes_from_engine_config(
    engine: &EngineConfig,
) -> BTreeMap<RecipeKey, Recipe> {
    let mut out = BTreeMap::new();
    collect_config_recipes(&engine.recipes, "theme.recipes", &mut out);
    out
}

pub(crate) fn config_slot_recipes_from_engine_config(
    engine: &EngineConfig,
) -> BTreeMap<RecipeKey, SlotRecipe> {
    let mut out = BTreeMap::new();
    collect_config_slot_recipes(&engine.slot_recipes, "theme.slotRecipes", &mut out);
    out
}

fn collect_config_recipes(
    recipes: &[pandacss_config::RecipeMeta],
    path: &str,
    out: &mut BTreeMap<RecipeKey, Recipe>,
) {
    for recipe in recipes {
        out.insert(
            RecipeKey {
                file: Arc::from(format!("{path}.{}", recipe.name)),
                span_start: recipe.index,
            },
            recipe.recipe.clone(),
        );
    }
}

fn collect_config_slot_recipes(
    recipes: &[pandacss_config::SlotRecipeMeta],
    path: &str,
    out: &mut BTreeMap<RecipeKey, SlotRecipe>,
) {
    for recipe in recipes {
        out.insert(
            RecipeKey {
                file: Arc::from(format!("{path}.{}", recipe.name)),
                span_start: recipe.index,
            },
            recipe.recipe.clone(),
        );
    }
}

fn matchers_from_derived_config(config: &DerivedEngineConfig) -> Matchers {
    Matchers {
        css: ExtractorMatcher {
            modules: config.import_map.css.clone(),
            names: ExtractorNameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: ExtractorMatcher {
            modules: config.import_map.recipe.clone(),
            names: ExtractorNameMatcher::Any,
        },
        pattern: ExtractorMatcher {
            modules: config.import_map.pattern.clone(),
            names: ExtractorNameMatcher::Any,
        },
        jsx: Some(ExtractorMatcher {
            modules: config.import_map.jsx.clone(),
            names: ExtractorNameMatcher::only(config.jsx_names.clone()),
        }),
        tokens: ExtractorMatcher {
            modules: config.import_map.tokens.clone(),
            names: ExtractorNameMatcher::only(["token"]),
        },
        jsx_factories: Some(vec![config.jsx_factory.clone()]),
    }
}

fn jsx_extraction_config_from_engine_config(
    config: &SerializedConfig,
    engine: &EngineConfig,
    utility: &Utility,
) -> JsxExtractionConfig {
    let mut component_names = FxHashSet::default();
    let mut component_regexes = Vec::new();
    let mut component_props = FxHashMap::default();
    let mut component_regex_props = Vec::new();
    for pattern in &engine.patterns {
        collect_component_meta(
            &pattern.jsx_names,
            &pattern.jsx_regexes,
            &pattern.props,
            &mut component_names,
            &mut component_regexes,
            &mut component_props,
            &mut component_regex_props,
        );
    }
    for recipe in &engine.recipes {
        collect_component_meta(
            &recipe.jsx_names,
            &recipe.jsx_regexes,
            &recipe.variant_props,
            &mut component_names,
            &mut component_regexes,
            &mut component_props,
            &mut component_regex_props,
        );
    }
    for recipe in &engine.slot_recipes {
        collect_component_meta(
            &recipe.jsx_names,
            &recipe.jsx_regexes,
            &recipe.variant_props,
            &mut component_names,
            &mut component_regexes,
            &mut component_props,
            &mut component_regex_props,
        );
    }
    let valid_style_props = valid_jsx_style_props_from_serialized_config(utility);
    JsxExtractionConfig {
        style_props: jsx_style_props_from_serialized_config(config),
        component_names,
        component_regexes,
        component_props,
        component_regex_props,
        valid_style_props,
    }
}

fn collect_component_meta(
    jsx_names: &[String],
    jsx_regexes: &[regex::Regex],
    props: &[String],
    component_names: &mut FxHashSet<String>,
    component_regexes: &mut Vec<regex::Regex>,
    component_props: &mut FxHashMap<String, FxHashSet<String>>,
    component_regex_props: &mut Vec<(regex::Regex, Arc<FxHashSet<String>>)>,
) {
    component_names.extend(jsx_names.iter().cloned());
    component_regexes.extend(jsx_regexes.iter().cloned());
    if props.is_empty() {
        return;
    }
    let props_set: FxHashSet<String> = props.iter().cloned().collect();
    for jsx_name in jsx_names {
        component_props
            .entry(jsx_name.clone())
            .or_default()
            .extend(props_set.iter().cloned());
    }
    let props_set = Arc::new(props_set);
    component_regex_props.extend(
        jsx_regexes
            .iter()
            .cloned()
            .map(|regex| (regex, Arc::clone(&props_set))),
    );
}

fn valid_jsx_style_props_from_serialized_config(utility: &Utility) -> FxHashSet<String> {
    let mut props: FxHashSet<String> = css_property_names()
        .iter()
        .map(|prop| (*prop).to_owned())
        .collect();
    props.extend(utility.known_prop_names().map(str::to_owned));
    props
}

fn jsx_style_props_from_serialized_config(config: &SerializedConfig) -> JsxStyleProps {
    match config.jsx_style_props.as_deref() {
        Some("minimal") => JsxStyleProps::Minimal,
        Some("none") => JsxStyleProps::None,
        _ => JsxStyleProps::All,
    }
}
