//! Host transform callbacks: which config entry maps to which JS callback, the
//! memo cache in front of them, and how their results and failures become
//! Panda values and diagnostics. Bindings only supply the call itself.

use std::collections::HashMap;
use std::hash::BuildHasher;
use std::num::NonZeroUsize;

use lru::LruCache;
use pandacss_config::{CallbackRef, JsxSpecifier, UserConfig, UtilityConfig, UtilityValues};
use pandacss_encoder::AtomValue;
use pandacss_extractor::{Diagnostic, DiagnosticSeverity, diagnostic_codes};
use pandacss_literal::Literal;

use crate::{HookFilter, atom_value_json};

const MAX_TRANSFORM_CACHE_ENTRIES: usize = 4096;
const MAX_TRANSFORM_CACHE_KEY_BYTES: usize = 16 * 1024;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
enum AtomValueCacheKey {
    String(String),
    Token { path: String, value: String },
    Number(String),
    Bool(bool),
    Null,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
enum LiteralCacheKey {
    String(String),
    Token { path: String, value: String },
    Number(u64),
    Bool(bool),
    Null,
    Object(Vec<(String, LiteralCacheKey)>),
    Array(Vec<LiteralCacheKey>),
    Conditional(Vec<LiteralCacheKey>),
}

fn atom_value_cache_key(value: &AtomValue) -> AtomValueCacheKey {
    match value {
        AtomValue::String(value) => AtomValueCacheKey::String(value.to_string()),
        AtomValue::Token { path, value } => AtomValueCacheKey::Token {
            path: path.to_string(),
            value: value.to_string(),
        },
        AtomValue::Number(value) => AtomValueCacheKey::Number(value.to_string()),
        AtomValue::Bool(value) => AtomValueCacheKey::Bool(*value),
        AtomValue::Null => AtomValueCacheKey::Null,
    }
}

fn literal_cache_key(value: &Literal, max_key_bytes: usize) -> Option<LiteralCacheKey> {
    let mut budget = max_key_bytes;
    literal_cache_key_inner(value, &mut budget)
}

fn literal_cache_key_inner(value: &Literal, budget: &mut usize) -> Option<LiteralCacheKey> {
    take_key_budget(budget, 1)?;
    match value {
        Literal::String(value) => {
            take_key_budget(budget, value.len())?;
            Some(LiteralCacheKey::String(value.clone()))
        }
        Literal::Token { path, value } => {
            take_key_budget(budget, path.len() + value.len())?;
            Some(LiteralCacheKey::Token {
                path: path.clone(),
                value: value.clone(),
            })
        }
        Literal::Number(value) => Some(LiteralCacheKey::Number(value.to_bits())),
        Literal::Bool(value) => Some(LiteralCacheKey::Bool(*value)),
        Literal::Null => Some(LiteralCacheKey::Null),
        Literal::Object(entries) => entries
            .iter()
            .map(|(key, value)| {
                take_key_budget(budget, key.len())?;
                Some((key.clone(), literal_cache_key_inner(value, budget)?))
            })
            .collect::<Option<Vec<_>>>()
            .map(LiteralCacheKey::Object),
        Literal::Array(items) => items
            .iter()
            .map(|item| literal_cache_key_inner(item, budget))
            .collect::<Option<Vec<_>>>()
            .map(LiteralCacheKey::Array),
        Literal::Conditional(branches) => branches
            .iter()
            .map(|branch| literal_cache_key_inner(branch, budget))
            .collect::<Option<Vec<_>>>()
            .map(LiteralCacheKey::Conditional),
    }
}

fn take_key_budget(budget: &mut usize, amount: usize) -> Option<()> {
    *budget = budget.checked_sub(amount)?;
    Some(())
}

/// How a host call into a JS callback failed.
#[derive(Debug)]
pub enum CallbackError {
    /// The host couldn't reach the callback (e.g. a released NAPI reference).
    Unavailable(String),
    /// The host couldn't convert the arguments for the call.
    Serialize(String),
    /// The callback threw.
    Threw(String),
    /// The callback returned a value of the wrong shape.
    InvalidResult(String),
}

/// Memoized utility and pattern transform results, keyed by callback id and
/// input. The two halves are separate so a host can hand each to its own
/// closure.
#[derive(Default)]
pub struct TransformCache {
    /// Results of utility `transform` callbacks.
    pub utility: UtilityTransformCache,
    /// Results of pattern `transform` callbacks.
    pub pattern: PatternTransformCache,
}

impl TransformCache {
    /// Drop every cached result, e.g. after the config changes.
    pub fn clear(&mut self) {
        self.utility.0.clear();
        self.pattern.0.clear();
    }

