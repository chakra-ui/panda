use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

use regex::Regex;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

use pandacss_config::{Config, ImportMap};
use pandacss_extractor::{
    ExtractorConfig, JsxExtractionConfig, JsxStyleProps, Literal, Matcher as ExtractorMatcher,
    Matchers, NameMatcher as ExtractorNameMatcher, css_property_names,
};
use pandacss_recipes::{Recipe, SlotRecipe, recipe_jsx_names, slot_recipe_jsx_names};
use pandacss_shared::{capitalize, compile_js_regex};
use pandacss_tokens::{TokenDictionary, TokenError};
use pandacss_utility::{Utility, UtilityOptions};

use crate::conditions::ProjectConditions;
use crate::patterns::PatternRegistry;
use crate::recipes::{RecipeRegistry, StyleResolver};
use crate::system::System;
use crate::{ConfigError, RecipeKey, Result};

pub(crate) fn system_from_config(config: Config) -> Result<System> {
    let entries = ConfigEntries::from_config(&config)?;
    let token_dictionary = TokenDictionary::from_config(&config)
        .map_err(config_error_from_token_error)?
        .map(Arc::new);
    let utility = Utility::from_config_with_options(
        &config.utilities,
        utility_options_from_config(&config, token_dictionary.clone()),
    );
    let conditions =
        ProjectConditions::from_names(entries.condition_names.iter().map(String::as_str));
    let mut extractor_config = ExtractorConfig::new(matchers_from_definitions(&entries)).with_jsx(
        jsx_extraction_config_from_definitions(&config, &entries, &utility),
    );
    extractor_config.token_dictionary = token_dictionary;
    let utility = (!utility.is_empty()).then_some(utility);
    let patterns = PatternRegistry::from_definitions(&entries.patterns);
    let recipes = RecipeRegistry::from_definitions(
        &entries.recipes,
        &entries.slot_recipes,
        &StyleResolver {
            utility: utility.as_ref(),
            conditions: &conditions,
            breakpoints: &entries.breakpoints,
        },
    );

    Ok(System {
        config: Some(config),
        extractor_config,
        utility,
        conditions,
        breakpoints: entries.breakpoints,
        patterns,
        recipes,
        config_recipes: config_recipes_from_definitions(&entries.recipes),
        config_slot_recipes: config_slot_recipes_from_definitions(&entries.slot_recipes),
    })
}

fn config_error_from_token_error(error: TokenError) -> ConfigError {
    ConfigError::config(format!("invalid token config: {error}"))
}

#[derive(Debug, Clone)]
pub(crate) struct ConfigEntries {
    import_map: ImportMap,
    jsx_factory: String,
    jsx_names: Vec<String>,
    condition_names: Vec<String>,
    breakpoints: Vec<String>,
    patterns: Vec<PatternDefinition>,
    recipes: Vec<RecipeDefinition>,
    slot_recipes: Vec<SlotRecipeDefinition>,
}

#[derive(Debug, Clone)]
pub(crate) struct PatternDefinition {
    pub(crate) name: String,
    pub(crate) jsx_names: Vec<String>,
    pub(crate) jsx_regexes: Vec<Regex>,
    pub(crate) props: Vec<String>,
    pub(crate) default_values: Option<Literal>,
    strict: bool,
    blocklist: Vec<String>,
}

#[derive(Debug, Clone)]
pub(crate) struct RecipeDefinition {
    pub(crate) name: String,
    pub(crate) class_name: String,
    pub(crate) jsx_names: Vec<String>,
    pub(crate) jsx_regexes: Vec<Regex>,
    pub(crate) variant_props: Vec<String>,
    pub(crate) recipe: Recipe,
    index: u32,
}

#[derive(Debug, Clone)]
pub(crate) struct SlotRecipeDefinition {
    pub(crate) name: String,
    pub(crate) class_name: String,
    pub(crate) jsx_names: Vec<String>,
    pub(crate) jsx_regexes: Vec<Regex>,
    pub(crate) variant_props: Vec<String>,
    pub(crate) recipe: SlotRecipe,
    index: u32,
}

