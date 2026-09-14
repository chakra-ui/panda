//! Config-derived type information for codegen and tooling.
//!
//! [`TypeData`] distills a resolved config into the shapes `.d.ts` generators
//! need, built via the `*_type_data` methods on [`UserConfig`]. [`Spec`] adds
//! the extras an external introspector wants (property order, jsx factory,
//! import map).

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use pandacss_shared::pascal_case;

use crate::{
    ConditionQuery, Deprecated, ImportMap, JsxSpecifier, JsxStylePropsConfig, PatternConfig,
    PatternPropertyConfig, RecipeConfig, UserConfig, VariantSelection,
};

/// Current wire version for [`Spec`].
pub const SPEC_SCHEMA_VERSION: u32 = 1;

/// Tooling introspection snapshot: `TypeData` plus the bits it lacks
/// (canonical property order, jsx factory, import map).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Spec {
    pub schema_version: u32,
    #[serde(flatten)]
    pub types: TypeData,
    pub property_order: Vec<String>,
    pub jsx_factory: Option<String>,
    pub import_map: Option<ImportMap>,
    pub catalog: SpecCatalog,
}

impl Default for Spec {
    fn default() -> Self {
        Self {
            schema_version: SPEC_SCHEMA_VERSION,
            types: TypeData::default(),
            property_order: Vec::new(),
            jsx_factory: None,
            import_map: None,
            catalog: SpecCatalog::default(),
        }
    }
}

