use std::collections::BTreeMap;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{JsxSpecifier, ranges};

pub type StyleConfig = Value;
pub type TokenGroup<T> = IndexMap<String, TokenNode<T>>;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    #[serde(default)]
    pub breakpoints: BTreeMap<String, String>,
    #[serde(default)]
    pub keyframes: StyleConfig,
    #[serde(default)]
    pub tokens: Tokens,
    #[serde(default)]
    pub semantic_tokens: SemanticTokens,
    #[serde(default)]
    pub text_styles: StyleConfig,
    #[serde(default)]
    pub layer_styles: StyleConfig,
    #[serde(default)]
    pub animation_styles: StyleConfig,
    #[serde(default)]
    pub recipes: BTreeMap<String, RecipeConfig>,
    #[serde(default)]
    pub slot_recipes: BTreeMap<String, RecipeConfig>,
    #[serde(default)]
    pub containers: BTreeMap<String, String>,
    #[serde(default)]
    pub container_names: Vec<String>,
    #[serde(default)]
    pub color_palette: ColorPaletteOptions,
}

impl Theme {
    #[must_use]
    pub fn breakpoint_names(&self) -> Vec<String> {
        let entries = ranges::sorted_scale(&self.breakpoints);
        let mut names = Vec::with_capacity(entries.len() + 1);
        names.push("base".to_owned());
        names.extend(entries.into_iter().map(|entry| entry.name));
        names
    }

    #[must_use]
    pub fn breakpoint_condition_names(&self) -> Vec<String> {
        self.breakpoint_conditions()
            .into_iter()
            .map(|rule| rule.key)
            .collect()
    }

    #[must_use]
    pub fn breakpoint_condition_query(&self, key: &str) -> Option<String> {
        self.breakpoint_conditions()
            .into_iter()
            .find(|rule| rule.key == key)
            .map(|rule| rule.query)
    }

    #[must_use]
    pub fn container_names(&self) -> Vec<String> {
        self.container_names.clone()
    }

    #[must_use]
    pub fn container_condition_names(&self) -> Vec<String> {
        self.container_conditions()
            .into_iter()
            .map(|condition| condition.key)
            .collect()
    }

    #[must_use]
    pub fn container_condition_query(&self, key: &str) -> Option<String> {
        self.container_conditions()
            .into_iter()
            .find(|condition| condition.key == key)
            .map(|condition| condition.query)
    }

    #[must_use]
    pub fn container_conditions(&self) -> Vec<ContainerCondition> {
        let mut conditions = BTreeMap::new();
        let scale = self.container_scale();

        insert_container_conditions(&mut conditions, "", &scale);
        for name in self.container_names.iter().filter(|name| !name.is_empty()) {
            insert_container_conditions(&mut conditions, name, &scale);
        }

        conditions
            .into_iter()
            .map(|(key, query)| ContainerCondition { key, query })
            .collect()
    }

    fn container_scale(&self) -> BTreeMap<String, String> {
        self.containers.clone()
    }

