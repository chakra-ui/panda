//! Design-token dictionary — read-only lookup view over a resolved
//! Panda theme. Used by the Rust extractor (`token('path')` resolution),
//! utility transforms, and the future Rust emitter.
//!
//! The public project API builds this from config, while this crate owns
//! the token-domain details: walking theme tokens, semantic tokens,
//! breakpoint tokens, theme variant tokens, and building the lookup
//! indexes. Every read path is O(1) or O(matches), never O(n), backed by
//! `rustc_hash::FxHashMap` indexes built once at construction time.

use rustc_hash::FxHashMap;
use std::collections::{BTreeMap, HashMap, hash_map::Entry};
use std::sync::Arc;

use pandacss_config::{Deprecated, TokenCategoryTypeData, TokenTypeData, token_category_type_name};
use pandacss_shared::number_to_js_string;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

mod from_config;
mod transform;

pub use from_config::TokenDictionaryOptions;
pub use pandacss_shared::PandaError as TokenError;

/// Token category — the top-level bucket a path belongs to.
///
/// Variant names match `packages/types/src/tokens.ts` so JS-resolved
/// dictionaries serialize cleanly into Rust without an extra translation
/// step. Unknown categories fall through to [`Self::Other`] preserving
/// the original spelling.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub enum TokenCategory {
    Colors,
    Sizes,
    Spacing,
    FontSizes,
    Fonts,
    LineHeights,
    LetterSpacings,
    FontWeights,
    Radii,
    Shadows,
    BorderWidths,
    Borders,
    Easings,
    Durations,
    Transitions,
    Gradients,
    Opacity,
    ZIndex,
    Assets,
    Cursor,
    AspectRatios,
    Animations,
    Blurs,
    Breakpoints,
    Other(String),
}

impl TokenCategory {
    #[must_use]
    pub fn from_path_segment(s: &str) -> Self {
        match s {
            "colors" => Self::Colors,
            "sizes" => Self::Sizes,
            "spacing" => Self::Spacing,
            "fontSizes" => Self::FontSizes,
            "fonts" => Self::Fonts,
            "lineHeights" => Self::LineHeights,
            "letterSpacings" => Self::LetterSpacings,
            "fontWeights" => Self::FontWeights,
            "radii" => Self::Radii,
            "shadows" => Self::Shadows,
            "borderWidths" => Self::BorderWidths,
            "borders" => Self::Borders,
            "easings" => Self::Easings,
            "durations" => Self::Durations,
            "transitions" => Self::Transitions,
            "gradients" => Self::Gradients,
            "opacity" => Self::Opacity,
            "zIndex" => Self::ZIndex,
            "assets" => Self::Assets,
            "cursor" => Self::Cursor,
            "aspectRatios" => Self::AspectRatios,
            "animations" => Self::Animations,
            "blurs" => Self::Blurs,
            "breakpoints" => Self::Breakpoints,
            other => Self::Other(other.to_owned()),
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        match self {
            Self::Colors => "colors",
            Self::Sizes => "sizes",
            Self::Spacing => "spacing",
            Self::FontSizes => "fontSizes",
            Self::Fonts => "fonts",
            Self::LineHeights => "lineHeights",
            Self::LetterSpacings => "letterSpacings",
            Self::FontWeights => "fontWeights",
            Self::Radii => "radii",
            Self::Shadows => "shadows",
            Self::BorderWidths => "borderWidths",
            Self::Borders => "borders",
            Self::Easings => "easings",
            Self::Durations => "durations",
            Self::Transitions => "transitions",
            Self::Gradients => "gradients",
            Self::Opacity => "opacity",
            Self::ZIndex => "zIndex",
            Self::Assets => "assets",
            Self::Cursor => "cursor",
            Self::AspectRatios => "aspectRatios",
            Self::Animations => "animations",
            Self::Blurs => "blurs",
            Self::Breakpoints => "breakpoints",
            Self::Other(s) => s.as_str(),
        }
    }
}

// PERF(port): FxHashMap because extension keys are short well-known strings
// (`theme`, `isSemantic`, `prop`, …) where FxHash beats SipHash decisively.
pub type TokenExtensions = FxHashMap<String, String>;

/// One resolved token. `condition: None` is the base / unconditional variant.
///
/// `extensions: Option<Box<...>>` keeps the no-metadata case (the vast
/// majority of tokens) to one nullable pointer instead of an inline 48-byte
/// `HashMap` — saves ~40 bytes per token and avoids a heap allocation when
/// building dictionaries with thousands of plain tokens.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(from = "TokenWire", into = "TokenWire"))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct Token {
    pub path: Arc<str>,
    pub value: Arc<str>,
    pub var: Arc<str>,
    pub category: TokenCategory,
    pub condition: Option<Arc<str>>,
    /// Pre-alias-substitution value. Optional because the JS path strips
    /// it once references are expanded.
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub original_value: Option<Arc<str>>,
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub description: Option<Arc<str>>,
    #[cfg_attr(feature = "serde", serde(default))]
    pub deprecated: bool,
    /// Author-provided deprecation message (`deprecated: 'use X instead'`).
    /// `None` when deprecated via plain `true`.
    #[cfg_attr(
        feature = "serde",
        serde(default, skip_serializing_if = "Option::is_none")
    )]
    pub deprecated_reason: Option<Arc<str>>,
    #[cfg_attr(
        feature = "serde",
        serde(default, skip_serializing_if = "Option::is_none")
    )]
    pub extensions: Option<Box<TokenExtensions>>,
}