/// Resolved design-system definitions for documentation and external tooling.
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecCatalog {
    pub conditions: BTreeMap<String, ConditionQuery>,
    pub tokens: BTreeMap<String, SpecTokenDefinition>,
    pub recipes: BTreeMap<String, SpecRecipeDefinition>,
    pub slot_recipes: BTreeMap<String, SpecRecipeDefinition>,
    pub patterns: BTreeMap<String, SpecPatternDefinition>,
    pub keyframes: BTreeMap<String, Value>,
    pub text_styles: BTreeMap<String, Value>,
    pub layer_styles: BTreeMap<String, Value>,
    pub animation_styles: BTreeMap<String, Value>,
    pub view_transitions: BTreeMap<String, Value>,
    pub position_try: BTreeMap<String, Value>,
    pub themes: BTreeMap<String, SpecThemeDefinition>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecTokenDefinition {
    pub path: String,
    pub category: String,
    pub css_var: String,
    pub semantic: bool,
    pub values: Vec<SpecTokenValue>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecTokenValue {
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub condition: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<Deprecated>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecRecipeDefinition {
    pub name: String,
    pub class_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub jsx: Vec<JsxSpecifier>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub slots: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base: Option<Value>,
    pub variants: BTreeMap<String, BTreeMap<String, Value>>,
    pub default_variants: BTreeMap<String, VariantSelection>,
    pub compound_variants: Vec<SpecCompoundVariantDefinition>,
    #[serde(skip_serializing_if = "Value::is_null")]
    pub static_css: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<Deprecated>,
    #[serde(skip_serializing_if = "serde_json::Map::is_empty")]
    pub metadata: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecPatternDefinition {
    pub name: String,
    pub jsx_name: String,
    pub jsx_element: String,
    pub jsx: Vec<JsxSpecifier>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub properties: BTreeMap<String, SpecPatternPropertyDefinition>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_values: Option<Value>,
    pub has_dynamic_default_values: bool,
    pub has_transform: bool,
    pub strict: bool,
    pub blocklist: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<Deprecated>,
    #[serde(skip_serializing_if = "serde_json::Map::is_empty")]
    pub metadata: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecCompoundVariantDefinition {
    pub css: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<String>,
    #[serde(flatten)]
    pub conditions: BTreeMap<String, VariantSelection>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecPatternPropertyDefinition {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub property: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "serde_json::Map::is_empty")]
    pub metadata: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecThemeDefinition {
    pub name: String,
    pub condition: String,
    pub root_selector: String,
}

/// The full derived type surface, one field per config section the `.d.ts`
/// generators consume.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeData {
    pub options: TypegenOptions,
    pub conditions: ConditionTypeData,
    pub selectors: SelectorTypeData,
    pub tokens: TokenTypeData,
    pub utilities: UtilityTypeData,
    pub keyframes: KeyframeTypeData,
    /// Flattened so `patterns` sits at the spec's top level, not under `patterns.patterns`.
    #[serde(flatten)]
    pub patterns: PatternTypeData,
    /// Flattened so `recipes`/`slotRecipes` sit at the spec's top level, not under `recipes.recipes`.
    #[serde(flatten)]
    pub recipes: RecipeTypeData,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypegenOptions {
    pub strict_tokens: bool,
    pub strict_property_values: bool,
    pub jsx_style_props: JsxStylePropsConfig,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConditionTypeData {
    pub keys: Vec<String>,
    pub breakpoints: Vec<String>,
    #[serde(default)]
    pub containers: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectorTypeData {
    pub selectors: Vec<String>,
    pub arbitrary: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenTypeData {
    pub categories: BTreeMap<String, TokenCategoryTypeData>,
    pub color_palettes: Vec<String>,
    /// Runtime `token()` map: `path -> value`, empty when the value equals the
    /// token's CSS var (`token.var` derives it via helpers `toCssVar(path)` instead).
    #[serde(default)]
    pub values: BTreeMap<String, String>,
    /// Deprecated token paths -> deprecation (`true` or an author message).
    #[serde(default)]
    pub deprecated: BTreeMap<String, Deprecated>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyframeTypeData {
    pub keys: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenCategoryTypeData {
    pub name: String,
    pub type_name: String,
    pub values: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UtilityTypeData {
    pub properties: BTreeMap<String, UtilityPropertyTypeData>,
    pub shorthands: BTreeMap<String, String>,
    /// Deprecated property names -> deprecation. Utility config is boolean-only, so always `true`.
    pub deprecated: BTreeMap<String, Deprecated>,
    pub aliases: BTreeMap<String, ValueAliasTypeData>,
    /// Unprefixed class name per real property, for the runtime `css` transform. Excludes shorthands.
    #[serde(default)]
    pub class_names: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UtilityPropertyTypeData {
    pub name: String,
    pub css_property: Option<String>,
    /// Set only when the utility config declares an explicit `property` field.
    pub mapped_css_property: Option<String>,
    pub token_category: Option<String>,
    pub literals: Vec<String>,
    pub primitive: Option<PrimitiveType>,
    pub alias: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValueAliasTypeData {
    pub name: String,
    pub parts: Vec<ValueTypePart>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "kind", content = "value")]
pub enum ValueTypePart {
    TokenCategory(String),
    CssProperty(String),
    Literal(String),
    Primitive(PrimitiveType),
    CssVars,
    AnyString,
    AnyNumber,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PrimitiveType {
    String,
    Number,
    Boolean,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternTypeData {
    pub patterns: BTreeMap<String, PatternTypeDefinition>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternTypeDefinition {
    pub name: String,
    pub type_name: String,
    pub strict: bool,
    pub blocklist: Vec<String>,
    pub properties: BTreeMap<String, PatternPropertyTypeData>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<Deprecated>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternPropertyTypeData {
    pub name: String,
    pub description: Option<String>,
    pub kind: PatternPropertyTypeKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum PatternPropertyTypeKind {
    Enum {
        values: Vec<String>,
    },
    Token {
        category: String,
        property: Option<String>,
    },
    Property {
        property: String,
    },
    Primitive {
        primitive: PrimitiveType,
    },
    Unknown,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeTypeData {
    pub recipes: BTreeMap<String, RecipeTypeDefinition>,
    pub slot_recipes: BTreeMap<String, SlotRecipeTypeDefinition>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeTypeDefinition {
    pub name: String,
    pub type_name: String,
    pub variants: BTreeMap<String, VariantTypeData>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<Deprecated>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlotRecipeTypeDefinition {
    pub name: String,
    pub type_name: String,
    pub slots: Vec<String>,
    pub variants: BTreeMap<String, VariantTypeData>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<Deprecated>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VariantTypeData {
    pub values: Vec<String>,
    pub allows_boolean: bool,
}

impl UserConfig {
    #[must_use]
    pub fn typegen_options(&self) -> TypegenOptions {
        TypegenOptions {
            strict_tokens: self.strict_tokens,
            strict_property_values: self.strict_property_values,
            jsx_style_props: self.jsx_style_props.unwrap_or_default(),
        }
    }

    #[must_use]
    pub fn condition_type_data(&self) -> ConditionTypeData {
        // `base` stays in both keys and breakpoints — runtime helpers treat it as no-condition.
        ConditionTypeData {
            keys: self.condition_names(),
            breakpoints: self.theme.breakpoint_names(),
            containers: self.theme.container_names(),
        }
    }

    #[must_use]
    pub fn pattern_type_data(&self) -> PatternTypeData {
        PatternTypeData {
            patterns: self
                .patterns
                .iter()
                .map(|(name, pattern)| (name.clone(), pattern.type_definition(name)))
                .collect(),
        }
    }

    #[must_use]
    pub fn keyframe_type_data(&self) -> KeyframeTypeData {
        KeyframeTypeData {
            keys: self
                .theme
                .keyframes
                .as_object()
                .map(|keyframes| keyframes.keys().cloned().collect())
                .unwrap_or_default(),
        }
    }

    #[must_use]
    pub fn recipe_type_data(&self) -> RecipeTypeData {
        RecipeTypeData {
            recipes: self
                .theme
                .recipes
                .iter()
                .map(|(name, recipe)| (name.clone(), recipe.type_definition(name)))
                .collect(),
            slot_recipes: self
                .theme
                .slot_recipes
                .iter()
                .map(|(name, recipe)| (name.clone(), recipe.slot_type_definition(name)))
                .collect(),
        }
    }
}

impl RecipeConfig {
    #[must_use]
    pub fn type_definition(&self, name: &str) -> RecipeTypeDefinition {
        RecipeTypeDefinition {
            name: name.to_owned(),
            type_name: pascal_case(name),
            variants: self.variant_type_data(),
            deprecated: Deprecated::normalize(self.deprecated.as_ref()),
        }
    }

    #[must_use]
    pub fn slot_type_definition(&self, name: &str) -> SlotRecipeTypeDefinition {
        SlotRecipeTypeDefinition {
            name: name.to_owned(),
            type_name: pascal_case(name),
            slots: self.slots.clone(),
            variants: self.variant_type_data(),
            deprecated: Deprecated::normalize(self.deprecated.as_ref()),
        }
    }

    fn variant_type_data(&self) -> BTreeMap<String, VariantTypeData> {
        self.variants
            .iter()
            .map(|(name, values)| {
                let mut values = values.keys().cloned().collect::<Vec<_>>();
                values.sort();
                let allows_boolean = values
                    .iter()
                    .any(|value| value == "true" || value == "false");
                (
                    name.clone(),
                    VariantTypeData {
                        values,
                        allows_boolean,
                    },
                )
            })
            .collect()
    }
}

impl PatternConfig {
    #[must_use]
    pub fn type_definition(&self, name: &str) -> PatternTypeDefinition {
        PatternTypeDefinition {
            name: name.to_owned(),
            type_name: pascal_case(name),
            strict: self.strict,
            blocklist: self.blocklist.clone(),
            properties: self
                .properties
                .iter()
                .map(|(name, property)| (name.clone(), property.type_data(name)))
                .collect(),
            deprecated: Deprecated::normalize(self.deprecated.as_ref()),
        }
    }
}

impl PatternPropertyConfig {
    #[must_use]
    pub fn type_data(&self, name: &str) -> PatternPropertyTypeData {
        PatternPropertyTypeData {
            name: name.to_owned(),
            description: self.description.clone(),
            kind: self.type_kind(),
        }
    }

    fn type_kind(&self) -> PatternPropertyTypeKind {
        match self.r#type.as_deref() {
            Some("enum") => PatternPropertyTypeKind::Enum {
                values: string_array(self.value.as_ref()),
            },

            Some("token") => PatternPropertyTypeKind::Token {
                category: string_value(self.value.as_ref()).unwrap_or_default(),
                property: self.property.clone(),
            },

            Some("property") => PatternPropertyTypeKind::Property {
                property: string_value(self.value.as_ref())
                    .or_else(|| self.property.clone())
                    .unwrap_or_default(),
            },

            Some("string") => PatternPropertyTypeKind::Primitive {
                primitive: PrimitiveType::String,
            },

            Some("number") => PatternPropertyTypeKind::Primitive {
                primitive: PrimitiveType::Number,
            },

            Some("boolean") => PatternPropertyTypeKind::Primitive {
                primitive: PrimitiveType::Boolean,
            },

            Some(_) => PatternPropertyTypeKind::Unknown,

            None => self
                .property
                .as_ref()
                .map_or(PatternPropertyTypeKind::Unknown, |property| {
                    PatternPropertyTypeKind::Property {
                        property: property.clone(),
                    }
                }),
        }
    }
}

/// Panda's own `{X}Value` exports. A `pandacss_codegen` test keeps this complete.
pub const RESERVED_VALUE_ALIAS_NAMES: &[&str] = &[
    "ConditionalValue",
    "CssVarValue",
    "PatternPropertyValue",
    "PatternTokenValue",
    "TokenValue",
];

/// Names a config-derived alias, moving it aside when it would shadow a reserved type.
#[must_use]
pub fn value_alias_name(category: &str) -> String {
    let name = pascal_case(category);
    if RESERVED_VALUE_ALIAS_NAMES.contains(&format!("{name}Value").as_str()) {
        return format!("{name}UtilityValue");
    }
    format!("{name}Value")
}

#[must_use]
pub fn token_category_type_name(category: &str) -> String {
    format!("{}Token", singular_pascal_case(category))
}

fn string_value(value: Option<&Value>) -> Option<String> {
    value?.as_str().map(ToOwned::to_owned)
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(ToOwned::to_owned)
                .collect()
        })
        .unwrap_or_default()
}

fn singular_pascal_case(value: &str) -> String {
    match value {
        "radii" => "Radius".to_owned(),
        "easings" => "Easing".to_owned(),
        "durations" => "Duration".to_owned(),
        "animations" => "Animation".to_owned(),
        "blurs" => "Blur".to_owned(),
        "colors" => "Color".to_owned(),
        "sizes" => "Size".to_owned(),
        "fonts" => "Font".to_owned(),
        "fontSizes" => "FontSize".to_owned(),
        "fontWeights" => "FontWeight".to_owned(),
        "lineHeights" => "LineHeight".to_owned(),
        "letterSpacings" => "LetterSpacing".to_owned(),
        "shadows" => "Shadow".to_owned(),
        "borders" => "Border".to_owned(),
        "borderWidths" => "BorderWidth".to_owned(),
        "gradients" => "Gradient".to_owned(),
        "breakpoints" => "Breakpoint".to_owned(),
        other => pascal_case(other).trim_end_matches('s').to_owned(),
    }
}