    fn breakpoint_conditions(&self) -> Vec<ranges::RangeRule> {
        ranges::range_rules(&self.breakpoints, str::to_owned, |min, max| {
            format!("@media {}", ranges::range_query("width", min, max))
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContainerCondition {
    pub key: String,
    pub query: String,
}

fn insert_container_conditions(
    conditions: &mut BTreeMap<String, String>,
    name: &str,
    scale: &BTreeMap<String, String>,
) {
    if scale.is_empty() {
        return;
    }

    for rule in ranges::range_rules(
        scale,
        |range| container_condition_key(name, range),
        |min, max| container_query(name, min, max),
    ) {
        conditions.insert(rule.key, rule.query);
    }
}

fn container_condition_key(name: &str, range: &str) -> String {
    format!("@{name}/{range}")
}

fn container_query(name: &str, min: Option<&str>, max: Option<&str>) -> String {
    let query = ranges::range_query("inline-size", min, max);

    if name.is_empty() {
        format!("@container {query}")
    } else {
        format!("@container {name} {query}")
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorPaletteOptions {
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub include: Vec<String>,
    #[serde(default)]
    pub exclude: Vec<String>,
}

pub type ThemeVariantsMap = BTreeMap<String, ThemeVariant>;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeVariant {
    #[serde(default)]
    pub tokens: Tokens,
    #[serde(default)]
    pub semantic_tokens: SemanticTokens,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeConfig {
    #[serde(default, rename = "className")]
    pub class_name: Option<String>,
    #[serde(default)]
    pub jsx: Vec<JsxSpecifier>,
    #[serde(default)]
    pub slots: Vec<String>,
    #[serde(default)]
    pub base: Option<StyleConfig>,
    #[serde(default)]
    pub variants: BTreeMap<String, BTreeMap<String, StyleConfig>>,
    #[serde(default, rename = "defaultVariants")]
    pub default_variants: BTreeMap<String, VariantSelection>,
    #[serde(default, rename = "compoundVariants")]
    pub compound_variants: Vec<CompoundVariantConfig>,
    #[serde(default)]
    pub deprecated: Option<Deprecated>,
    #[serde(default, rename = "staticCss")]
    pub static_css: Value,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum VariantSelection {
    String(String),
    Number(f64),
    Bool(bool),
    Array(Vec<VariantSelection>),
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CompoundVariantConfig {
    pub css: StyleConfig,
    #[serde(default, rename = "className")]
    pub class_name: Option<String>,
    #[serde(flatten)]
    pub conditions: BTreeMap<String, VariantSelection>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tokens {
    #[serde(default)]
    pub cursor: TokenGroup<String>,
    #[serde(default, rename = "zIndex")]
    pub z_index: TokenGroup<StringOrNumber>,
    #[serde(default)]
    pub opacity: TokenGroup<StringOrNumber>,
    #[serde(default)]
    pub colors: TokenGroup<String>,
    #[serde(default)]
    pub fonts: TokenGroup<FontValue>,
    #[serde(default, rename = "fontSizes")]
    pub font_sizes: TokenGroup<String>,
    #[serde(default, rename = "fontWeights")]
    pub font_weights: TokenGroup<StringOrNumber>,
    #[serde(default, rename = "lineHeights")]
    pub line_heights: TokenGroup<StringOrNumber>,
    #[serde(default, rename = "letterSpacings")]
    pub letter_spacings: TokenGroup<String>,
    #[serde(default)]
    pub sizes: TokenGroup<String>,
    #[serde(default)]
    pub shadows: TokenGroup<ShadowValue>,
    #[serde(default)]
    pub spacing: TokenGroup<StringOrNumber>,
    #[serde(default)]
    pub radii: TokenGroup<String>,
    #[serde(default)]
    pub borders: TokenGroup<BorderValue>,
    #[serde(default)]
    pub durations: TokenGroup<String>,
    #[serde(default)]
    pub easings: TokenGroup<EasingValue>,
    #[serde(default)]
    pub animations: TokenGroup<String>,
    #[serde(default)]
    pub blurs: TokenGroup<String>,
    #[serde(default)]
    pub gradients: TokenGroup<GradientValue>,
    #[serde(default)]
    pub assets: TokenGroup<AssetValue>,
    #[serde(default, rename = "borderWidths")]
    pub border_widths: TokenGroup<String>,
    #[serde(default, rename = "aspectRatios")]
    pub aspect_ratios: TokenGroup<String>,
    #[serde(default, rename = "containerNames")]
    pub container_names: TokenGroup<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SemanticTokens {
    #[serde(default)]
    pub cursor: TokenGroup<SemanticValue<String>>,
    #[serde(default, rename = "zIndex")]
    pub z_index: TokenGroup<SemanticValue<StringOrNumber>>,
    #[serde(default)]
    pub opacity: TokenGroup<SemanticValue<StringOrNumber>>,
    #[serde(default)]
    pub colors: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub fonts: TokenGroup<SemanticValue<FontValue>>,
    #[serde(default, rename = "fontSizes")]
    pub font_sizes: TokenGroup<SemanticValue<String>>,
    #[serde(default, rename = "fontWeights")]
    pub font_weights: TokenGroup<SemanticValue<StringOrNumber>>,
    #[serde(default, rename = "lineHeights")]
    pub line_heights: TokenGroup<SemanticValue<StringOrNumber>>,
    #[serde(default, rename = "letterSpacings")]
    pub letter_spacings: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub sizes: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub shadows: TokenGroup<SemanticValue<ShadowValue>>,
    #[serde(default)]
    pub spacing: TokenGroup<SemanticValue<StringOrNumber>>,
    #[serde(default)]
    pub radii: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub borders: TokenGroup<SemanticValue<BorderValue>>,
    #[serde(default)]
    pub durations: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub easings: TokenGroup<SemanticValue<EasingValue>>,
    #[serde(default)]
    pub animations: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub blurs: TokenGroup<SemanticValue<String>>,
    #[serde(default)]
    pub gradients: TokenGroup<SemanticValue<GradientValue>>,
    #[serde(default)]
    pub assets: TokenGroup<SemanticValue<AssetValue>>,
    #[serde(default, rename = "borderWidths")]
    pub border_widths: TokenGroup<SemanticValue<String>>,
    #[serde(default, rename = "aspectRatios")]
    pub aspect_ratios: TokenGroup<SemanticValue<String>>,
    #[serde(default, rename = "containerNames")]
    pub container_names: TokenGroup<SemanticValue<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum TokenNode<T> {
    Token(TokenEntry<T>),
    Group(TokenGroup<T>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenEntry<T> {
    pub value: T,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub deprecated: Option<Deprecated>,
    #[serde(default)]
    pub extensions: Option<serde_json::Map<String, Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum SemanticValue<T> {
    Conditions(IndexMap<String, SemanticValue<T>>),
    Value(T),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Deprecated {
    Bool(bool),
    Message(String),
}

impl Deprecated {
    /// Whether this represents an active deprecation (`true` or a non-empty
    /// message). `deprecated: false` and an empty message are inactive.
    #[must_use]
    pub fn is_active(&self) -> bool {
        match self {
            Deprecated::Bool(value) => *value,
            Deprecated::Message(message) => !message.is_empty(),
        }
    }

    /// Normalize an optional config value to an active deprecation, collapsing
    /// `Some(Bool(false))` / empty messages to `None`.
    #[must_use]
    pub fn normalize(value: Option<&Deprecated>) -> Option<Deprecated> {
        value.filter(|value| value.is_active()).cloned()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum StringOrNumber {
    String(String),
    Number(f64),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FontValue {
    String(String),
    Array(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ShadowValue {
    String(String),
    StringArray(Vec<String>),
    Shadow(Shadow),
    ShadowArray(Vec<Shadow>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Shadow {
    pub offset_x: StringOrNumber,
    pub offset_y: StringOrNumber,
    pub blur: StringOrNumber,
    pub spread: StringOrNumber,
    pub color: String,
    #[serde(default)]
    pub inset: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum BorderValue {
    String(String),
    Border(Border),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Border {
    pub color: String,
    pub width: StringOrNumber,
    pub style: BorderStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum BorderStyle {
    Dashed,
    Dotted,
    Double,
    Groove,
    Hidden,
    Inset,
    None,
    Outset,
    Ridge,
    Solid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum GradientValue {
    String(String),
    Gradient(Gradient),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Gradient {
    pub r#type: String,
    pub placement: StringOrNumber,
    pub stops: GradientStops,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum GradientStops {
    Strings(Vec<String>),
    Stops(Vec<GradientStop>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GradientStop {
    pub color: String,
    pub position: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AssetValue {
    String(String),
    Asset(Asset),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub r#type: AssetType,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AssetType {
    Url,
    Svg,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum EasingValue {
    String(String),
    Array(Vec<f64>),
}
