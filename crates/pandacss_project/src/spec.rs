use std::collections::BTreeMap;

use serde_json::Value;

use pandacss_config::{
    ConditionQuery, Deprecated, JsxSpecifier, PatternConfig, RecipeConfig, SPEC_SCHEMA_VERSION,
    Spec, SpecCatalog, SpecCompoundVariantDefinition, SpecPatternDefinition,
    SpecPatternPropertyDefinition, SpecRecipeDefinition, SpecThemeDefinition, SpecTokenDefinition,
    SpecTokenValue, TypeData, UserConfig,
};
use pandacss_shared::pascal_case;
use pandacss_tokens::TokenDictionary;

use crate::{
    Project,
    config::{pattern_jsx_names, recipe_jsx_names, slot_recipe_jsx_names},
};

impl Project {
    /// Build the versioned design-system snapshot used by tooling and artifact writers.
    ///
    /// Property ordering belongs to the stylesheet layer. Accepting it as a closure keeps
    /// the project crate below the emitter while still constructing the complete spec once.
    #[must_use]
    pub fn spec(
        &self,
        config: &UserConfig,
        property_order: impl FnOnce(&TypeData) -> Vec<String>,
    ) -> Spec {
        let _span = tracing::trace_span!(target: "codegen", "spec").entered();
        let types = self.type_data(config);
        let property_order = property_order(&types);
        let catalog = {
            let _span = tracing::trace_span!(target: "codegen", "spec_catalog").entered();
            build_catalog(config, self.config().token_dictionary().as_deref())
        };

        Spec {
            schema_version: SPEC_SCHEMA_VERSION,
            types,
            property_order,
            jsx_factory: Some(config.jsx_factory().to_owned()),
            import_map: config.import_map.clone(),
            catalog,
        }
    }
}

fn build_catalog(config: &UserConfig, dictionary: Option<&TokenDictionary>) -> SpecCatalog {
    SpecCatalog {
        conditions: condition_definitions(config),
        tokens: dictionary.map(token_definitions).unwrap_or_default(),
        recipes: recipe_definitions(&config.theme.recipes, recipe_jsx_names),
        slot_recipes: recipe_definitions(&config.theme.slot_recipes, slot_recipe_jsx_names),
        patterns: pattern_definitions(&config.patterns),
        keyframes: object_entries(&config.theme.keyframes),
        text_styles: object_entries(&config.theme.text_styles),
        layer_styles: object_entries(&config.theme.layer_styles),
        animation_styles: object_entries(&config.theme.animation_styles),
        view_transitions: config.theme.view_transitions.clone(),
        position_try: config.theme.position_try.clone(),
        themes: config
            .themes
            .keys()
            .filter_map(|name| {
                let condition = pandacss_config::theme_condition_name(name);
                Some((
                    name.clone(),
                    SpecThemeDefinition {
                        name: name.clone(),
                        root_selector: config.theme_root_selector(name)?,
                        condition,
                    },
                ))
            })
            .collect(),
    }
}

fn condition_definitions(config: &UserConfig) -> BTreeMap<String, ConditionQuery> {
    config
        .condition_names()
        .into_iter()
        .filter(|name| name != "base")
        .filter_map(|name| {
            let query = config
                .breakpoint_condition(&name)
                .or_else(|| config.container_condition(&name))
                .or_else(|| config.theme_condition(&name))
                .map(ConditionQuery::String)
                .or_else(|| {
                    name.strip_prefix('_')
                        .and_then(|key| config.conditions.get(key))
                        .cloned()
                })?;
            Some((name, query))
        })
        .collect()
}

fn token_definitions(dictionary: &TokenDictionary) -> BTreeMap<String, SpecTokenDefinition> {
    let mut definitions = BTreeMap::<String, SpecTokenDefinition>::new();

    for token in dictionary.iter() {
        let path = token.path.to_string();
        let definition = definitions
            .entry(path)
            .or_insert_with_key(|path| SpecTokenDefinition {
                path: path.clone(),
                category: token.category.as_str().to_owned(),
                css_var: token.var.to_string(),
                semantic: false,
                values: Vec::new(),
            });
        definition.semantic |= token.semantic;
        definition.values.push(SpecTokenValue {
            value: token.value.to_string(),
            condition: token.condition.as_deref().map(str::to_owned),
            original_value: token.original_value.as_deref().map(str::to_owned),
            description: token.description.as_deref().map(str::to_owned),
            deprecated: token.deprecated.then(|| {
                token
                    .deprecated_reason
                    .as_deref()
                    .map_or(Deprecated::Bool(true), |reason| {
                        Deprecated::Message(reason.to_owned())
                    })
            }),
        });
    }

    for definition in definitions.values_mut() {
        definition.values.sort_by(|left, right| {
            left.condition
                .is_some()
                .cmp(&right.condition.is_some())
                .then_with(|| left.condition.cmp(&right.condition))
        });
    }

    definitions
}