#[cfg(feature = "serde")]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TokenWire {
    path: String,
    value: String,
    var: String,
    category: TokenCategory,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    condition: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    original_value: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(default)]
    deprecated: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    deprecated_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    extensions: Option<Box<TokenExtensions>>,
}

#[cfg(feature = "serde")]
impl From<TokenWire> for Token {
    fn from(value: TokenWire) -> Self {
        Self {
            path: Arc::from(value.path),
            value: Arc::from(value.value),
            var: Arc::from(value.var),
            category: value.category,
            condition: value.condition.map(Arc::from),
            original_value: value.original_value.map(Arc::from),
            description: value.description.map(Arc::from),
            deprecated: value.deprecated,
            deprecated_reason: value.deprecated_reason.map(Arc::from),
            extensions: value.extensions,
        }
    }
}

#[cfg(feature = "serde")]
impl From<Token> for TokenWire {
    fn from(value: Token) -> Self {
        Self {
            path: value.path.to_string(),
            value: value.value.to_string(),
            var: value.var.to_string(),
            category: value.category,
            condition: value.condition.map(|value| value.to_string()),
            original_value: value.original_value.map(|value| value.to_string()),
            description: value.description.map(|value| value.to_string()),
            deprecated: value.deprecated,
            deprecated_reason: value.deprecated_reason.map(|value| value.to_string()),
            extensions: value.extensions,
        }
    }
}

impl Token {
    #[must_use]
    pub fn new(
        path: impl AsRef<str>,
        value: impl AsRef<str>,
        var: impl AsRef<str>,
        category: TokenCategory,
    ) -> Self {
        Self {
            path: Arc::from(path.as_ref()),
            value: Arc::from(value.as_ref()),
            var: Arc::from(var.as_ref()),
            category,
            condition: None,
            original_value: None,
            description: None,
            deprecated: false,
            deprecated_reason: None,
            extensions: None,
        }
    }

    #[must_use]
    pub fn with_condition(mut self, condition: impl AsRef<str>) -> Self {
        self.condition = Some(Arc::from(condition.as_ref()));
        self
    }

    #[must_use]
    pub fn with_description(mut self, description: impl AsRef<str>) -> Self {
        self.description = Some(Arc::from(description.as_ref()));
        self
    }

    #[must_use]
    pub fn deprecated(mut self) -> Self {
        self.deprecated = true;
        self
    }

    #[must_use]
    pub fn deprecated_with_reason(mut self, reason: impl AsRef<str>) -> Self {
        self.deprecated = true;
        self.deprecated_reason = Some(Arc::from(reason.as_ref()));
        self
    }

    #[must_use]
    pub fn extension(&self, key: &str) -> Option<&str> {
        self.extensions
            .as_deref()
            .and_then(|m| m.get(key))
            .map(String::as_str)
    }

