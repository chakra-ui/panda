//! Builder that assembles a [`TokenDictionary`] and its derived indexes.

use std::collections::HashMap;
use std::sync::Arc;

use rustc_hash::FxHashMap;

use crate::category::TokenCategory;
use crate::color_palette::{ColorPaletteView, build_color_palette_view};
use crate::token::Token;
use crate::{TokenDictionary, TokenSuggestion, category_value, normalize_value};

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

        let suggestion_index = build_suggestion_index(&self.tokens, &by_path, &by_path_condition);

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
            suggestion_index,
            color_palettes,
        }
    }
}

/// A pure `{token.path}` reference (semantic/alias value), else `None`.
fn parse_token_ref(original_value: Option<&str>) -> Option<&str> {
    let value = original_value?.trim();
    value
        .strip_prefix('{')
        .and_then(|rest| rest.strip_suffix('}'))
        .filter(|inner| !inner.is_empty() && !inner.contains('{'))
}

/// Follow `{...}` references to the primitive literal, stopping at the first
/// repeated token so a cyclic alias can't loop.
fn resolve_final_literal(
    tokens: &[Token],
    by_path: &FxHashMap<Arc<str>, usize>,
    start: usize,
) -> String {
    let mut index = start;
    let mut seen: Vec<usize> = Vec::new();
    loop {
        let Some(next) = parse_token_ref(tokens[index].original_value.as_deref())
            .and_then(|path| by_path.get(path).copied())
        else {
            break;
        };
        if seen.contains(&index) {
            break;
        }
        seen.push(index);
        index = next;
    }
    tokens[index].value.to_string()
}

/// Build `category → normalized final literal → ranked tokens carrying that
/// value`. Both primitives and semantic tokens (resolved through their `{...}`
/// reference) are listed; the rule shows them and the developer chooses.
fn build_suggestion_index(
    tokens: &[Token],
    by_path: &FxHashMap<Arc<str>, usize>,
    by_path_condition: &FxHashMap<Arc<str>, FxHashMap<Arc<str>, usize>>,
) -> FxHashMap<TokenCategory, FxHashMap<String, Vec<TokenSuggestion>>> {
    let mut index: FxHashMap<TokenCategory, FxHashMap<String, Vec<TokenSuggestion>>> =
        FxHashMap::default();

    let mut base_indexes: Vec<usize> = by_path.values().copied().collect();
    base_indexes.sort_unstable();
    base_indexes.dedup();

    for i in base_indexes {
        let token = &tokens[i];
        let Some(rel) = token
            .path
            .strip_prefix(token.category.as_str())
            .and_then(|rest| rest.strip_prefix('.'))
        else {
            continue;
        };
        let literal = resolve_final_literal(tokens, by_path, i);
        // A `var(...)` or empty literal can't match an author's raw value.
        if literal.is_empty() || literal.starts_with("var(") {
            continue;
        }
        let key = normalize_value(&token.category, &literal);
        if key.is_empty() {
            continue;
        }
        index
            .entry(token.category.clone())
            .or_default()
            .entry(key)
            .or_default()
            .push(TokenSuggestion {
                token: rel.to_owned(),
                semantic: parse_token_ref(token.original_value.as_deref()).is_some(),
                conditional: by_path_condition.contains_key(&token.path),
            });
    }

    // Rank each bucket: safe equivalents (unconditional) first, then semantic,
    // then shorter/lexical path. The lint rule decides how many to show.
    for buckets in index.values_mut() {
        for candidates in buckets.values_mut() {
            candidates.sort_by(|a, b| {
                a.conditional
                    .cmp(&b.conditional)
                    .then(b.semantic.cmp(&a.semantic))
                    .then(a.token.len().cmp(&b.token.len()))
                    .then_with(|| a.token.cmp(&b.token))
            });
        }
    }

    index
}
