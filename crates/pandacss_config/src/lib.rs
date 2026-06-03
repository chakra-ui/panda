//! Serialized configuration types consumed by the Panda Rust runtime.

mod theme;
mod type_data;
mod validate;

use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::Value;

pub use theme::{
    Asset, AssetType, AssetValue, Border, BorderStyle, BorderValue, ColorPaletteOptions,
    CompoundVariantConfig, Deprecated, EasingValue, FontValue, Gradient, GradientStop,
    GradientStops, GradientValue, RecipeConfig, SemanticTokens, SemanticValue, Shadow, ShadowValue,
    StringOrNumber, StyleConfig, Theme, ThemeVariant, ThemeVariantsMap, TokenEntry, TokenGroup,
    TokenNode, Tokens, VariantSelection,
};
pub use type_data::{
    ConditionTypeData, PatternPropertyTypeData, PatternPropertyTypeKind, PatternTypeData,
    PatternTypeDefinition, PrimitiveType, RecipeTypeData, RecipeTypeDefinition, SelectorTypeData,
    SlotRecipeTypeDefinition, Spec, TokenCategoryTypeData, TokenTypeData, TypeData, TypegenOptions,
    UtilityPropertyTypeData, UtilityTypeData, ValueAliasTypeData, ValueTypePart, VariantTypeData,
    token_category_type_name, value_alias_name,
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
    pub jsx_framework: Option<JsxFramework>,
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
    pub layers: CascadeLayers,
    #[serde(default)]
    pub preflight: PreflightConfig,
    #[serde(default, deserialize_with = "deserialize_optimize_config")]
    pub optimize: OptimizeConfig,
    #[serde(default)]
    pub codegen_format: CodegenFormat,
    #[serde(default, rename = "codegenImportExtensions")]
    pub codegen_import_extensions: bool,
    #[serde(default, rename = "strictTokens")]
    pub strict_tokens: bool,
    #[serde(default, rename = "strictPropertyValues")]
    pub strict_property_values: bool,
    #[serde(default)]
    pub validation: ValidationMode,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

fn default_css_var_root() -> String {
    ":where(:root, :host)".to_owned()
}

fn deserialize_optimize_config<'de, D>(deserializer: D) -> Result<OptimizeConfig, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let value = Value::deserialize(deserializer)?;
    if value.is_null() {
        return Ok(OptimizeConfig::default());
    }
    if value.is_object() {
        return serde_json::from_value(value).map_err(serde::de::Error::custom);
    }
    Ok(OptimizeConfig::default())
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

/// Stylesheet optimization switches. All optimizations are opt-in because
/// Panda normally emits the complete token/keyframe surface for external CSS.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptimizeConfig {
    #[serde(default)]
    pub remove_unused_tokens: bool,
    #[serde(default)]
    pub remove_unused_keyframes: bool,
}

/// User-facing names for the five cascade layers. Matches v1's
/// `config.layers: Partial<CascadeLayers>` — any field a user omits keeps
/// its default. The semantic identity (`StylesheetLayer::*`) is fixed; only
/// the emitted name changes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CascadeLayers {
    #[serde(default = "CascadeLayers::default_reset")]
    pub reset: String,
    #[serde(default = "CascadeLayers::default_base")]
    pub base: String,
    #[serde(default = "CascadeLayers::default_tokens")]
    pub tokens: String,
    #[serde(default = "CascadeLayers::default_recipes")]
    pub recipes: String,
    #[serde(default = "CascadeLayers::default_utilities")]
    pub utilities: String,
}

impl Default for CascadeLayers {
    fn default() -> Self {
        Self {
            reset: Self::default_reset(),
            base: Self::default_base(),
            tokens: Self::default_tokens(),
            recipes: Self::default_recipes(),
            utilities: Self::default_utilities(),
        }
    }
}

impl CascadeLayers {
    fn default_reset() -> String {
        "reset".to_owned()
    }
    fn default_base() -> String {
        "base".to_owned()
    }
    fn default_tokens() -> String {
        "tokens".to_owned()
    }
    fn default_recipes() -> String {
        "recipes".to_owned()
    }
    fn default_utilities() -> String {
        "utilities".to_owned()
    }