    /// Lazily allocates the underlying map on first write so tokens with
    /// no extensions never pay the allocation cost.
    pub fn set_extension(&mut self, key: impl Into<String>, value: impl Into<String>) {
        self.extensions
            .get_or_insert_with(|| Box::new(FxHashMap::default()))
            .insert(key.into(), value.into());
    }

    pub fn extension_entries(&self) -> impl Iterator<Item = (&str, &str)> + '_ {
        self.extensions
            .as_deref()
            .into_iter()
            .flat_map(|m| m.iter().map(|(k, v)| (k.as_str(), v.as_str())))
    }
}

/// `palette -> (virtual var -> token var)` index backing color-palette
/// resolution. Built alongside the dictionary's other indexes.
#[derive(Debug, Clone, Default)]
pub struct ColorPaletteView {
    palettes: FxHashMap<Arc<str>, FxHashMap<Arc<str>, Arc<str>>>,
}

impl ColorPaletteView {
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.palettes.is_empty()
    }

    #[must_use]
    pub fn palettes(&self) -> &FxHashMap<Arc<str>, FxHashMap<Arc<str>, Arc<str>>> {
        &self.palettes
    }

    #[must_use]
    pub fn get(&self, palette: &str) -> Option<&FxHashMap<Arc<str>, Arc<str>>> {
        self.palettes.get(palette)
    }

    pub(crate) fn insert(
        &mut self,
        palette: impl AsRef<str>,
        virtual_var: impl AsRef<str>,
        token_var: Arc<str>,
    ) {
        self.palettes
            .entry(Arc::from(palette.as_ref()))
            .or_default()
            .insert(Arc::from(virtual_var.as_ref()), token_var);
    }
}

/// Snapshot of a token dictionary. Immutable once built.
///
/// Serde emits only `tokens`; the indexes are derived state, rebuilt via the
/// builder on `Deserialize`. The custom `Deserialize` below prevents the
/// "deserialized dictionary has empty indexes" hazard a naked derive would
/// introduce.
#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub struct TokenDictionary {
    tokens: Vec<Token>,
    /// `path` → base token index. Base wins over conditional for the same
    /// path so `get()` returns the canonical value — matches JS view
    /// semantics where `rawValues` is keyed by name without condition.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_path: FxHashMap<Arc<str>, usize>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_var: FxHashMap<Arc<str>, usize>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_category: FxHashMap<TokenCategory, Vec<usize>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_category_key: FxHashMap<TokenCategory, FxHashMap<Arc<str>, usize>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    category_values_cache: FxHashMap<TokenCategory, FxHashMap<Arc<str>, Arc<str>>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_condition: FxHashMap<Arc<str>, Vec<usize>>,
    /// Nested so lookups never allocate (two O(1) hashes); a flat
    /// `(String, String)` key would force a `to_owned` per call.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_path_condition: FxHashMap<Arc<str>, FxHashMap<Arc<str>, usize>>,
    /// First-seen condition names. Built once so `conditions()` is a
    /// zero-work slice borrow.
    #[cfg_attr(feature = "serde", serde(skip))]
    conditions_order: Vec<Arc<str>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    deprecated_paths_cache: Vec<Arc<str>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    color_palettes: ColorPaletteView,
}

#[cfg(feature = "serde")]
impl<'de> Deserialize<'de> for TokenDictionary {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize)]
        struct Wire {
            #[serde(default)]
            tokens: Vec<Token>,
        }
        let wire = Wire::deserialize(deserializer)?;
        Ok(TokenDictionaryBuilder {
            tokens: wire.tokens,
            color_palettes: None,
        }
        .build())
    }
}

impl TokenDictionary {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn builder() -> TokenDictionaryBuilder {
        TokenDictionaryBuilder::default()
    }

    /// Build a token dictionary from a Panda user config.
    ///
    /// # Errors
    ///
    /// Returns an error when token transforms encounter invalid configured
    /// values, such as malformed color-mix opacity expressions.
    pub fn from_config(config: &pandacss_config::UserConfig) -> Result<Option<Self>, TokenError> {
        let _span = tracing::debug_span!("token_dictionary_build", source = "config").entered();
        Self::from_options(TokenDictionaryOptions::from_config(config))
    }

