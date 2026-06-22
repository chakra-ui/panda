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
use std::collections::{BTreeMap, hash_map::Entry};
use std::sync::Arc;

use pandacss_shared::number_to_js_string;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

mod builder;
mod category;
mod color_palette;
mod from_config;
mod token;
mod transform;
mod type_data;

mod svg;

pub use builder::TokenDictionaryBuilder;
pub use category::TokenCategory;
pub use color_palette::ColorPaletteView;
pub use from_config::TokenDictionaryOptions;
pub use pandacss_shared::PandaError as TokenError;
pub use token::{Token, TokenExtensions};

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
    /// `category → normalized final literal → ranked tokens carrying that value`.
    /// Powers value→token suggestions (the rule lists them; the developer picks).
    #[cfg_attr(feature = "serde", serde(skip))]
    suggestion_index: FxHashMap<TokenCategory, FxHashMap<String, Vec<TokenSuggestion>>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    color_palettes: ColorPaletteView,
}

/// A token that carries a given value — a candidate the developer can pick.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct TokenSuggestion {
    /// Category-relative path (`red.500`, `fg.error`).
    pub token: String,
    /// `true` when the token references another token (the semantic layer).
    pub semantic: bool,
    /// `true` when the token has condition variants (themes) — not a static equal.
    pub conditional: bool,
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
        // Rebuild through the public builder so indexes (and color palettes,
        // when absent) are derived — no need to reach the builder's fields.
        Ok(TokenDictionaryBuilder::default()
            .extend(wire.tokens)
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

    /// Tokens that carry a hardcoded `value` in `category`, ranked (safe
    /// equivalents first). Empty when nothing matches.
    #[must_use]
    pub fn suggest_tokens(&self, category: &TokenCategory, value: &str) -> Vec<TokenSuggestion> {
        let key = normalize_value(category, value);
        self.suggestion_index
            .get(category)
            .and_then(|bucket| bucket.get(&key))
            .cloned()
            .unwrap_or_default()
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

/// Canonicalize a value for matching: colors via hex normalization, dimensions
/// via `to_rem` (`16px` ↔ `1rem`); everything else trimmed.
pub(crate) fn normalize_value(category: &TokenCategory, value: &str) -> String {
    if matches!(category, TokenCategory::Colors) {
        return normalize_color(value);
    }
    pandacss_shared::to_rem(value.trim()).trim().to_string()
}

fn normalize_color(value: &str) -> String {
    let lower = value.trim().to_ascii_lowercase();
    if let Some(hex) = lower.strip_prefix('#')
        && (hex.len() == 3 || hex.len() == 4)
        && hex.bytes().all(|b| b.is_ascii_hexdigit())
    {
        let mut out = String::with_capacity(1 + hex.len() * 2);
        out.push('#');
        for ch in hex.chars() {
            out.push(ch);
            out.push(ch);
        }
        return out;
    }
    lower
}

pub(crate) fn category_value(token: &Token) -> &str {
    if token.extension("isNegative") == Some("true") {
        token.value.as_ref()
    } else {
        token.var.as_ref()
    }
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

pub(crate) fn raw_css_var(value: &str) -> Option<&str> {
    value.strip_prefix("var(")?.strip_suffix(')')
}
