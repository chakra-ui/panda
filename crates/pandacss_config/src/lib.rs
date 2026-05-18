//! Serialized configuration types consumed by the Panda Rust runtime.

mod theme;

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub use theme::{
    Asset, AssetType, AssetValue, Border, BorderStyle, BorderValue, ColorPaletteOptions,
    Deprecated, EasingValue, FontValue, Gradient, GradientStop, GradientStops, GradientValue,
    SemanticTokens, SemanticValue, Shadow, ShadowValue, StringOrNumber, StyleConfig, Theme,
    ThemeVariant, ThemeVariantsMap, TokenEntry, TokenGroup, TokenNode, Tokens,
};

/// JSON-safe resolved config snapshot produced on the JavaScript side.
///
/// JavaScript remains responsible for executing `panda.config.*`,
/// resolving presets, and running config-phase plugins. Rust consumes this
/// serializable shape after runtime-only hooks/plugins have been removed.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
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
    pub theme: Theme,
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
    pub themes: ThemeVariantsMap,
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
