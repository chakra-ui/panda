//! Serialized configuration types for the Panda Rust engine.

use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

use serde_json::{Map, Value};

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
        let import_map = config
            .import_map
            .clone()
            .unwrap_or_else(|| config.default_import_map());
        let jsx_factory = config
            .jsx_factory
            .clone()
            .unwrap_or_else(|| "styled".to_string());

        Self {
            import_map,
            jsx_names: jsx_names_from_serialized_config(config, &jsx_factory),
            jsx_factory,
            condition_names: condition_names_from_serialized_config(config),
        }
    }
}

fn jsx_names_from_serialized_config(config: &SerializedConfig, jsx_factory: &str) -> Vec<String> {
    let mut names = Vec::from([jsx_factory.to_owned(), "Box".to_owned()]);

    collect_pattern_jsx_names(&config.patterns, &mut names);

    let Some(theme) = config.theme.as_object() else {
        return dedupe(names);
    };

    collect_recipe_jsx_names(theme.get("recipes"), &mut names);
    collect_slot_recipe_jsx_names(theme.get("slotRecipes"), &mut names);

    if let Some(extend) = theme.get("extend").and_then(Value::as_object) {
        collect_recipe_jsx_names(extend.get("recipes"), &mut names);
        collect_slot_recipe_jsx_names(extend.get("slotRecipes"), &mut names);
    }

    dedupe(names)
}

fn collect_pattern_jsx_names(value: &Value, names: &mut Vec<String>) {
    let Some(patterns) = value.as_object() else {
        return;
    };

    collect_pattern_map_jsx_names(patterns, names);

    if let Some(extend) = patterns.get("extend").and_then(Value::as_object) {
        collect_pattern_map_jsx_names(extend, names);
    }
}

fn collect_pattern_map_jsx_names(patterns: &Map<String, Value>, names: &mut Vec<String>) {
    for (name, pattern) in patterns {
        if name == "extend" {
            continue;
        }
        let jsx_name = pattern
            .get("jsxName")
            .and_then(Value::as_str)
            .map(str::to_owned)
            .unwrap_or_else(|| capitalize(name));
        names.push(jsx_name);
        collect_string_array(pattern.get("jsx"), names);
    }
}

fn collect_recipe_jsx_names(value: Option<&Value>, names: &mut Vec<String>) {
    let Some(recipes) = value.and_then(Value::as_object) else {
        return;
    };

    for (name, recipe) in recipes {
        names.push(capitalize(name));
        collect_string_array(recipe.get("jsx"), names);
    }
}

fn collect_slot_recipe_jsx_names(value: Option<&Value>, names: &mut Vec<String>) {
    let Some(recipes) = value.and_then(Value::as_object) else {
        return;
    };

    for (name, recipe) in recipes {
        let capitalized = capitalize(name);
        names.push(capitalized.clone());
        collect_string_array(recipe.get("jsx"), names);
        names.push(format!("{capitalized}.Root"));
        names.push(format!("{capitalized}Root"));
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

    if let Some(extend) = theme.get("extend").and_then(Value::as_object)
        && let Some(breakpoints) = extend.get("breakpoints")
    {
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

fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_uppercase().chain(chars).collect()
}

fn dedupe(names: Vec<String>) -> Vec<String> {
    let mut seen = BTreeSet::new();
    names
        .into_iter()
        .filter(|name| seen.insert(name.clone()))
        .collect()
}