    /// Single source of truth for the fixed emit order: each pair is
    /// `(semantic_field_name, user_facing_name)`. Used both for emission
    /// and collision detection so the order is never duplicated.
    #[must_use]
    pub fn ordered(&self) -> [(&'static str, &str); 5] {
        [
            ("reset", &self.reset),
            ("base", &self.base),
            ("tokens", &self.tokens),
            ("recipes", &self.recipes),
            ("utilities", &self.utilities),
        ]
    }
}

/// Reset / preflight CSS configuration. Matches JS shape:
/// `preflight: true | false | { scope?: string; level?: 'parent' | 'element' }`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PreflightConfig {
    Bool(bool),
    Options(PreflightOptions),
}

impl Default for PreflightConfig {
    fn default() -> Self {
        Self::Bool(false)
    }
}

impl PreflightConfig {
    #[must_use]
    pub fn enabled(&self) -> bool {
        match self {
            Self::Bool(value) => *value,
            Self::Options(_) => true,
        }
    }

    #[must_use]
    pub fn options(&self) -> Option<&PreflightOptions> {
        match self {
            Self::Options(options) => Some(options),
            Self::Bool(_) => None,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreflightOptions {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub level: Option<PreflightLevel>,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PreflightLevel {
    #[default]
    Parent,
    Element,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ValidationMode {
    None,
    #[default]
    Warn,
    Error,
}

/// Output format for generated artifacts. `Ts` emits source `.ts` directly;
/// `Js`/`Mjs` split each module into a runtime file (`CommonJS` / ESM) plus a
/// `.d.ts`. Drives the consumer codegen emit mode + file extensions.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CodegenFormat {
    Js,
    #[default]
    Mjs,
    Ts,
}

impl CodegenFormat {
    #[must_use]
    pub fn is_source_ts(self) -> bool {
        matches!(self, Self::Ts)
    }

    #[must_use]
    pub fn is_split(self) -> bool {
        !self.is_source_ts()
    }

    #[must_use]
    pub fn runtime_extension(self) -> &'static str {
        match self {
            Self::Js => "js",
            Self::Mjs => "mjs",
            Self::Ts => "ts",
        }
    }

    #[must_use]
    pub fn declaration_extension(self) -> Option<&'static str> {
        match self {
            Self::Js => Some("d.ts"),
            Self::Mjs => Some("d.mts"),
            Self::Ts => None,
        }
    }
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JsxFramework {
    React,
    Solid,
    Preact,
    Vue,
    Qwik,
    Custom(String),
}

impl JsxFramework {
    #[must_use]
    pub fn as_str(&self) -> &str {
        match self {
            Self::React => "react",
            Self::Solid => "solid",
            Self::Preact => "preact",
            Self::Vue => "vue",
            Self::Qwik => "qwik",
            Self::Custom(value) => value,
        }
    }

    #[must_use]
    pub fn is_known(&self) -> bool {
        !matches!(self, Self::Custom(_))
    }
}

impl Serialize for JsxFramework {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for JsxFramework {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = String::deserialize(deserializer)?;
        Ok(match value.as_str() {
            "react" => Self::React,
            "solid" => Self::Solid,
            "preact" => Self::Preact,
            "vue" => Self::Vue,
            "qwik" => Self::Qwik,
            _ => Self::Custom(value),
        })
    }
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

    #[must_use]
    pub fn class_name(&self) -> bool {
        match self {
            Self::Bool(value) => *value,
            Self::Object(value) => value.class_name,
            Self::None => false,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HashOptions {
    #[serde(default)]
    pub css_var: bool,
    #[serde(default)]
    pub class_name: bool,
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
    /// Pre-stringified `{ transform, defaultValues }` source for codegen, prepared
    /// by the JS config loader (Rust never stringifies a JS function). Embedded
    /// verbatim into the generated pattern module.
    #[serde(default, rename = "codegenSource")]
    pub codegen_source: Option<String>,
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
    #[serde(default)]
    pub property: Option<String>,
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