    /// Build a token dictionary from normalized token dictionary options.
    ///
    /// # Errors
    ///
    /// Returns an error when token transforms encounter invalid configured
    /// values, such as malformed color-mix opacity expressions.
    pub fn from_options(options: TokenDictionaryOptions<'_>) -> Result<Option<Self>, TokenError> {
        let _span = tracing::debug_span!("token_dictionary_build", source = "options").entered();
        from_config::create_token_dictionary(options)
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.tokens.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.tokens.is_empty()
    }

    pub fn iter(&self) -> impl Iterator<Item = &Token> + '_ {
        self.tokens.iter()
    }

    #[must_use]
    pub fn css_vars(&self) -> TokenCssVars<'_> {
        self.css_vars_with_theme_filter(|_| false)
    }

    #[must_use]
    pub fn css_vars_with_theme_filter(
        &self,
        mut include_theme_condition: impl FnMut(&str) -> bool,
    ) -> TokenCssVars<'_> {
        let mut view = TokenCssVars::default();
        let mut condition_indexes: FxHashMap<&str, usize> = FxHashMap::default();
        for token in &self.tokens {
            let Some(name) = raw_css_var(token.var.as_ref()) else {
                continue;
            };
            if token.extension("isNegative") == Some("true")
                || token.extension("isVirtual") == Some("true")
            {
                continue;
            }

            let var = TokenCssVar {
                name,
                value: token.value.as_ref(),
            };
            let Some(condition) = token.condition.as_deref() else {
                view.base.push(var);
                continue;
            };
            if is_theme_condition(condition) && !include_theme_condition(condition) {
                continue;
            }

            match condition_indexes.entry(condition) {
                Entry::Occupied(entry) => {
                    view.conditions[*entry.get()].vars.push(var);
                }
                Entry::Vacant(entry) => {
                    let index = view.conditions.len();
                    entry.insert(index);
                    view.conditions.push(TokenCssConditionVars {
                        condition,
                        vars: vec![var],
                    });
                }
            }
        }
        view
    }

    pub fn iter_category<'a>(
        &'a self,
        category: &'a TokenCategory,
    ) -> impl Iterator<Item = &'a Token> + 'a {
        self.by_category
            .get(category)
            .into_iter()
            .flat_map(move |ids| ids.iter().map(move |&i| &self.tokens[i]))
    }

    pub fn iter_condition<'a>(
        &'a self,
        condition_name: &'a str,
    ) -> impl Iterator<Item = &'a Token> + 'a {
        self.by_condition
            .get(condition_name)
            .into_iter()
            .flat_map(move |ids| ids.iter().map(move |&i| &self.tokens[i]))
    }

    /// Distinct condition names in first-seen order; `None` (base) excluded.
    #[must_use]
    pub fn conditions(&self) -> &[Arc<str>] {
        &self.conditions_order
    }

    #[must_use]
    pub fn token(&self, path: &str) -> Option<&Token> {
        self.by_path.get(path).map(|&i| &self.tokens[i])
    }

    /// Conditional record for a path. Callers can combine with [`Self::token`]
    /// to model JS's "use condition value if present, else base."
    #[must_use]
    pub fn token_with_condition(&self, path: &str, condition: &str) -> Option<&Token> {
        self.by_path_condition
            .get(path)?
            .get(condition)
            .map(|&i| &self.tokens[i])
    }

    /// Reverse lookup from a CSS variable string to the token that
    /// declared it.
    #[must_use]
    pub fn token_by_var(&self, var: &str) -> Option<&Token> {
        self.by_var.get(var).map(|&i| &self.tokens[i])
    }

    /// Allocating variant of [`Self::get_str`] for callers that need
    /// ownership. Prefer the borrow form when possible.
    #[must_use]
    pub fn get(&self, path: &str, fallback: Option<&str>) -> Option<String> {
        self.get_str(path, fallback).map(str::to_owned)
    }

    /// Allocating variant of [`Self::get_var_str`].
    #[must_use]
    pub fn get_var(&self, path: &str, fallback: Option<&str>) -> Option<String> {
        self.get_var_str(path, fallback).map(str::to_owned)
    }

    /// JSON-safe projection for JS interop. Keys are token paths; values are
    /// the canonical token value / CSS-var string that [`Self::token`] would
    /// resolve for each path.
    #[must_use]
    pub fn flat_maps(&self) -> (BTreeMap<String, String>, BTreeMap<String, String>) {
        let mut indexes: Vec<usize> = self.by_path.values().copied().collect();
        indexes.sort_unstable();
        indexes.dedup();

        let mut values = BTreeMap::new();
        let mut vars = BTreeMap::new();
        for index in indexes {
            let token = &self.tokens[index];
            values.insert(token.path.to_string(), token.value.to_string());
            if !token.var.is_empty() {
                vars.insert(token.path.to_string(), token.var.to_string());
            }
        }
        (values, vars)
    }

    /// Zero-allocation `token('path', fallback)` lookup.
    #[must_use]
    pub fn get_str<'a>(&'a self, path: &str, fallback: Option<&'a str>) -> Option<&'a str> {
        if let Some(token) = self.token(path) {
            return Some(token.value.as_ref());
        }
        fallback
    }

    /// Zero-allocation `token.var('path', fallback)` lookup.
    #[must_use]
    pub fn get_var_str<'a>(&'a self, path: &str, fallback: Option<&'a str>) -> Option<&'a str> {
        if let Some(token) = self.token(path) {
            return Some(token.var.as_ref());
        }
        fallback
    }

    #[must_use]
    pub fn is_valid_opacity_modifier(&self, raw_opacity: &str) -> bool {
        !raw_opacity.is_empty()
            && (raw_opacity.parse::<f64>().is_ok()
                || self
                    .get_str(&format!("opacity.{raw_opacity}"), None)
                    .is_some())
    }

    #[must_use]
    pub fn color_mix_str(&self, value: &str) -> Option<String> {
        let (color_path, raw_opacity) = value.split_once('/')?;
        if color_path.is_empty() || raw_opacity.is_empty() {
            return None;
        }

        let color = self.get_var_str(color_path, None).unwrap_or(color_path);
        let opacity = if let Some(opacity) = self.get_str(&format!("opacity.{raw_opacity}"), None) {
            let opacity = opacity.parse::<f64>().ok()?;
            let mut out = number_to_js_string(opacity * 100.0);
            out.push('%');
            out
        } else if raw_opacity.parse::<f64>().is_ok() {
            let mut out = String::with_capacity(raw_opacity.len() + 1);
            out.push_str(raw_opacity);
            out.push('%');
            out
        } else {
            return None;
        };

        let mut out =
            String::with_capacity("color-mix(in oklab, ".len() + color.len() + opacity.len() + 15);
        out.push_str("color-mix(in oklab, ");
        out.push_str(color);
        out.push(' ');
        out.push_str(&opacity);
        out.push_str(", transparent)");
        Some(out)
    }

    /// Snapshot of `{ path → value }` for one category. Only base tokens
    /// are included; conditional variants live under their own indices.
    #[must_use]
    pub fn category_values(&self, category: &TokenCategory) -> FxHashMap<String, String> {
        self.category_values_cache
            .get(category)
            .map(|values| {
                values
                    .iter()
                    .map(|(key, value)| (key.to_string(), value.to_string()))
                    .collect()
            })
            .unwrap_or_default()
    }

    #[must_use]
    pub fn category_values_str(
        &self,
        category: &TokenCategory,
    ) -> Option<&FxHashMap<Arc<str>, Arc<str>>> {
        self.category_values_cache.get(category)
    }

    /// Iterate token categories that have at least one value in this dictionary.
    pub fn categories(&self) -> impl Iterator<Item = &TokenCategory> {
        self.category_values_cache.keys()
    }

    #[must_use]
    pub fn category_value_str(&self, category: &str, key: &str) -> Option<&str> {
        let category = TokenCategory::from_path_segment(category);
        self.by_category_key
            .get(&category)?
            .get(key)
            .map(|&i| category_value(&self.tokens[i]))
    }

    #[must_use]
    pub fn is_deprecated(&self, path: &str) -> bool {
        self.token(path).is_some_and(|t| t.deprecated)
    }

    #[must_use]
    pub fn deprecated_paths(&self) -> &[Arc<str>] {
        &self.deprecated_paths_cache
    }

    #[must_use]
    pub fn color_palettes(&self) -> &ColorPaletteView {
        &self.color_palettes
    }

    /// Project the dictionary into the codegen [`TokenTypeData`]: per-category
    /// value keys/types, color palettes, the flat `path -> value` runtime map,
    /// and deprecated paths.
    #[must_use]
    pub fn type_data(&self) -> TokenTypeData {
        let mut categories = BTreeMap::new();

        for (category, values) in &self.category_values_cache {
            let category_name = category.as_str();
            let name = category_name.to_owned();

            // Token unions are category-relative: `red.500`, not
            // `colors.red.500`, matching legacy generated token types.
            let mut values = values
                .keys()
                .map(|key| {
                    let key = key.as_ref();
                    key.strip_prefix(category_name)
                        .and_then(|rest| rest.strip_prefix('.'))
                        .map_or_else(|| key.to_owned(), ToOwned::to_owned)
                })
                .collect::<Vec<_>>();
            values.sort();
            values.shrink_to_fit();

            categories.insert(
                name.clone(),
                TokenCategoryTypeData {
                    type_name: token_category_type_name(&name),
                    name,
                    values,
                },
            );
        }

        let mut color_palettes = self
            .color_palettes
            .palettes()
            .keys()
            .map(ToString::to_string)
            .collect::<Vec<_>>();
        color_palettes.sort();

        let (raw_values, vars) = self.flat_maps();
        let values = raw_values
            .into_iter()
            .map(|(path, value)| {
                // Empty when the value is just the token's var-ref; the runtime
                // `token.var` derives it via `toVar(path)` instead of storing it.
                if vars.get(&path).is_some_and(|var| *var == value) {
                    (path, String::new())
                } else {
                    (path, value)
                }
            })
            .collect();

        TokenTypeData {
            categories,
            color_palettes,
            values,
            deprecated: self
                .deprecated_paths()
                .iter()
                .map(|path| {
                    let reason = self
                        .token(path)
                        .and_then(|token| token.deprecated_reason.clone());
                    let deprecation = reason.map_or(Deprecated::Bool(true), |reason| {
                        Deprecated::Message(reason.to_string())
                    });
                    (path.to_string(), deprecation)
                })
                .collect(),
        }
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct TokenCssVars<'a> {
    pub base: Vec<TokenCssVar<'a>>,
    pub conditions: Vec<TokenCssConditionVars<'a>>,
}