fn recipe_definitions(
    recipes: &BTreeMap<String, RecipeConfig>,
    jsx_names: fn(&str, &RecipeConfig) -> Vec<String>,
) -> BTreeMap<String, SpecRecipeDefinition> {
    recipes
        .iter()
        .map(|(name, recipe)| {
            let mut metadata = recipe.extra.clone();
            let description = take_string(&mut metadata, "description");
            let jsx = effective_jsx(jsx_names(name, recipe), &recipe.jsx);
            (
                name.clone(),
                SpecRecipeDefinition {
                    name: name.clone(),
                    class_name: recipe.class_name.clone().unwrap_or_else(|| name.clone()),
                    description,
                    jsx,
                    slots: recipe.slots.clone(),
                    base: recipe.base.clone(),
                    variants: recipe.variants.clone(),
                    default_variants: recipe.default_variants.clone(),
                    compound_variants: recipe
                        .compound_variants
                        .iter()
                        .map(|compound| SpecCompoundVariantDefinition {
                            css: compound.css.clone(),
                            class_name: compound.class_name.clone(),
                            conditions: compound.conditions.clone(),
                        })
                        .collect(),
                    static_css: recipe.static_css.clone(),
                    deprecated: Deprecated::normalize(recipe.deprecated.as_ref()),
                    metadata,
                },
            )
        })
        .collect()
}

fn pattern_definitions(
    patterns: &BTreeMap<String, PatternConfig>,
) -> BTreeMap<String, SpecPatternDefinition> {
    patterns
        .iter()
        .map(|(name, pattern)| {
            let mut metadata = pattern.extra.clone();
            let description = take_string(&mut metadata, "description");
            let jsx_element = take_string(&mut metadata, "jsxElement")
                .unwrap_or_else(|| pandacss_config::DEFAULT_PATTERN_JSX_ELEMENT.to_owned());
            let has_dynamic_default_values =
                pattern.default_values.as_ref().is_some_and(is_callback_ref);
            let default_values = pattern
                .default_values
                .as_ref()
                .filter(|value| !is_callback_ref(value))
                .cloned();
            let jsx_name = pattern
                .jsx_name
                .clone()
                .unwrap_or_else(|| pascal_case(name));
            (
                name.clone(),
                SpecPatternDefinition {
                    name: name.clone(),
                    jsx_name,
                    jsx_element,
                    jsx: effective_jsx(pattern_jsx_names(name, pattern), &pattern.jsx),
                    description,
                    properties: pattern
                        .properties
                        .iter()
                        .map(|(name, property)| {
                            (
                                name.clone(),
                                SpecPatternPropertyDefinition {
                                    r#type: property.r#type.clone(),
                                    value: property.value.clone(),
                                    property: property.property.clone(),
                                    description: property.description.clone(),
                                    metadata: property.extra.clone(),
                                },
                            )
                        })
                        .collect(),
                    default_values,
                    has_dynamic_default_values,
                    has_transform: pattern.transform.is_some(),
                    strict: pattern.strict,
                    blocklist: pattern.blocklist.clone(),
                    deprecated: Deprecated::normalize(pattern.deprecated.as_ref()),
                    metadata,
                },
            )
        })
        .collect()
}

fn effective_jsx(names: Vec<String>, configured: &[JsxSpecifier]) -> Vec<JsxSpecifier> {
    names
        .into_iter()
        .map(JsxSpecifier::String)
        .chain(
            configured
                .iter()
                .filter(|specifier| specifier.as_regex().is_some())
                .cloned(),
        )
        .collect()
}

fn object_entries(value: &Value) -> BTreeMap<String, Value> {
    value
        .as_object()
        .into_iter()
        .flat_map(|entries| entries.iter())
        .map(|(name, value)| (name.clone(), value.clone()))
        .collect()
}

fn take_string(metadata: &mut serde_json::Map<String, Value>, name: &str) -> Option<String> {
    metadata
        .remove(name)
        .and_then(|value| value.as_str().map(str::to_owned))
}

fn is_callback_ref(value: &Value) -> bool {
    value
        .get("kind")
        .and_then(Value::as_str)
        .is_some_and(|kind| kind == "js-callback")
}