    /// Drop cached utility results, e.g. after a utility callback is re-registered.
    pub fn clear_utility(&mut self) {
        self.utility.0.clear();
    }

    /// Drop cached pattern results, e.g. after a pattern callback is re-registered.
    pub fn clear_pattern(&mut self) {
        self.pattern.0.clear();
    }
}

/// The raw style object each utility transform returned (className/layer are
/// recomputed by the emitter, not cached).
pub struct UtilityTransformCache(LruCache<UtilityTransformCacheKey, Literal>);

impl Default for UtilityTransformCache {
    fn default() -> Self {
        Self(LruCache::new(cache_capacity()))
    }
}

/// Each pattern transform's result; `None` keeps the pattern's own styles.
pub struct PatternTransformCache(LruCache<PatternTransformCacheKey, Option<Literal>>);

impl Default for PatternTransformCache {
    fn default() -> Self {
        Self(LruCache::new(cache_capacity()))
    }
}

fn cache_capacity() -> NonZeroUsize {
    NonZeroUsize::new(MAX_TRANSFORM_CACHE_ENTRIES).expect("transform cache capacity is non-zero")
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct UtilityTransformCacheKey {
    id: String,
    prop: String,
    value: AtomValueCacheKey,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct PatternTransformCacheKey {
    id: String,
    name: String,
    props: LiteralCacheKey,
}

/// Utility prop → callback id for utilities whose `transform` is a JS callback.
#[must_use]
pub fn utility_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    config
        .utilities
        .iter()
        .filter_map(|(prop, utility)| {
            let id = callback_ref_id(utility.transform.as_ref()?)?;
            Some((prop.clone(), id.to_owned()))
        })
        .collect()
}

/// Pattern name → callback id, also keyed by the capitalized name and every
/// JSX name the pattern renders as.
#[must_use]
pub fn pattern_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (name, pattern) in &config.patterns {
        let Some(id) = pattern.transform.as_ref().and_then(callback_ref_id) else {
            continue;
        };
        refs.insert(name.clone(), id.to_owned());
        refs.insert(
            pandacss_shared::capitalize(name).into_owned(),
            id.to_owned(),
        );
        if let Some(jsx_name) = pattern.jsx_name.as_deref() {
            refs.insert(jsx_name.to_owned(), id.to_owned());
        }
        for item in &pattern.jsx {
            if let JsxSpecifier::String(jsx_name) = item {
                refs.insert(jsx_name.clone(), id.to_owned());
            }
        }
    }
    refs
}

/// The callback id of a utility whose `values` is a config-time JS callback.
#[must_use]
pub fn utility_values_callback_id(utility: &UtilityConfig) -> Option<&str> {
    let UtilityValues::Map(values) = utility.values.as_ref()? else {
        return None;
    };
    if values.get("kind")?.as_str()? != "js-callback" {
        return None;
    }
    values.get("id")?.as_str()
}

fn callback_ref_id(value: &CallbackRef) -> Option<&str> {
    (value.kind == "js-callback")
        .then_some(value.id.as_deref())
        .flatten()
}

/// Runs `parser:before` callbacks in order, each on the previous one's output.
/// `Ok(None)` when no callback changed the source.
///
/// # Errors
/// A callback that fails or returns a non-string becomes a warning diagnostic.
#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract"
)]
pub fn apply_source_transforms<'a, C: 'a>(
    path: &str,
    source: &str,
    callbacks: impl IntoIterator<Item = (&'a str, &'a HookFilter, &'a C)>,
    mut call: impl FnMut(&C, &str, &str) -> Result<Option<String>, CallbackError>,
) -> Result<Option<String>, Diagnostic> {
    let mut current: Option<String> = None;
    for (id, filter, callback) in callbacks {
        let input = current.as_deref().unwrap_or(source);
        if !filter.admits(path, input) {
            continue;
        }
        let result = call(callback, path, input).map_err(|err| {
            callback_diagnostic(match err {
                CallbackError::Unavailable(err) => {
                    format!("Failed to borrow parser:before callback `{id}` for `{path}`: {err}")
                }
                CallbackError::Serialize(err) => {
                    format!(
                        "Failed to pass source to parser:before callback `{id}` for `{path}`: {err}"
                    )
                }
                CallbackError::Threw(err) => {
                    format!("parser:before callback `{id}` for `{path}` threw: {err}")
                }
                CallbackError::InvalidResult(_) => format!(
                    "parser:before callback `{id}` for `{path}` must return a string or undefined"
                ),
            })
        })?;
        if let Some(next) = result {
            current = Some(next);
        }
    }
    Ok(current)
}

/// Runs the utility transform registered for `prop`, memoized on the original
/// value. `Ok(None)` when `prop` has no transform. A non-object result becomes
/// an empty style object, which drops the carrier atom downstream.
///
/// # Errors
/// A missing or failing callback becomes a warning diagnostic.
#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract"
)]
pub fn apply_utility_transform<C, S: BuildHasher, T: BuildHasher>(
    prop: &str,
    resolved: &AtomValue,
    original: &AtomValue,
    refs: &HashMap<String, String, S>,
    callbacks: &HashMap<String, C, T>,
    cache: &mut UtilityTransformCache,
    call: impl FnOnce(
        &C,
        serde_json::Value,
        serde_json::Value,
    ) -> Result<serde_json::Value, CallbackError>,
) -> Result<Option<Literal>, Diagnostic> {
    let Some(id) = refs.get(prop) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing utility transform callback `{id}` for `{prop}`"
        )));
    };
    let cache = &mut cache.0;

    let cache_key = UtilityTransformCacheKey {
        id: id.clone(),
        prop: prop.to_owned(),
        value: atom_value_cache_key(original),
    };
    if let Some(cached) = cache.get(&cache_key).cloned() {
        tracing::trace!(name: "utility_transform_cache_hit", cache = "utility_transform", action = "hit", target = prop);
        return Ok(Some(cached));
    }
    tracing::trace!(name: "utility_transform_cache_miss", cache = "utility_transform", action = "miss", target = prop);

    let result = call(callback, atom_value_json(resolved), atom_value_json(original)).map_err(|err| {
        callback_diagnostic(match err {
            CallbackError::Unavailable(err) => format!(
                "Failed to borrow utility transform callback `{id}` for `{prop}`: {err}"
            ),
            CallbackError::Serialize(err) => {
                format!("Failed to serialize utility transform value for `{prop}`: {err}")
            }
            CallbackError::Threw(err) => {
                format!("Utility transform callback `{id}` for `{prop}` threw: {err}")
            }
            CallbackError::InvalidResult(err) => format!(
                "Utility transform callback `{id}` for `{prop}` returned an invalid style object: {err}"
            ),
        })
    })?;
    let styles = match Literal::from_json_strict(&result) {
        Some(object @ Literal::Object(_)) => object,
        _ => Literal::Object(Vec::new()),
    };
    trace_cache_store("utility_transform", prop, cache.len(), cache.cap().get());
    cache.put(cache_key, styles.clone());
    Ok(Some(styles))
}

