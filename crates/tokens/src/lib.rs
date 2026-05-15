//! Design-token dictionary — read-only lookup view over a resolved
//! Panda theme. Used by the Rust extractor (`token('path')` resolution)
//! and the future Rust emitter.
//!
//! The expensive build-time pipeline (semantic-token expansion,
//! `{colors.gray.100}` reference resolution, transformers, color-palette
//! materialization, middleware) still lives on the JS side. Resolved
//! values flow in through [`TokenDictionaryBuilder`].
//!
//! ## Quick API
//!
//! - `dict.get(path, fallback)` / `dict.get_str(path, fallback)` — raw
//!   value lookup (owned / borrowed).
//! - `dict.get_var(path, fallback)` / `dict.get_var_str(path, fallback)` —
//!   CSS-variable form.
//! - `dict.token(path)` — full record; `token_with_condition(path, cond)`
//!   for conditional variants.
//! - `dict.iter_category(&cat)` / `iter_condition(name)` — filtered
//!   iteration backed by pre-built indexes.
//! - `dict.token_by_var("var(--colors-red-500)")` — reverse lookup.
//! - `dict.is_deprecated(path)` / `dict.deprecated_paths()` — usage
//!   warnings.
//!
//! ## Performance shape
//!
//! Every read path is O(1) or O(matches), never O(n). Indexes are
//! `rustc_hash::FxHashMap` (non-cryptographic; internal data, `DoS` not
//! in scope). `Token::extensions` is `Option<Box<…>>` so the empty-metadata
//! case costs one nullable pointer instead of an inline 48-byte map —
//! ~40 bytes saved per token, no extra heap allocation. See
//! `docs/tokens-crate-design.md` for the full layout discussion.

use std::collections::HashMap;

use rustc_hash::FxHashMap;

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

/// Token category — the top-level bucket a path belongs to. Names match
/// `packages/types/src/tokens.ts` so JS-resolved dictionaries serialize
/// cleanly into Rust without an extra translation step.
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
    /// Anything not covered above. Preserves the original spelling so
    /// downstream code can still match by string when it cares.
    Other(String),
}

impl TokenCategory {
    /// Parse a category as it appears in a token path (first segment).
    /// Unknown names fall through to [`Self::Other`] — we don't try to be
    /// clever about pluralization or camelCase variants.
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

    /// String form suitable for joining back into a path or category map
    /// key. Round-trips with [`Self::from_path_segment`] except for
    /// [`Self::Other`], which echoes whatever was originally parsed.
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

/// Free-form metadata that JS callers attach to tokens. `FxHashMap` for
/// faster lookups; the keys are short well-known strings (`theme`,
/// `isSemantic`, `prop`, …) where `FxHash` decisively beats `SipHash`.
pub type TokenExtensions = FxHashMap<String, String>;

/// One resolved token. `value` and `var` are pre-computed by whatever
/// pipeline produced the dictionary; this crate only stores and indexes
/// them. `condition: None` is the "base" / unconditional variant.
///
/// `extensions` is `Option<Box<…>>` so the common case (no extensions)
/// occupies one pointer-sized niche-optimized slot rather than an inline
/// 48-byte `HashMap`. This shaves ~40 bytes per token and removes a heap
/// allocation when building dictionaries with thousands of plain tokens.
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(rename_all = "camelCase"))]
pub struct Token {
    pub path: String,
    pub value: String,
    pub var: String,
    pub category: TokenCategory,
    pub condition: Option<String>,
    /// Pre-resolved-reference value, before alias substitution. Optional
    /// because the JS path strips it once references are expanded.
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub original_value: Option<String>,
    #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
    pub description: Option<String>,
    #[cfg_attr(feature = "serde", serde(default))]
    pub deprecated: bool,
    /// Free-form metadata bag — mirrors `Token.extensions` on the JS side.
    /// `None` is the empty / unset case (the vast majority of tokens).
    #[cfg_attr(
        feature = "serde",
        serde(default, skip_serializing_if = "Option::is_none")
    )]
    pub extensions: Option<Box<TokenExtensions>>,
}

impl Token {
    /// Convenience constructor for the common case: path + value + var +
    /// category, no metadata. Use the public struct literal directly when
    /// you need to set description / deprecated / extensions.
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

    /// Look up an extension key. Returns `None` when the key isn't set —
    /// matches the JS `token.extensions?.key` ergonomics.
    #[must_use]
    pub fn extension(&self, key: &str) -> Option<&str> {
        self.extensions
            .as_deref()
            .and_then(|m| m.get(key))
            .map(String::as_str)
    }

    /// Set an extension entry. Lazily allocates the underlying map on
    /// first write so tokens with no extensions never pay the allocation
    /// cost.
    pub fn set_extension(&mut self, key: impl Into<String>, value: impl Into<String>) {
        self.extensions
            .get_or_insert_with(|| Box::new(FxHashMap::default()))
            .insert(key.into(), value.into());
    }

