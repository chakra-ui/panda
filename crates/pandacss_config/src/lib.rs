//! Serialized configuration types for the Panda Rust engine.

use std::collections::BTreeSet;

use pandacss_recipes::{Literal, Recipe, SlotRecipe, recipe_jsx_names, slot_recipe_jsx_names};
use pandacss_shared::{capitalize, regex_from_serialized_value};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// JSON-safe resolved config snapshot produced on the JavaScript side.
///
/// JavaScript remains responsible for executing `panda.config.*`,
/// resolving presets, and running config-phase plugins. Rust consumes this
/// serializable shape after runtime-only hooks/plugins have been removed.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerializedConfig {
    #[serde(default)]
    pub cwd: String,
    #[serde(default)]
    pub outdir: String,
    #[serde(default)]
    pub include: Vec<String>,
    #[serde(default)]
    pub exclude: Vec<String>,
    #[serde(default)]
    pub import_map: Option<ImportMap>,
    #[serde(default)]
    pub jsx_factory: Option<String>,
    #[serde(default)]
    pub jsx_style_props: Option<String>,
    #[serde(default)]
    pub theme: Value,
    #[serde(default)]
    pub conditions: Value,
    #[serde(default)]
    pub utilities: Value,
    #[serde(default)]
    pub patterns: Value,
    #[serde(default)]
    pub static_css: Value,
    #[serde(default)]
    pub global_css: Value,
    #[serde(default)]
    pub global_vars: Value,
    #[serde(default)]
    pub global_fontface: Value,
    #[serde(default)]
    pub global_position_try: Value,
    #[serde(default)]
    pub themes: Value,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportMap {
    #[serde(default)]
    pub css: Vec<String>,
    #[serde(default, alias = "recipes")]
    pub recipe: Vec<String>,
    #[serde(default)]
    pub pattern: Vec<String>,
    #[serde(default)]
    pub jsx: Vec<String>,
    #[serde(default)]
    pub tokens: Vec<String>,
}

impl SerializedConfig {
    #[must_use]
    pub fn default_import_map(&self) -> ImportMap {
        let outdir = self
            .outdir
            .rsplit('/')
            .next()
            .filter(|s| !s.is_empty())
            .unwrap_or("styled-system");

        ImportMap {
            css: vec![format!("{outdir}/css")],
            recipe: vec![format!("{outdir}/recipes")],
            pattern: vec![format!("{outdir}/patterns")],
            jsx: vec![format!("{outdir}/jsx")],
            tokens: vec![format!("{outdir}/tokens")],
        }
    }
}

/// Data-only projection of a serialized config for Rust engine wiring.
///
/// This crate intentionally returns plain config data instead of depending
/// on extractor or encoder types. Higher-level crates adapt these fields
/// into their own runtime structs.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DerivedEngineConfig {
    pub import_map: ImportMap,
    pub jsx_factory: String,
    pub jsx_names: Vec<String>,
    pub condition_names: Vec<String>,
}

impl DerivedEngineConfig {
    #[must_use]
    pub fn from_serialized_config(config: &SerializedConfig) -> Self {
        EngineConfig::from_serialized_config(config).derived()
    }
}

fn pattern_metas_from_serialized_config(value: &Value) -> Vec<PatternMeta> {
    let Some(patterns) = value.as_object() else {
        return Vec::new();
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
            PatternMeta {
                name: name.clone(),
                jsx_names,
                jsx_regexes: jsx_regexes(pattern.get("jsx")),
                props: object_keys(pattern.get("properties")),
            }
        })
        .collect()
}

fn recipe_metas_from_serialized_config(theme: &Value) -> (Vec<RecipeMeta>, Vec<SlotRecipeMeta>) {
    let Some(theme) = theme.as_object() else {
        return (Vec::new(), Vec::new());
    };

    (
        recipe_metas(theme.get("recipes")),
        slot_recipe_metas(theme.get("slotRecipes")),
    )
}

fn recipe_metas(value: Option<&Value>) -> Vec<RecipeMeta> {
    let Some(recipes) = value.and_then(Value::as_object) else {
        return Vec::new();
    };

    recipes
        .iter()
        .enumerate()
        .filter_map(|(index, (name, config))| {
            let literal = json_value_to_literal(config)?;
            let recipe = Recipe::from_literal_owned(literal)?;
            let class_name = config
                .get("className")
                .and_then(Value::as_str)
                .unwrap_or(name)
                .to_owned();
            Some(RecipeMeta {
                name: name.clone(),
                class_name,
                jsx_names: recipe_jsx_names(name, config),
                jsx_regexes: jsx_regexes(config.get("jsx")),
                variant_props: object_keys(config.get("variants")),
                recipe,
                index: u32::try_from(index).unwrap_or(u32::MAX),
            })
        })
        .collect()
}