impl ConfigEntries {
    fn from_config(config: &Config) -> Result<Self> {
        let import_map = config.import_map.clone().unwrap_or_default();
        let jsx_factory = config
            .jsx_factory
            .clone()
            .unwrap_or_else(|| "styled".to_string());
        let patterns = pattern_definitions_from_config(&config.patterns)?;
        let recipes = recipe_definitions(&config.theme.recipes)?;
        let slot_recipes = slot_recipe_definitions(&config.theme.slot_recipes)?;
        let jsx_names =
            jsx_names_from_definitions(&jsx_factory, &patterns, &recipes, &slot_recipes);
        let breakpoints = config.theme.breakpoint_names();

        Ok(Self {
            import_map,
            jsx_factory,
            jsx_names,
            condition_names: condition_names_from_config(config),
            breakpoints,
            patterns,
            recipes,
            slot_recipes,
        })
    }
}

fn pattern_definitions_from_config(value: &Value) -> Result<Vec<PatternDefinition>> {
    let Some(patterns) = value.as_object() else {
        return Ok(Vec::new());
    };

    patterns
        .iter()
        .map(|(name, pattern)| {
            let mut jsx_names = vec![
                pattern
                    .get("jsxName")
                    .and_then(Value::as_str)
                    .map(str::to_owned)
                    .unwrap_or_else(|| capitalize(name).into_owned()),
            ];
            collect_string_array(pattern.get("jsx"), &mut jsx_names);
            Ok(PatternDefinition {
                name: name.clone(),
                jsx_names,
                jsx_regexes: jsx_regexes(pattern.get("jsx"), &format!("patterns.{name}.jsx"))?,
                props: object_keys(pattern.get("properties")),
                default_values: pattern
                    .get("defaultValues")
                    .and_then(non_callback_literal_from_json),
                strict: pattern
                    .get("strict")
                    .and_then(Value::as_bool)
                    .unwrap_or(false),
                blocklist: string_array(pattern.get("blocklist")),
            })
        })
        .collect()
}

fn recipe_definitions(recipes: &BTreeMap<String, Value>) -> Result<Vec<RecipeDefinition>> {
    let mut out = Vec::with_capacity(recipes.len());
    for (index, (name, config)) in recipes.iter().enumerate() {
        let Some(literal) = json_value_to_literal(config) else {
            continue;
        };
        let Some(recipe) = Recipe::from_literal_owned(literal) else {
            continue;
        };
        let class_name = config
            .get("className")
            .and_then(Value::as_str)
            .unwrap_or(name)
            .to_owned();
        out.push(RecipeDefinition {
            name: name.clone(),
            class_name,
            jsx_names: recipe_jsx_names(name, config),
            jsx_regexes: jsx_regexes(config.get("jsx"), &format!("theme.recipes.{name}.jsx"))?,
            variant_props: object_keys(config.get("variants")),
            recipe,
            index: u32::try_from(index).unwrap_or(u32::MAX),
        });
    }
    Ok(out)
}

fn slot_recipe_definitions(recipes: &BTreeMap<String, Value>) -> Result<Vec<SlotRecipeDefinition>> {
    let mut out = Vec::with_capacity(recipes.len());
    for (index, (name, config)) in recipes.iter().enumerate() {
        let Some(literal) = json_value_to_literal(config) else {
            continue;
        };
        let Some(recipe) = SlotRecipe::from_literal_owned(literal) else {
            continue;
        };
        let class_name = config
            .get("className")
            .and_then(Value::as_str)
            .unwrap_or(name)
            .to_owned();
        out.push(SlotRecipeDefinition {
            name: name.clone(),
            class_name,
            jsx_names: slot_recipe_jsx_names(name, config),
            jsx_regexes: jsx_regexes(config.get("jsx"), &format!("theme.slotRecipes.{name}.jsx"))?,
            variant_props: object_keys(config.get("variants")),
            recipe,
            index: u32::try_from(index).unwrap_or(u32::MAX),
        });
    }
    Ok(out)
}

fn config_recipes_from_definitions(recipes: &[RecipeDefinition]) -> BTreeMap<RecipeKey, Recipe> {
    let mut out = BTreeMap::new();
    for recipe in recipes {
        out.insert(
            RecipeKey {
                file: Arc::from(format!("theme.recipes.{}", recipe.name)),
                span_start: recipe.index,
            },
            recipe.recipe.clone(),
        );
    }
    out
}

fn config_slot_recipes_from_definitions(
    recipes: &[SlotRecipeDefinition],
) -> BTreeMap<RecipeKey, SlotRecipe> {
    let mut out = BTreeMap::new();
    for recipe in recipes {
        out.insert(
            RecipeKey {
                file: Arc::from(format!("theme.slotRecipes.{}", recipe.name)),
                span_start: recipe.index,
            },
            recipe.recipe.clone(),
        );
    }
    out
}