/// Runs the pattern transform registered for `name`, memoized on the props
/// (skipped when the props are too large to key). A `null` result keeps the
/// pattern's own styles.
///
/// # Errors
/// A missing or failing callback, or a result that isn't a style object,
/// becomes a warning diagnostic.
#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract"
)]
pub fn apply_pattern_transform<C, S: BuildHasher, T: BuildHasher>(
    name: &str,
    styles: &Literal,
    refs: &HashMap<String, String, S>,
    callbacks: &HashMap<String, C, T>,
    cache: &mut PatternTransformCache,
    call: impl FnOnce(&C, serde_json::Value) -> Result<serde_json::Value, CallbackError>,
) -> Result<Option<Literal>, Diagnostic> {
    let Some(id) = refs.get(name) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing pattern transform callback `{id}` for `{name}`"
        )));
    };
    let cache = &mut cache.0;

    let cache_key = literal_cache_key(styles, MAX_TRANSFORM_CACHE_KEY_BYTES).map(|props| {
        PatternTransformCacheKey {
            id: id.clone(),
            name: name.to_owned(),
            props,
        }
    });
    if let Some(cached) = cache_key.as_ref().and_then(|key| cache.get(key)).cloned() {
        tracing::trace!(name: "pattern_transform_cache_hit", cache = "pattern_transform", action = "hit", target = name);
        return Ok(cached);
    }
    tracing::trace!(
        name: "pattern_transform_cache_miss",
        cache = "pattern_transform",
        action = if cache_key.is_some() {
            "miss"
        } else {
            "skip_oversized_key"
        },
        target = name,
    );

    let props = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let invalid_result = || {
        format!("Pattern transform callback `{id}` for `{name}` returned an invalid style object")
    };
    let result = call(callback, props).map_err(|err| {
        callback_diagnostic(match err {
            CallbackError::Unavailable(err) => {
                format!("Failed to borrow pattern transform callback `{id}` for `{name}`: {err}")
            }
            CallbackError::Serialize(err) => {
                format!("Failed to serialize pattern props for `{name}`: {err}")
            }
            CallbackError::Threw(err) => {
                format!("Pattern transform callback `{id}` for `{name}` threw: {err}")
            }
            CallbackError::InvalidResult(err) => format!("{}: {err}", invalid_result()),
        })
    })?;
    let transformed = if result.is_null() {
        None
    } else {
        Some(
            Literal::from_json_strict(&result)
                .ok_or_else(|| callback_diagnostic(invalid_result()))?,
        )
    };
    if let Some(cache_key) = cache_key {
        trace_cache_store("pattern_transform", name, cache.len(), cache.cap().get());
        cache.put(cache_key, transformed.clone());
    }
    Ok(transformed)
}