fn slot_recipe_metas(value: Option<&Value>) -> Vec<SlotRecipeMeta> {
    let Some(recipes) = value.and_then(Value::as_object) else {
        return Vec::new();
    };

    recipes
        .iter()
        .enumerate()
        .filter_map(|(index, (name, config))| {
            let literal = json_value_to_literal(config)?;
            let recipe = SlotRecipe::from_literal_owned(literal)?;
            let class_name = config
                .get("className")
                .and_then(Value::as_str)
                .unwrap_or(name)
                .to_owned();
            Some(SlotRecipeMeta {
                name: name.clone(),
                class_name,
                jsx_names: slot_recipe_jsx_names(name, config),
                jsx_regexes: jsx_regexes(config.get("jsx")),
                variant_props: object_keys(config.get("variants")),
                recipe,
                index: u32::try_from(index).unwrap_or(u32::MAX),
            })
        })
        .collect()
}

fn jsx_names_from_parts(
    jsx_factory: &str,
    patterns: &[PatternMeta],
    recipes: &[RecipeMeta],
    slot_recipes: &[SlotRecipeMeta],
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

#[derive(Debug, Clone)]
pub struct EngineConfig {
    pub import_map: ImportMap,
    pub jsx_factory: String,
    pub jsx_names: Vec<String>,
    pub condition_names: Vec<String>,
    pub patterns: Vec<PatternMeta>,
    pub recipes: Vec<RecipeMeta>,
    pub slot_recipes: Vec<SlotRecipeMeta>,
}

#[derive(Debug, Clone)]
pub struct PatternMeta {
    pub name: String,
    pub jsx_names: Vec<String>,
    pub jsx_regexes: Vec<Regex>,
    pub props: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct RecipeMeta {
    pub name: String,
    pub class_name: String,
    pub jsx_names: Vec<String>,
    pub jsx_regexes: Vec<Regex>,
    pub variant_props: Vec<String>,
    pub recipe: Recipe,
    pub index: u32,
}

#[derive(Debug, Clone)]
pub struct SlotRecipeMeta {
    pub name: String,
    pub class_name: String,
    pub jsx_names: Vec<String>,
    pub jsx_regexes: Vec<Regex>,
    pub variant_props: Vec<String>,
    pub recipe: SlotRecipe,
    pub index: u32,
}

impl EngineConfig {
    #[must_use]
    pub fn from_serialized_config(config: &SerializedConfig) -> Self {
        let import_map = config
            .import_map
            .clone()
            .unwrap_or_else(|| config.default_import_map());
        let jsx_factory = config
            .jsx_factory
            .clone()
            .unwrap_or_else(|| "styled".to_string());
        let patterns = pattern_metas_from_serialized_config(&config.patterns);
        let (recipes, slot_recipes) = recipe_metas_from_serialized_config(&config.theme);
        let jsx_names = jsx_names_from_parts(&jsx_factory, &patterns, &recipes, &slot_recipes);

        Self {
            import_map,
            jsx_factory,
            jsx_names,
            condition_names: condition_names_from_serialized_config(config),
            patterns,
            recipes,
            slot_recipes,
        }
    }

    #[must_use]
    pub fn derived(&self) -> DerivedEngineConfig {
        DerivedEngineConfig {
            import_map: self.import_map.clone(),
            jsx_factory: self.jsx_factory.clone(),
            jsx_names: self.jsx_names.clone(),
            condition_names: self.condition_names.clone(),
        }
    }
}

fn condition_names_from_serialized_config(config: &SerializedConfig) -> Vec<String> {
    let mut names = BTreeSet::new();
    collect_object_keys(&config.conditions, &mut names);
    collect_breakpoint_keys(&config.theme, &mut names);
    names.into_iter().collect()
}

fn collect_breakpoint_keys(theme: &Value, names: &mut BTreeSet<String>) {
    let Some(theme) = theme.as_object() else {
        return;
    };

    if let Some(breakpoints) = theme.get("breakpoints") {
        collect_object_keys(breakpoints, names);
    }
}

fn collect_object_keys(value: &Value, names: &mut BTreeSet<String>) {
    let Some(map) = value.as_object() else {
        return;
    };
    names.extend(map.keys().filter(|key| !key.is_empty()).cloned());
}

fn collect_string_array(value: Option<&Value>, names: &mut Vec<String>) {
    let Some(items) = value.and_then(Value::as_array) else {
        return;
    };

    names.extend(items.iter().filter_map(Value::as_str).map(str::to_owned));
}

fn jsx_regexes(value: Option<&Value>) -> Vec<Regex> {
    value
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(regex_from_serialized_value)
        .collect()
}

fn object_keys(value: Option<&Value>) -> Vec<String> {
    let Some(object) = value.and_then(Value::as_object) else {
        return Vec::new();
    };
    object.keys().cloned().collect()
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

fn dedupe(names: Vec<String>) -> Vec<String> {
    let mut seen = BTreeSet::new();
    names
        .into_iter()
        .filter(|name| seen.insert(name.clone()))
        .collect()
}