impl TokenCssVars<'_> {
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.base.is_empty() && self.conditions.iter().all(|group| group.vars.is_empty())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TokenCssVar<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TokenCssConditionVars<'a> {
    pub condition: &'a str,
    pub vars: Vec<TokenCssVar<'a>>,
}

fn is_theme_condition(condition: &str) -> bool {
    // Theme variant tokens are collected under `_theme{CapitalizedName}` in
    // `from_config::create_token_dictionary`. Native token CSS emits them only
    // when `staticCss.themes` is configured (see `static_theme_condition_filter`).
    let first_segment = condition.split(':').next().unwrap_or(condition);
    first_segment
        .strip_prefix("_theme")
        .and_then(|suffix| suffix.chars().next())
        .is_some_and(char::is_uppercase)
}

#[derive(Debug, Clone, Default)]
pub struct TokenDictionaryBuilder {
    tokens: Vec<Token>,
    color_palettes: Option<ColorPaletteView>,
}

impl TokenDictionaryBuilder {
    #[must_use]
    pub fn insert(mut self, token: Token) -> Self {
        self.tokens.push(token);
        self
    }

    /// Imperative variant of [`Self::insert`] for `&mut` callers where a
    /// consuming chain is awkward.
    pub fn push(&mut self, token: Token) -> &mut Self {
        self.tokens.push(token);
        self
    }

