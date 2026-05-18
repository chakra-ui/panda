use std::collections::BTreeMap;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::JsxSpecifier;

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
    pub container_names: Vec<String>,
    #[serde(default)]
    pub container_sizes: BTreeMap<String, String>,
    #[serde(default)]
    pub color_palette: ColorPaletteOptions,
}

impl Theme {
    #[must_use]
    pub fn breakpoint_names(&self) -> Vec<String> {
        let mut entries: Vec<_> = self
            .breakpoints
            .iter()
            .map(|(name, value)| (name.clone(), breakpoint_sort_value(value)))
            .collect();
        entries.sort_by(|(name_a, value_a), (name_b, value_b)| {
            value_a
                .partial_cmp(value_b)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| name_a.cmp(name_b))
        });

        let mut names = Vec::with_capacity(entries.len() + 1);
        names.push("base".to_owned());
        names.extend(entries.into_iter().map(|(name, _)| name));
        names
    }
}

fn breakpoint_sort_value(value: &str) -> f64 {
    value
        .chars()
        .take_while(|ch| ch.is_ascii_digit() || *ch == '.')
        .collect::<String>()
        .parse()
        .unwrap_or(f64::INFINITY)
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Deprecated {
    Bool(bool),
    Message(String),
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