fn matchers_from_definitions(config: &ConfigEntries) -> Matchers {
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

fn jsx_extraction_config_from_definitions(
    config: &Config,
    entries: &ConfigEntries,
    utility: &Utility,
) -> JsxExtractionConfig {
    let mut component_names = FxHashSet::default();
    let mut component_regexes = Vec::new();
    let mut component_props = FxHashMap::default();
    let mut component_regex_props = Vec::new();
    let mut component_strict = FxHashSet::default();
    let mut component_regex_strict = Vec::new();
    let mut component_blocklist = FxHashMap::default();
    let mut component_regex_blocklist = Vec::new();
    for pattern in &entries.patterns {
        collect_component_entry(
            &pattern.jsx_names,
            &pattern.jsx_regexes,
            &pattern.props,
            &mut component_names,
            &mut component_regexes,
            &mut component_props,
            &mut component_regex_props,
        );
        collect_pattern_prop_controls(
            pattern,
            &mut component_strict,
            &mut component_regex_strict,
            &mut component_blocklist,
            &mut component_regex_blocklist,
        );
    }
    for recipe in &entries.recipes {
        collect_component_entry(
            &recipe.jsx_names,
            &recipe.jsx_regexes,
            &recipe.variant_props,
            &mut component_names,
            &mut component_regexes,
            &mut component_props,
            &mut component_regex_props,
        );
    }
    for recipe in &entries.slot_recipes {
        collect_component_entry(
            &recipe.jsx_names,
            &recipe.jsx_regexes,
            &recipe.variant_props,
            &mut component_names,
            &mut component_regexes,
            &mut component_props,
            &mut component_regex_props,
        );
    }
    let valid_style_props = valid_jsx_style_props_from_config(utility);
    JsxExtractionConfig {
        style_props: jsx_style_props_from_config(config),
        component_names,
        component_regexes,
        component_props,
        component_regex_props,
        component_strict,
        component_regex_strict,
        component_blocklist,
        component_regex_blocklist,
        valid_style_props,
    }
}

fn collect_component_entry(
    jsx_names: &[String],
    jsx_regexes: &[Regex],
    props: &[String],
    component_names: &mut FxHashSet<String>,
    component_regexes: &mut Vec<Regex>,
    component_props: &mut FxHashMap<String, FxHashSet<String>>,
    component_regex_props: &mut Vec<(Regex, Arc<FxHashSet<String>>)>,
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

fn collect_pattern_prop_controls(
    pattern: &PatternDefinition,
    component_strict: &mut FxHashSet<String>,
    component_regex_strict: &mut Vec<Regex>,
    component_blocklist: &mut FxHashMap<String, FxHashSet<String>>,
    component_regex_blocklist: &mut Vec<(Regex, Arc<FxHashSet<String>>)>,
) {
    if pattern.strict {
        component_strict.extend(pattern.jsx_names.iter().cloned());
        component_regex_strict.extend(pattern.jsx_regexes.iter().cloned());
    }

    if pattern.blocklist.is_empty() {
        return;
    }

    let blocklist: FxHashSet<String> = pattern.blocklist.iter().cloned().collect();
    for jsx_name in &pattern.jsx_names {
        component_blocklist
            .entry(jsx_name.clone())
            .or_default()
            .extend(blocklist.iter().cloned());
    }
    let blocklist = Arc::new(blocklist);
    component_regex_blocklist.extend(
        pattern
            .jsx_regexes
            .iter()
            .cloned()
            .map(|regex| (regex, Arc::clone(&blocklist))),
    );
}

fn valid_jsx_style_props_from_config(utility: &Utility) -> FxHashSet<String> {
    let mut props: FxHashSet<String> = css_property_names()
        .iter()
        .map(|prop| (*prop).to_owned())
        .collect();
    props.extend(utility.known_prop_names().map(str::to_owned));
    props
}

fn jsx_style_props_from_config(config: &Config) -> JsxStyleProps {
    match config.jsx_style_props.as_deref() {
        Some("minimal") => JsxStyleProps::Minimal,
        Some("none") => JsxStyleProps::None,
        _ => JsxStyleProps::All,
    }
}

fn utility_options_from_config(
    config: &Config,
    token_dictionary: Option<Arc<TokenDictionary>>,
) -> UtilityOptions {
    UtilityOptions {
        separator: config
            .extra
            .get("separator")
            .and_then(Value::as_str)
            .map(str::to_owned),
        prefix: class_name_prefix_from_config(config.extra.get("prefix")),
        tokens: token_dictionary,
    }
}

fn class_name_prefix_from_config(value: Option<&Value>) -> Option<String> {
    match value {
        Some(Value::String(value)) => Some(value.clone()),
        Some(Value::Object(value)) => value
            .get("className")
            .and_then(Value::as_str)
            .map(str::to_owned),
        _ => None,
    }
}

fn condition_names_from_config(config: &Config) -> Vec<String> {
    let mut names = BTreeSet::new();
    names.insert("base".to_owned());
    collect_condition_keys(&config.conditions, &mut names);
    for name in config.theme.breakpoint_names() {
        names.insert(name);
    }
    names.into_iter().collect()
}

fn collect_condition_keys(value: &Value, names: &mut BTreeSet<String>) {
    let Some(map) = value.as_object() else {
        return;
    };
    for key in map.keys().filter(|key| !key.is_empty()) {
        names.insert(key.clone());
        if !key.starts_with('_') {
            names.insert(format!("_{key}"));
        }
    }
}

fn collect_string_array(value: Option<&Value>, names: &mut Vec<String>) {
    let Some(items) = value.and_then(Value::as_array) else {
        return;
    };

    names.extend(items.iter().filter_map(Value::as_str).map(str::to_owned));
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    let mut out = Vec::new();
    collect_string_array(value, &mut out);
    out
}

fn jsx_regexes(value: Option<&Value>, path: &str) -> Result<Vec<Regex>> {
    let Some(items) = value.and_then(Value::as_array) else {
        return Ok(Vec::new());
    };

    let mut out = Vec::new();
    for (index, item) in items.iter().enumerate() {
        let Some(object) = item.as_object() else {
            continue;
        };
        if object.get("kind").and_then(Value::as_str) != Some("regex") {
            continue;
        }
        let source = object
            .get("source")
            .and_then(Value::as_str)
            .ok_or_else(|| ConfigError::regex(path, index, "missing source"))?;
        let flags = object.get("flags").and_then(Value::as_str).unwrap_or("");
        let regex = compile_js_regex(source, flags)
            .ok_or_else(|| ConfigError::regex(path, index, format!("/{source}/{flags}")))?;
        out.push(regex);
    }
    Ok(out)
}

fn object_keys(value: Option<&Value>) -> Vec<String> {
    let Some(object) = value.and_then(Value::as_object) else {
        return Vec::new();
    };
    object.keys().cloned().collect()
}

fn non_callback_literal_from_json(value: &Value) -> Option<Literal> {
    if value
        .as_object()
        .and_then(|object| object.get("kind"))
        .and_then(Value::as_str)
        .is_some_and(|kind| kind == "js-callback")
    {
        return None;
    }
    json_value_to_literal(value)
}

fn json_value_to_literal(value: &Value) -> Option<Literal> {
    match value {
        Value::String(value) => Some(Literal::String(value.clone())),
        Value::Number(value) => value.as_f64().map(Literal::Number),
        Value::Bool(value) => Some(Literal::Bool(*value)),
        Value::Null => Some(Literal::Null),
        Value::Array(items) => items
            .iter()
            .map(json_value_to_literal)
            .collect::<Option<Vec<_>>>()
            .map(Literal::Array),
        Value::Object(entries) => entries
            .iter()
            .map(|(key, value)| json_value_to_literal(value).map(|value| (key.clone(), value)))
            .collect::<Option<Vec<_>>>()
            .map(Literal::Object),
    }
}

fn jsx_names_from_definitions(
    jsx_factory: &str,
    patterns: &[PatternDefinition],
    recipes: &[RecipeDefinition],
    slot_recipes: &[SlotRecipeDefinition],
) -> Vec<String> {
    let mut names = Vec::from([jsx_factory.to_owned(), "Box".to_owned()]);
    names.extend(
        patterns
            .iter()
            .flat_map(|pattern| pattern.jsx_names.clone()),
    );
    names.extend(recipes.iter().flat_map(|recipe| recipe.jsx_names.clone()));
    names.extend(
        slot_recipes
            .iter()
            .flat_map(|recipe| recipe.jsx_names.clone()),
    );
    dedupe(names)
}

fn dedupe(names: Vec<String>) -> Vec<String> {
    let mut seen = BTreeSet::new();
    names
        .into_iter()
        .filter(|name| seen.insert(name.clone()))
        .collect()
}