    pub(crate) fn tokens_mut(&mut self) -> &mut [Token] {
        &mut self.tokens
    }

    pub(crate) fn retain_tokens(&mut self, mut f: impl FnMut(&Token) -> bool) {
        self.tokens.retain(|token| f(token));
    }

    pub(crate) fn add_color_palette_mapping(
        &mut self,
        palette: impl AsRef<str>,
        virtual_var: impl AsRef<str>,
        token_var: Arc<str>,
    ) {
        self.color_palettes
            .get_or_insert_with(ColorPaletteView::default)
            .insert(palette, virtual_var, token_var);
    }

    #[must_use]
    pub fn extend<I: IntoIterator<Item = Token>>(mut self, tokens: I) -> Self {
        self.tokens.extend(tokens);
        self
    }

    /// Bulk-insert from flat `path → value` and `path → var` maps (a JSON
    /// dump from the JS dictionary view). Category is inferred from the
    /// path's first segment; condition is `None`.
    #[must_use]
    pub fn extend_flat<I, P, V>(mut self, values: I, vars: &HashMap<String, String>) -> Self
    where
        I: IntoIterator<Item = (P, V)>,
        P: Into<String>,
        V: Into<String>,
    {
        for (path, value) in values {
            let path = path.into();
            let var = vars.get(&path).cloned().unwrap_or_default();
            let category = path.split_once('.').map_or_else(
                || TokenCategory::Other(path.clone()),
                |(c, _)| TokenCategory::from_path_segment(c),
            );
            self.tokens
                .push(Token::new(path, value.into(), var, category));
        }
        self
    }