    /// Read-only view over all extension entries, or an empty iterator
    /// when none are set. Allocation-free.
    pub fn extension_entries(&self) -> impl Iterator<Item = (&str, &str)> + '_ {
        self.extensions
            .as_deref()
            .into_iter()
            .flat_map(|m| m.iter().map(|(k, v)| (k.as_str(), v.as_str())))
    }
}

/// Snapshot of a token dictionary. Construct via
/// [`TokenDictionary::builder`]. All read methods are O(1) or O(category
/// size); the dictionary is immutable once built.
///
/// ## Serde behaviour
///
/// `Serialize` emits only `tokens` — the path/var/category indexes are
/// derived state and aren't part of the wire format. `Deserialize`
/// rebuilds them via the builder, so a deserialized dictionary is
/// indistinguishable from one constructed in-process. This prevents the
/// "deserialized dictionary has empty indexes" hazard.
#[derive(Debug, Clone, Default)]
#[cfg_attr(feature = "serde", derive(Serialize))]
pub struct TokenDictionary {
    tokens: Vec<Token>,
    /// `path` → base token index. Base (unconditional) tokens win over
    /// conditional ones with the same path so `get()` returns the
    /// canonical value — matches JS view semantics where `rawValues` is
    /// keyed by name without condition.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_path: FxHashMap<String, usize>,
    /// `var` → index. Used by emitters to resolve `var(--colors-red-500)`
    /// back to its declared token path.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_var: FxHashMap<String, usize>,
    /// `category` → indices of every token in that category. O(category)
    /// iteration instead of O(n) — matters when emitting CSS variables
    /// category-by-category.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_category: FxHashMap<TokenCategory, Vec<usize>>,
    /// `condition` → indices of every token tagged with that condition.
    /// Empty when the dictionary has only base tokens. Same O(matches)
    /// guarantee as `by_category`.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_condition: FxHashMap<String, Vec<usize>>,
    /// `path` → `condition` → token index. Nested so lookups never
    /// allocate (two O(1) hashes); flat `(String, String)` keys would
    /// force a `to_owned` per call.
    #[cfg_attr(feature = "serde", serde(skip))]
    by_path_condition: FxHashMap<String, FxHashMap<String, usize>>,
    /// Distinct condition names in first-seen order. Built once so
    /// `conditions()` is a `&[String]` slice borrow with zero work.
    #[cfg_attr(feature = "serde", serde(skip))]
    conditions_order: Vec<String>,
    /// Pre-filtered list of deprecated token paths. Cheap to clone /
    /// borrow without re-scanning the whole token set.
    #[cfg_attr(feature = "serde", serde(skip))]
    deprecated_paths_cache: Vec<String>,
}

#[cfg(feature = "serde")]
impl<'de> Deserialize<'de> for TokenDictionary {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        // Wire format: `{ tokens: [...] }`. Indexes are derived state, so
        // we round-trip through the builder to keep them in sync. A naked
        // derive(Deserialize) here would leave by_path/by_var/by_category
        // empty and silently break every lookup.
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
    /// Empty dictionary. Equivalent to "no token resolution available";
    /// callers can treat `dict.is_empty()` as "feature disabled."
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn builder() -> TokenDictionaryBuilder {
        TokenDictionaryBuilder::default()
    }

    /// Number of tokens, including conditional variants.
    #[must_use]
    pub fn len(&self) -> usize {
        self.tokens.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.tokens.is_empty()
    }

