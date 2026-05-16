//! Design-token dictionary — read-only lookup view over a resolved
//! Panda theme. Used by the Rust extractor (`token('path')` resolution)
//! and the future Rust emitter.
//!
//! The build-time pipeline (semantic-token expansion, reference resolution,
//! transformers, color-palette materialization, middleware) stays on the
//! JS side; resolved values flow in through [`TokenDictionaryBuilder`].
//! Every read path is O(1) or O(matches), never O(n), backed by
//! `rustc_hash::FxHashMap` indexes built once at construction time.

use std::collections::HashMap;

use rustc_hash::FxHashMap;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

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
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct Token {
    pub path: String,
    pub value: String,
    pub var: String,
    pub category: TokenCategory,
    pub condition: Option<String>,
    /// Pre-alias-substitution value. Optional because the JS path strips
    /// it once references are expanded.
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub original_value: Option<String>,
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub description: Option<String>,
    #[cfg_attr(feature = "serde", serde(default))]
    pub deprecated: bool,
    #[cfg_attr(
        feature = "serde",
        serde(default, skip_serializing_if = "Option::is_none")
    )]
    pub extensions: Option<Box<TokenExtensions>>,
}

impl Token {
    #[must_use]
    pub fn new(
        path: impl Into<String>,
        value: impl Into<String>,
        var: impl Into<String>,
        category: TokenCategory,
    ) -> Self {
        Self {
            path: path.into(),
            value: value.into(),
            var: var.into(),
            category,
            condition: None,
            original_value: None,
            description: None,
            deprecated: false,
            extensions: None,
        }
    }

    #[must_use]
    pub fn with_condition(mut self, condition: impl Into<String>) -> Self {
        self.condition = Some(condition.into());
        self
    }

    #[must_use]
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    #[must_use]
    pub fn deprecated(mut self) -> Self {
        self.deprecated = true;
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

/// Snapshot of a token dictionary. Immutable once built.
///
/// Serde emits only `tokens`; indexes are derived state, rebuilt via the
/// builder on `Deserialize`. The custom `Deserialize` below prevents the
/// "deserialized dictionary has empty indexes" hazard a naked derive
/// would introduce.
#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub struct TokenDictionary {
    tokens: Vec<Token>,
    /// `path` → base token index. Base wins over conditional for the same
    /// path so `get()` returns the canonical value — matches JS view
    /// semantics where `rawValues` is keyed by name without condition.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_path: FxHashMap<String, usize>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_var: FxHashMap<String, usize>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_category: FxHashMap<TokenCategory, Vec<usize>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    by_condition: FxHashMap<String, Vec<usize>>,
    /// Nested so lookups never allocate (two O(1) hashes); a flat
    /// `(String, String)` key would force a `to_owned` per call.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_path_condition: FxHashMap<String, FxHashMap<String, usize>>,
    /// First-seen condition names. Built once so `conditions()` is a
    /// zero-work slice borrow.
    #[cfg_attr(feature = "serde", serde(skip))]
    conditions_order: Vec<String>,
    #[cfg_attr(feature = "serde", serde(skip))]
    deprecated_paths_cache: Vec<String>,
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
    pub fn conditions(&self) -> &[String] {
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

    /// Zero-allocation `token('path', fallback)` lookup.
    #[must_use]
    pub fn get_str<'a>(&'a self, path: &str, fallback: Option<&'a str>) -> Option<&'a str> {
        if let Some(token) = self.token(path) {
            return Some(token.value.as_str());
        }
        fallback
    }

    /// Zero-allocation `token.var('path', fallback)` lookup.
    #[must_use]
    pub fn get_var_str<'a>(&'a self, path: &str, fallback: Option<&'a str>) -> Option<&'a str> {
        if let Some(token) = self.token(path) {
            return Some(token.var.as_str());
        }
        fallback
    }

    /// Snapshot of `{ path → value }` for one category. Only base tokens
    /// are included; conditional variants live under their own indices.
    #[must_use]
    pub fn category_values(&self, category: &TokenCategory) -> FxHashMap<String, String> {
        self.iter_category(category)
            .filter(|t| t.condition.is_none())
            .map(|t| (t.path.clone(), t.value.clone()))
            .collect()
    }

    #[must_use]
    pub fn is_deprecated(&self, path: &str) -> bool {
        self.token(path).is_some_and(|t| t.deprecated)
    }

    #[must_use]
    pub fn deprecated_paths(&self) -> &[String] {
        &self.deprecated_paths_cache
    }
}

#[derive(Debug, Clone, Default)]
pub struct TokenDictionaryBuilder {
    tokens: Vec<Token>,
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
            self.tokens.push(Token {
                path,
                value: value.into(),
                var,
                category,
                condition: None,
                original_value: None,
                description: None,
                deprecated: false,
                extensions: None,
            });
        }
        self
    }

    #[must_use]
    pub fn build(self) -> TokenDictionary {
        let n = self.tokens.len();
        let mut by_path: FxHashMap<String, usize> =
            FxHashMap::with_capacity_and_hasher(n, rustc_hash::FxBuildHasher);
        let mut by_var: FxHashMap<String, usize> =
            FxHashMap::with_capacity_and_hasher(n, rustc_hash::FxBuildHasher);
        let mut by_category: FxHashMap<TokenCategory, Vec<usize>> = FxHashMap::default();
        let mut by_condition: FxHashMap<String, Vec<usize>> = FxHashMap::default();
        let mut by_path_condition: FxHashMap<String, FxHashMap<String, usize>> =
            FxHashMap::default();
        let mut conditions_order: Vec<String> = Vec::new();
        let mut deprecated_paths_cache: Vec<String> = Vec::new();

        // Pass 1: condition-agnostic indexes plus base-only path/var
        // entries. Conditional-only paths are filled in by pass 2 so a
        // dictionary with no base entry still exposes its values through
        // `by_path` — matches Panda's "use whatever is defined" fallback.
        for (i, token) in self.tokens.iter().enumerate() {
            by_category
                .entry(token.category.clone())
                .or_default()
                .push(i);

            if let Some(condition) = token.condition.as_deref() {
                if !by_condition.contains_key(condition) {
                    conditions_order.push(condition.to_owned());
                }
                by_condition
                    .entry(condition.to_owned())
                    .or_default()
                    .push(i);

                // Capacity hint of 2 — real themes rarely exceed 3
                // condition variants per path.
                by_path_condition
                    .entry(token.path.clone())
                    .or_insert_with(|| {
                        FxHashMap::with_capacity_and_hasher(2, rustc_hash::FxBuildHasher)
                    })
                    .insert(condition.to_owned(), i);
            } else {
                by_path.insert(token.path.clone(), i);
                if !token.var.is_empty() {
                    by_var.insert(token.var.clone(), i);
                }
            }

            if token.deprecated {
                deprecated_paths_cache.push(token.path.clone());
            }
        }

        // Pass 2: surface conditional-only tokens through `by_path` / `by_var`.
        for (i, token) in self.tokens.iter().enumerate() {
            if token.condition.is_some() {
                by_path.entry(token.path.clone()).or_insert(i);
                if !token.var.is_empty() {
                    by_var.entry(token.var.clone()).or_insert(i);
                }
            }
        }

        TokenDictionary {
            tokens: self.tokens,
            by_path,
            by_var,
            by_category,
            by_condition,
            by_path_condition,
            conditions_order,
            deprecated_paths_cache,
        }
    }
}