    #[must_use]
    pub fn build(self) -> TokenDictionary {
        let n = self.tokens.len();
        let mut by_path: FxHashMap<Arc<str>, usize> =
            FxHashMap::with_capacity_and_hasher(n, rustc_hash::FxBuildHasher);
        let mut by_var: FxHashMap<Arc<str>, usize> =
            FxHashMap::with_capacity_and_hasher(n, rustc_hash::FxBuildHasher);
        let mut by_category: FxHashMap<TokenCategory, Vec<usize>> = FxHashMap::default();
        let mut by_category_key: FxHashMap<TokenCategory, FxHashMap<Arc<str>, usize>> =
            FxHashMap::default();
        let mut category_values_cache: FxHashMap<TokenCategory, FxHashMap<Arc<str>, Arc<str>>> =
            FxHashMap::default();
        let mut by_condition: FxHashMap<Arc<str>, Vec<usize>> = FxHashMap::default();
        let mut by_path_condition: FxHashMap<Arc<str>, FxHashMap<Arc<str>, usize>> =
            FxHashMap::default();
        let mut conditions_order: Vec<Arc<str>> = Vec::new();
        let mut deprecated_paths_cache: Vec<Arc<str>> = Vec::new();
        let color_palettes = self
            .color_palettes
            .unwrap_or_else(|| build_color_palette_view(&self.tokens));

        // Single pass: unconditional tokens overwrite `by_path` / `by_var`;
        // conditional tokens only fill those entries when no unconditional
        // sibling did — matches Panda's "use whatever is defined" fallback.
        for (i, token) in self.tokens.iter().enumerate() {
            by_category
                .entry(token.category.clone())
                .or_default()
                .push(i);

            if let Some(condition) = token.condition.as_deref() {
                if !by_condition.contains_key(condition) {
                    conditions_order.push(Arc::from(condition));
                }
                by_condition
                    .entry(Arc::from(condition))
                    .or_default()
                    .push(i);
                // Capacity hint of 2 — real themes rarely exceed 3
                // condition variants per path.
                by_path_condition
                    .entry(Arc::clone(&token.path))
                    .or_insert_with(|| {
                        FxHashMap::with_capacity_and_hasher(2, rustc_hash::FxBuildHasher)
                    })
                    .insert(Arc::from(condition), i);
                by_path.entry(Arc::clone(&token.path)).or_insert(i);
                if !token.var.is_empty() {
                    by_var.entry(Arc::clone(&token.var)).or_insert(i);
                }
            } else {
                if let Some(key) = token.path.split_once('.').map(|(_, key)| key) {
                    by_category_key
                        .entry(token.category.clone())
                        .or_default()
                        .insert(Arc::from(key), i);
                    category_values_cache
                        .entry(token.category.clone())
                        .or_default()
                        .insert(Arc::from(key), Arc::from(category_value(token)));
                }
                by_path.insert(Arc::clone(&token.path), i);
                if !token.var.is_empty() {
                    by_var.insert(Arc::clone(&token.var), i);
                }
            }

            if token.deprecated {
                deprecated_paths_cache.push(Arc::clone(&token.path));
            }
        }

        TokenDictionary {
            tokens: self.tokens,
            by_path,
            by_var,
            by_category,
            by_category_key,
            category_values_cache,
            by_condition,
            by_path_condition,
            conditions_order,
            deprecated_paths_cache,
            color_palettes,
        }
    }
}