fn trace_cache_store(cache: &'static str, target: &str, len: usize, capacity: usize) {
    tracing::trace!(
        name: "transform_cache_store",
        cache,
        action = "store",
        target,
        entries = len.saturating_add(1).min(capacity),
        evicted = len == capacity
    );
}

/// A warning diagnostic for a transform callback that couldn't run.
#[must_use]
pub fn callback_diagnostic(message: String) -> Diagnostic {
    Diagnostic {
        code: diagnostic_codes::TRANSFORM_CALLBACK_FAILED.to_owned(),
        message,
        severity: DiagnosticSeverity::Warning,
        file: None,
        category: None,
        span: None,
        location: None,
        labels: None,
        help: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equivalent_literal_trees_produce_equal_cache_keys() {
        let first = Literal::Object(vec![
            ("gap".to_owned(), Literal::String("4".to_owned())),
            (
                "_hover".to_owned(),
                Literal::Object(vec![(
                    "color".to_owned(),
                    Literal::String("red".to_owned()),
                )]),
            ),
            (
                "fallback".to_owned(),
                Literal::Conditional(vec![Literal::Bool(true), Literal::Null]),
            ),
        ]);
        let second = first.clone();

        assert_eq!(
            literal_cache_key(&first, 1024),
            literal_cache_key(&second, 1024)
        );
    }

    #[test]
    fn oversized_literal_returns_none_before_building_a_cache_key() {
        let value = Literal::Object(vec![(
            "className".to_owned(),
            Literal::String("x".repeat(64)),
        )]);

        assert_eq!(literal_cache_key(&value, 16), None);
    }
}
