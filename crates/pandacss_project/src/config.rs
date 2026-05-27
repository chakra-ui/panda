use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

use regex::Regex;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

use pandacss_config::{
    CompoundVariantConfig, ImportMap, JsxSpecifier, JsxStylePropsConfig, PatternConfig,
    RecipeConfig, VariantSelection,
};
use pandacss_extractor::{
    ExtractorConfig, JsxExtractionConfig, JsxStyleProps, Literal, Matcher as ExtractorMatcher,
    Matchers, NameMatcher as ExtractorNameMatcher, css_property_names,
};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{capitalize, compile_js_regex};
use pandacss_tokens::{TokenDictionary, TokenError};
use pandacss_utility::{Utility, UtilityOptions};

use crate::patterns::PatternRegistry;
use crate::recipes::{RecipeRegistry, StyleResolver};
use crate::runtime_config::Config;
use crate::{ConfigError, ProjectConditionMatcher, RecipeKey, Result};

pub(crate) fn compile_config(config: &pandacss_config::UserConfig) -> Result<Config> {
    let entries = ConfigDefinitions::from_config(&config)?;
    let token_dictionary = TokenDictionary::from_config(&config)
        .map_err(config_error_from_token_error)?
        .map(Arc::new);
    let utility = Utility::from_config_with_options(
        &config.utilities,
        utility_options_from_config(&config, token_dictionary.clone()),
    );
    let conditions =
        ProjectConditionMatcher::from_names(entries.condition_names.iter().map(String::as_str));
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

    Ok(Config {
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
pub(crate) struct ConfigDefinitions {
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

impl ConfigDefinitions {
    fn from_config(config: &pandacss_config::UserConfig) -> Result<Self> {
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
            condition_names: config.condition_names(),
            breakpoints,
            patterns,
            recipes,
            slot_recipes,
        })
    }
}

fn pattern_definitions_from_config(
    patterns: &BTreeMap<String, PatternConfig>,
) -> Result<Vec<PatternDefinition>> {
    patterns
        .iter()
        .map(|(name, config)| {
            let mut jsx_names = vec![
                config
                    .jsx_name
                    .clone()
                    .unwrap_or_else(|| capitalize(name).into_owned()),
            ];
            collect_jsx_strings(&config.jsx, &mut jsx_names);
            Ok(PatternDefinition {
                name: name.clone(),
                jsx_names,
                jsx_regexes: jsx_regexes(&config.jsx, &format!("patterns.{name}.jsx"))?,
                props: config.properties.keys().cloned().collect(),
                default_values: config
                    .default_values
                    .as_ref()
                    .and_then(non_callback_literal_from_json),
                strict: config.strict,
                blocklist: config.blocklist.clone(),
            })
        })
        .collect()
}

fn recipe_definitions(recipes: &BTreeMap<String, RecipeConfig>) -> Result<Vec<RecipeDefinition>> {
    let mut out = Vec::with_capacity(recipes.len());
    for (index, (name, config)) in recipes.iter().enumerate() {
        let literal = recipe_config_to_literal(config, false);
        let Some(recipe) = Recipe::from_literal_owned(literal) else {
            continue;
        };
        let class_name = config.class_name.as_deref().unwrap_or(name).to_owned();
        out.push(RecipeDefinition {
            name: name.clone(),
            class_name,
            jsx_names: recipe_jsx_names(name, config),
            jsx_regexes: jsx_regexes(&config.jsx, &format!("theme.recipes.{name}.jsx"))?,
            variant_props: config.variants.keys().cloned().collect(),
            recipe,
            index: u32::try_from(index).unwrap_or(u32::MAX),
        });
    }
    Ok(out)
}

fn slot_recipe_definitions(
    recipes: &BTreeMap<String, RecipeConfig>,
) -> Result<Vec<SlotRecipeDefinition>> {
    let mut out = Vec::with_capacity(recipes.len());
    for (index, (name, config)) in recipes.iter().enumerate() {
        let literal = recipe_config_to_literal(config, true);
        let Some(recipe) = SlotRecipe::from_literal_owned(literal) else {
            continue;
        };
        let class_name = config.class_name.as_deref().unwrap_or(name).to_owned();
        out.push(SlotRecipeDefinition {
            name: name.clone(),
            class_name,
            jsx_names: slot_recipe_jsx_names(name, config),
            jsx_regexes: jsx_regexes(&config.jsx, &format!("theme.slotRecipes.{name}.jsx"))?,
            variant_props: config.variants.keys().cloned().collect(),
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

fn matchers_from_definitions(config: &ConfigDefinitions) -> Matchers {
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
    config: &pandacss_config::UserConfig,
    entries: &ConfigDefinitions,
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
        component_regex_set: None,
        component_props,
        component_regex_props,
        component_regex_prop_set: None,
        component_strict,
        component_regex_strict,
        component_regex_strict_set: None,
        component_blocklist,
        component_regex_blocklist,
        component_regex_blocklist_set: None,
        valid_style_props,
    }
    .with_regex_sets()
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

fn jsx_style_props_from_config(config: &pandacss_config::UserConfig) -> JsxStyleProps {
    match config.jsx_style_props {
        Some(JsxStylePropsConfig::Minimal) => JsxStyleProps::Minimal,
        Some(JsxStylePropsConfig::None) => JsxStyleProps::None,
        _ => JsxStyleProps::All,
    }
}

fn utility_options_from_config(
    config: &pandacss_config::UserConfig,
    token_dictionary: Option<Arc<TokenDictionary>>,
) -> UtilityOptions {
    UtilityOptions {
        separator: config.separator.clone(),
        prefix: config.prefix.class_name().map(str::to_owned),
        tokens: token_dictionary,
    }
}

fn collect_jsx_strings(items: &[JsxSpecifier], names: &mut Vec<String>) {
    names.extend(
        items
            .iter()
            .filter_map(JsxSpecifier::as_string)
            .map(str::to_owned),
    );
}

fn jsx_regexes(items: &[JsxSpecifier], path: &str) -> Result<Vec<Regex>> {
    let mut out = Vec::new();
    for (index, item) in items.iter().enumerate() {
        let Some(item) = item.as_regex() else {
            continue;
        };
        let regex = compile_js_regex(&item.source, &item.flags).ok_or_else(|| {
            ConfigError::regex(path, index, format!("/{}/{}", item.source, item.flags))
        })?;
        out.push(regex);
    }
    Ok(out)
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

fn recipe_config_to_literal(config: &RecipeConfig, include_slots: bool) -> Literal {
    let mut entries = Vec::new();

    if include_slots && !config.slots.is_empty() {
        entries.push((
            "slots".to_owned(),
            Literal::Array(
                config
                    .slots
                    .iter()
                    .map(|slot| Literal::String(slot.clone()))
                    .collect(),
            ),
        ));
    }

    if let Some(base) = config.base.as_ref().and_then(json_value_to_literal) {
        entries.push(("base".to_owned(), base));
    }

    if !config.variants.is_empty() {
        entries.push(("variants".to_owned(), variants_to_literal(config)));
    }

    if !config.default_variants.is_empty() {
        entries.push((
            "defaultVariants".to_owned(),
            variant_selection_map_to_literal(&config.default_variants),
        ));
    }

    if !config.compound_variants.is_empty() {
        entries.push((
            "compoundVariants".to_owned(),
            Literal::Array(
                config
                    .compound_variants
                    .iter()
                    .filter_map(compound_variant_to_literal)
                    .collect(),
            ),
        ));
    }

    Literal::Object(entries)
}

fn variants_to_literal(config: &RecipeConfig) -> Literal {
    Literal::Object(
        config
            .variants
            .iter()
            .map(|(name, options)| {
                (
                    name.clone(),
                    Literal::Object(
                        options
                            .iter()
                            .filter_map(|(key, value)| {
                                json_value_to_literal(value).map(|value| (key.clone(), value))
                            })
                            .collect(),
                    ),
                )
            })
            .collect(),
    )
}

fn variant_selection_map_to_literal(values: &BTreeMap<String, VariantSelection>) -> Literal {
    Literal::Object(
        values
            .iter()
            .map(|(key, value)| (key.clone(), variant_selection_to_literal(value)))
            .collect(),
    )
}

fn compound_variant_to_literal(config: &CompoundVariantConfig) -> Option<Literal> {
    let mut entries: Vec<(String, Literal)> = config
        .conditions
        .iter()
        .map(|(key, value)| (key.clone(), variant_selection_to_literal(value)))
        .collect();
    entries.push(("css".to_owned(), json_value_to_literal(&config.css)?));
    Some(Literal::Object(entries))
}

fn variant_selection_to_literal(value: &VariantSelection) -> Literal {
    match value {
        VariantSelection::String(value) => Literal::String(value.clone()),
        VariantSelection::Number(value) => Literal::Number(*value),
        VariantSelection::Bool(value) => Literal::Bool(*value),
        VariantSelection::Array(values) => {
            Literal::Array(values.iter().map(variant_selection_to_literal).collect())
        }
    }
}

fn recipe_jsx_names(name: &str, recipe: &RecipeConfig) -> Vec<String> {
    let names: Vec<_> = recipe
        .jsx
        .iter()
        .filter_map(JsxSpecifier::as_string)
        .map(str::to_owned)
        .collect();
    if names.is_empty() {
        vec![capitalize(name).into_owned()]
    } else {
        names
    }
}

fn slot_recipe_jsx_names(name: &str, recipe: &RecipeConfig) -> Vec<String> {
    let capitalized = capitalize(name);
    let mut names = recipe_jsx_names(name, recipe);
    names.push(format!("{capitalized}.Root"));
    names.push(format!("{capitalized}Root"));
    names
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