fn category_value(token: &Token) -> &str {
    if token.extension("isNegative") == Some("true") {
        token.value.as_ref()
    } else {
        token.var.as_ref()
    }
}

/// Build the `colorPalette` index: for each concrete color token, map every
/// ancestor palette root (e.g. `button`, `button.primary`) to the virtual
/// `colors.colorPalette.*` var it should resolve through. Two passes — collect
/// the virtual vars first, then wire each concrete token to them.
fn build_color_palette_view(tokens: &[Token]) -> ColorPaletteView {
    // Pass 1: index the virtual `colorPalette` placeholder vars by path.
    let mut virtual_vars: FxHashMap<&str, &str> = FxHashMap::default();
    for token in tokens {
        if token.category == TokenCategory::Colors && token.extension("isVirtual") == Some("true") {
            virtual_vars.insert(token.path.as_ref(), token.var.as_ref());
        }
    }

    if virtual_vars.is_empty() {
        return ColorPaletteView::default();
    }

    // Pass 2: for each concrete color token, register it under every ancestor
    // palette root that has a matching virtual var.
    let mut palettes: FxHashMap<Arc<str>, FxHashMap<Arc<str>, Arc<str>>> = FxHashMap::default();
    for token in tokens {
        if token.category != TokenCategory::Colors
            || token.extension("isVirtual") == Some("true")
            || token.extension("colorPalette").is_none()
            || token.var.is_empty()
        {
            continue;
        }

        let segments: Vec<&str> = token.path.split('.').collect();
        let Some(color_path) = color_palette_path_segments(&segments) else {
            continue;
        };

        for root_len in 1..=color_path.len() {
            let root = &color_path[..root_len];
            let palette_name = join_segments(root);
            let virtual_path = virtual_color_palette_path(&segments, root_len);
            let Some(virtual_var) = virtual_vars.get(virtual_path.as_str()) else {
                continue;
            };
            let Some(raw_virtual_var) = raw_css_var(virtual_var) else {
                continue;
            };

            palettes
                .entry(Arc::from(palette_name))
                .or_default()
                .insert(Arc::from(raw_virtual_var), Arc::clone(&token.var));
        }
    }

    ColorPaletteView { palettes }
}

/// The palette-name segments of a color token path: `colors` prefix and the
/// final value segment dropped (`["colors","button","primary","500"]` ->
/// `["button","primary"]`). `None` for non-color or virtual `colorPalette` paths.
pub(crate) fn color_palette_path_segments<'a>(segments: &'a [&'a str]) -> Option<&'a [&'a str]> {
    if segments.first().copied() != Some("colors")
        || segments.get(1).copied() == Some("colorPalette")
        || segments.len() < 2
    {
        return None;
    }
    if segments.len() > 2 {
        Some(&segments[1..segments.len() - 1])
    } else {
        Some(&segments[1..])
    }
    .filter(|segments| !segments.is_empty())
}

/// The virtual lookup key for a palette root: the segments after the root
/// become `colors.colorPalette.<rest>` (or bare `colors.colorPalette` when the
/// root is the whole path).
pub(crate) fn virtual_color_palette_path(segments: &[&str], root_len: usize) -> String {
    let suffix = &segments[(1 + root_len)..];
    if suffix.is_empty() {
        return "colors.colorPalette".to_owned();
    }
    let suffix_len = suffix.iter().map(|segment| segment.len()).sum::<usize>() + suffix.len();
    let mut out = String::with_capacity("colors.colorPalette".len() + suffix_len);
    out.push_str("colors.colorPalette");
    for segment in suffix {
        out.push('.');
        out.push_str(segment);
    }
    out
}

pub(crate) fn join_segments(segments: &[&str]) -> String {
    let total_len = segments.iter().map(|segment| segment.len()).sum::<usize>()
        + segments.len().saturating_sub(1);
    let mut out = String::with_capacity(total_len);
    for (index, segment) in segments.iter().enumerate() {
        if index > 0 {
            out.push('.');
        }
        out.push_str(segment);
    }
    out
}

fn raw_css_var(value: &str) -> Option<&str> {
    value.strip_prefix("var(")?.strip_suffix(')')
}
