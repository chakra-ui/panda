//! Serialized configuration types consumed by the Panda Rust runtime.

mod theme;
mod validate;

use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub use theme::{
    Asset, AssetType, AssetValue, Border, BorderStyle, BorderValue, ColorPaletteOptions,
    CompoundVariantConfig, Deprecated, EasingValue, FontValue, Gradient, GradientStop,
    GradientStops, GradientValue, RecipeConfig, SemanticTokens, SemanticValue, Shadow, ShadowValue,
    StringOrNumber, StyleConfig, Theme, ThemeVariant, ThemeVariantsMap, TokenEntry, TokenGroup,
    TokenNode, Tokens, VariantSelection,
};
pub use validate::{validate_config, validate_config_value, validation_mode_from_value};

pub type Conditions = BTreeMap<String, ConditionQuery>;
pub type PatternMap = BTreeMap<String, PatternConfig>;
pub type UtilityMap = BTreeMap<String, UtilityConfig>;

/// JSON-safe resolved config snapshot produced on the JavaScript side.
///
/// JavaScript remains responsible for executing `panda.config.*`,
/// resolving presets, and running config-phase plugins. Rust consumes this
/// serializable shape after runtime-only hooks/plugins have been removed.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserConfig {
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
    pub jsx_style_props: Option<JsxStylePropsConfig>,
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub conditions: Conditions,
    #[serde(default)]
    pub utilities: UtilityMap,
    #[serde(default)]
    pub patterns: PatternMap,
    #[serde(default)]
    pub prefix: PrefixConfig,
    #[serde(default)]
    pub hash: HashConfig,
    #[serde(default)]
    pub separator: Option<String>,
    #[serde(default)]
    pub static_css: Value,
    #[serde(default)]
    pub global_css: Value,
    #[serde(default)]
    pub global_vars: Value,
    #[serde(default = "default_css_var_root")]
    pub css_var_root: String,
    #[serde(default)]
    pub global_fontface: Value,
    #[serde(default)]
    pub global_position_try: Value,
    #[serde(default)]
    pub themes: ThemeVariantsMap,
    #[serde(default)]
    pub validation: ValidationMode,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

fn default_css_var_root() -> String {
    ":where(:root, :host)".to_owned()
}

impl UserConfig {
    #[must_use]
    pub fn condition_names(&self) -> Vec<String> {
        let mut names = BTreeSet::new();
        names.insert("base".to_owned());

        for key in self.conditions.keys().filter(|key| !key.is_empty()) {
            names.insert(format!("_{key}"));
        }

        names.extend(self.theme.breakpoint_names());
        names.into_iter().collect()
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ValidationMode {
    None,
    #[default]
    Warn,
    Error,
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

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum JsxStylePropsConfig {
    #[default]
    All,
    Minimal,
    None,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PrefixConfig {
    #[default]
    None,
    String(String),
    Object(PrefixOptions),
}

impl PrefixConfig {
    #[must_use]
    pub fn class_name(&self) -> Option<&str> {
        match self {
            Self::String(value) => Some(value.as_str()),
            Self::Object(value) => value.class_name.as_deref(),
            Self::None => None,
        }
    }

    #[must_use]
    pub fn css_var(&self) -> Option<&str> {
        match self {
            Self::String(value) => Some(value.as_str()),
            Self::Object(value) => value.css_var.as_deref(),
            Self::None => None,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrefixOptions {
    #[serde(default)]
    pub class_name: Option<String>,
    #[serde(default)]
    pub css_var: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum HashConfig {
    #[default]
    None,
    Bool(bool),
    Object(HashOptions),
}

impl HashConfig {
    #[must_use]
    pub fn css_var(&self) -> bool {
        match self {
            Self::Bool(value) => *value,
            Self::Object(value) => value.css_var,
            Self::None => false,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HashOptions {
    #[serde(default)]
    pub css_var: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ConditionQuery {
    String(String),
    Array(Vec<String>),
    Nested(BTreeMap<String, ConditionQuery>),
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternConfig {
    #[serde(default, rename = "jsxName")]
    pub jsx_name: Option<String>,
    #[serde(default)]
    pub jsx: Vec<JsxSpecifier>,
    #[serde(default)]
    pub properties: BTreeMap<String, PatternPropertyConfig>,
    #[serde(default, rename = "defaultValues")]
    pub default_values: Option<Value>,
    #[serde(default)]
    pub transform: Option<CallbackRef>,
    #[serde(default)]
    pub strict: bool,
    #[serde(default)]
    pub blocklist: Vec<String>,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternPropertyConfig {
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub value: Option<Value>,
    #[serde(default)]
    pub property: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UtilityConfig {
    #[serde(default, rename = "className")]
    pub class_name: Option<String>,
    #[serde(default)]
    pub layer: Option<String>,
    #[serde(default)]
    pub deprecated: bool,
    #[serde(default)]
    pub shorthand: Option<StringOrStringArray>,
    #[serde(default)]
    pub values: Option<UtilityValues>,
    #[serde(default)]
    pub transform: Option<CallbackRef>,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum StringOrStringArray {
    String(String),
    Array(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum UtilityValues {
    Category(String),
    Array(Vec<String>),
    Map(BTreeMap<String, Value>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum JsxSpecifier {
    String(String),
    Regex(SerializedRegex),
}

impl JsxSpecifier {
    #[must_use]
    pub fn as_string(&self) -> Option<&str> {
        match self {
            Self::String(value) => Some(value.as_str()),
            Self::Regex(_) => None,
        }
    }

    #[must_use]
    pub fn as_regex(&self) -> Option<&SerializedRegex> {
        match self {
            Self::Regex(value) if value.kind == "regex" => Some(value),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerializedRegex {
    pub kind: String,
    pub source: String,
    #[serde(default)]
    pub flags: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CallbackRef {
    pub kind: String,
    #[serde(default)]
    pub id: Option<String>,
}