    /// All tokens, in insertion order. Useful for emitters that want a
    /// stable iteration over the full set.
    pub fn iter(&self) -> impl Iterator<Item = &Token> + '_ {
        self.tokens.iter()
    }

    /// Tokens in a category. O(category size) — backed by an index built
    /// at construction time, no linear scan over the full dictionary.
    pub fn iter_category<'a>(
        &'a self,
        category: &'a TokenCategory,
    ) -> impl Iterator<Item = &'a Token> + 'a {
        self.by_category
            .get(category)
            .into_iter()
            .flat_map(move |ids| ids.iter().map(move |&i| &self.tokens[i]))
    }

    /// Tokens defined under a given condition. O(matches) via
    /// `by_condition` — no scan over the full dictionary.
    pub fn iter_condition<'a>(
        &'a self,
        condition_name: &'a str,
    ) -> impl Iterator<Item = &'a Token> + 'a {
        self.by_condition
            .get(condition_name)
            .into_iter()
            .flat_map(move |ids| ids.iter().map(move |&i| &self.tokens[i]))
    }

    /// Distinct condition names present in the dictionary, in first-seen
    /// order. `None` (base) is excluded. Returns a slice borrow, zero
    /// work per call.
    #[must_use]
    pub fn conditions(&self) -> &[String] {
        &self.conditions_order
    }

    /// Full base record for a path. `None` for unknown paths.
    #[must_use]
    pub fn token(&self, path: &str) -> Option<&Token> {
        self.by_path.get(path).map(|&i| &self.tokens[i])
    }

    /// Conditional record for a path, when one exists. Falls back to
    /// `None` if the dictionary only has a base entry — callers can
    /// combine `token()` and `token_with_condition()` to model JS's
    /// "use condition value if present, else base." O(1) lookup via the
    /// nested `by_path_condition` index, zero allocations.
    #[must_use]
    pub fn token_with_condition(&self, path: &str, condition: &str) -> Option<&Token> {
        self.by_path_condition
            .get(path)?
            .get(condition)
            .map(|&i| &self.tokens[i])
    }

    /// Reverse lookup: find the token whose `var` matches the CSS
    /// variable string. Useful when emitters need to map back from a
    /// referenced `var(--…)` to the token that declared it.
    #[must_use]
    pub fn token_by_var(&self, var: &str) -> Option<&Token> {
        self.by_var.get(var).map(|&i| &self.tokens[i])
    }

    /// `token('path', fallback)` — raw value lookup. Returns the base
    /// token value, or the fallback when the path is unknown.
    ///
    /// Allocates on every hit. Prefer [`Self::get_str`] when the caller
    /// can borrow the result.
    #[must_use]
    pub fn get(&self, path: &str, fallback: Option<&str>) -> Option<String> {
        self.get_str(path, fallback).map(str::to_owned)
    }

    /// `token.var('path', fallback)` — CSS-var lookup. Returns the base
    /// token's `var` form, or the fallback when the path is unknown.
    ///
    /// Allocates on every hit. Prefer [`Self::get_var_str`] when the
    /// caller can borrow the result.
    #[must_use]
    pub fn get_var(&self, path: &str, fallback: Option<&str>) -> Option<String> {
        self.get_var_str(path, fallback).map(str::to_owned)
    }

    /// Borrow-returning fast path for raw value lookup. Zero allocations
    /// in the hit case; the returned slice lives as long as `self`. The
    /// fallback path also returns a borrow.
    #[must_use]
    pub fn get_str<'a>(&'a self, path: &str, fallback: Option<&'a str>) -> Option<&'a str> {
        if let Some(token) = self.token(path) {
            return Some(token.value.as_str());
        }
        fallback
    }

    /// Borrow-returning fast path for CSS-var lookup. Zero allocations
    /// in the hit case.
    #[must_use]
    pub fn get_var_str<'a>(&'a self, path: &str, fallback: Option<&'a str>) -> Option<&'a str> {
        if let Some(token) = self.token(path) {
            return Some(token.var.as_str());
        }
        fallback
    }

    /// Snapshot of `{ path → value }` for one category — matches the JS
    /// view's `getCategoryValues(category)` shape. Only base tokens are
    /// included; conditional variants live under their own indices.
    #[must_use]
    pub fn category_values(&self, category: &TokenCategory) -> HashMap<String, String> {
        self.iter_category(category)
            .filter(|t| t.condition.is_none())
            .map(|t| (t.path.clone(), t.value.clone()))
            .collect()
    }

    /// `true` iff the token at `path` is marked deprecated.
    #[must_use]
    pub fn is_deprecated(&self, path: &str) -> bool {
        self.token(path).is_some_and(|t| t.deprecated)
    }

    /// All deprecated token paths, in insertion order. Backed by a
    /// pre-built `Vec<String>` populated in `build()`; returns slice
    /// borrows, zero work per call.
    #[must_use]
    pub fn deprecated_paths(&self) -> &[String] {
        &self.deprecated_paths_cache
    }
}

/// Constructor for [`TokenDictionary`]. Build incrementally with
/// [`Self::insert`] / [`Self::extend_flat`], then call [`Self::build`].
#[derive(Debug, Clone, Default)]
pub struct TokenDictionaryBuilder {
    tokens: Vec<Token>,
}

impl TokenDictionaryBuilder {
    /// Append a token, consuming and returning the builder. Use for
    /// fluent chains: `builder.insert(a).insert(b).build()`.
    #[must_use]
    pub fn insert(mut self, token: Token) -> Self {
        self.tokens.push(token);
        self
    }

    /// Imperative variant of [`Self::insert`] — appends a token without
    /// taking ownership of the builder. Use when constructing in a loop
    /// or behind a `&mut` handle where the consuming chain is awkward.
    pub fn push(&mut self, token: Token) -> &mut Self {
        self.tokens.push(token);
        self
    }

    /// Append multiple tokens.
    #[must_use]
    pub fn extend<I: IntoIterator<Item = Token>>(mut self, tokens: I) -> Self {
        self.tokens.extend(tokens);
        self
    }

    /// Convenience for callers that already have flat `path → value` and
    /// `path → var` maps (e.g. a JSON dump from the JS dictionary view).
    /// Category is inferred from the path's first segment; condition is
    /// `None`.
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

        // First pass: build every condition-agnostic index, plus the
        // base-only entries for by_path / by_var. Conditional-only paths
        // are filled in by the second pass below.
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

                // (path, condition) → index. Inner map gets a small
                // capacity hint since most paths have ≤3 condition
                // variants in real themes.
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

        // Second pass: surface conditional-only tokens through the path
        // and var indexes so callers that never set up condition routing
        // can still find the value. Matches Panda's "use whatever is
        // defined" fallback for paths that have no base entry.
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
