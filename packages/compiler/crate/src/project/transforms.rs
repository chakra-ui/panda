use super::{
    Compiler, JsCallbackArg, SourceTransformCallback, SourceTransformRef, UtilityTransformRef,
    UtilityValueCallbacks,
};

use super::interop::{atom_value_to_json, capitalize, json_value_to_literal};
use crate::cache::{
    MAX_TRANSFORM_CACHE_KEY_BYTES, PatternTransformCacheKey, UtilityTransformCacheKey,
};
use lru::LruCache;
use napi::bindgen_prelude::{FnArgs, FunctionRef, JsValue};
use napi_derive::napi;
use pandacss_config::{
    CallbackRef, JsxSpecifier, PatternConfig, UserConfig, UtilityConfig, UtilityValues,
};
use pandacss_encoder::AtomValue;
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use pandacss_tokens::TokenCategory;
use std::collections::HashMap;
use std::sync::Arc;

/*
 * Callback registration.
 */
#[napi]
impl Compiler {
    /// Register a JS-backed utility transform callback.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn register_utility_transform(&mut self, id: String, callback: UtilityTransformRef) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed pattern transform callback.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn register_pattern_transform(
        &mut self,
        id: String,
        callback: FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>,
    ) {
        self.callbacks.pattern_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_pattern();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed `parser:before` source transform.
    #[napi(js_name = "registerSourceTransform")]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn register_source_transform(
        &mut self,
        id: String,
        filter: Option<serde_json::Value>,
        callback: SourceTransformRef,
    ) -> napi::Result<()> {
        let filter = filter
            .as_ref()
            .map(pandacss_project::HookFilter::from_json)
            .transpose()
            .map_err(|err| {
                napi::Error::from_reason(format!(
                    "Invalid parser:before filter for callback `{id}`: {err}"
                ))
            })?
            .unwrap_or_default();
        self.callbacks
            .source_transforms
            .push((id, SourceTransformCallback { filter, callback }));
        self.inner.bump_parse_epoch();
        Ok(())
    }
}

/*
 * Config-time `utility.values` callbacks.
 */
pub(super) fn resolve_utility_values_callbacks(
    config: &mut UserConfig,
    token_dictionary: Option<&Arc<pandacss_tokens::TokenDictionary>>,
    callbacks: Option<&UtilityValueCallbacks>,
    env: &napi::Env,
) -> napi::Result<()> {
    let Some(callbacks) = callbacks else {
        return Ok(());
    };
    if callbacks.is_empty() {
        return Ok(());
    }

    for (prop, utility) in &mut config.utilities {
        let Some(id) = utility_values_callback_id(utility).map(str::to_owned) else {
            continue;
        };
        let Some(callback) = callbacks.get(&id) else {
            continue;
        };
        let theme = create_theme_function(env, token_dictionary.cloned())?;
        let result = callback
            .borrow_back(env)
            .map_err(|err| {
                napi::Error::from_reason(format!(
                    "Failed to borrow utility values callback `{id}` for `{prop}`: {err}"
                ))
            })?
            .call(FnArgs::from((JsCallbackArg(theme.value().value),)))
            .map_err(|err| {
                napi::Error::from_reason(format!(
                    "Utility values callback `{id}` for `{prop}` threw: {}",
                    err.reason
                ))
            })?;
        if result.is_null() {
            utility.values = None;
            continue;
        }
        utility.values = Some(serde_json::from_value(result).map_err(|err| {
            napi::Error::from_reason(format!(
                "Utility values callback `{id}` for `{prop}` returned invalid values: {err}"
            ))
        })?);
    }
    Ok(())
}

type ThemeFn<'a> =
    napi::bindgen_prelude::Function<'a, FnArgs<(String,)>, Option<HashMap<String, String>>>;

fn create_theme_function(
    env: &napi::Env,
    token_dictionary: Option<Arc<pandacss_tokens::TokenDictionary>>,
) -> napi::Result<ThemeFn<'_>> {
    env.create_function_from_closure("theme", move |ctx| {
        let category = ctx.get::<String>(0)?;
        let Some(dictionary) = token_dictionary.as_ref() else {
            return Ok(None);
        };
        let cat = TokenCategory::from_path_segment(&category);
        let Some(values) = dictionary.category_values_str(&cat) else {
            return Ok(None);
        };
        if values.is_empty() {
            return Ok(None);
        }
        Ok(Some(
            values
                .iter()
                .map(|(key, value)| (key.to_string(), value.to_string()))
                .collect(),
        ))
    })
}

fn utility_values_callback_id(utility: &UtilityConfig) -> Option<&str> {
    let UtilityValues::Map(values) = utility.values.as_ref()? else {
        return None;
    };
    let kind = values.get("kind")?.as_str()?;
    if kind != "js-callback" {
        return None;
    }
    values.get("id")?.as_str()
}

/*
 * Parse-time transform callbacks.
 */
#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract used by other JS callbacks"
)]
pub(super) fn apply_source_transforms(
    path: &str,
    source: &str,
    callbacks: &[(String, SourceTransformCallback)],
    env: &napi::Env,
) -> Result<Option<String>, pandacss_extractor::Diagnostic> {
    let mut current: Option<String> = None;
    for (id, entry) in callbacks {
        let input = current.as_deref().unwrap_or(source);
        if !entry.filter.admits(path, input) {
            continue;
        }

        let transform = entry.callback.borrow_back(env).map_err(|err| {
            callback_diagnostic(format!(
                "Failed to borrow parser:before callback `{id}` for `{path}`: {err}"
            ))
        })?;
        let result = transform
            .call(FnArgs::from((path.to_owned(), input.to_owned())))
            .map_err(|err| {
                callback_diagnostic(format!(
                    "parser:before callback `{id}` for `{path}` threw: {}",
                    err.reason
                ))
            })?;
        if let Some(next) = result {
            current = Some(next);
        }
    }

    Ok(current)
}

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract; boxing would diverge from UtilityTransformFn"
)]
pub(super) fn apply_utility_transform(
    prop: &str,
    resolved: &AtomValue,
    original: &AtomValue,
    utility_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, UtilityTransformRef>,
    cache: &mut LruCache<UtilityTransformCacheKey, Literal>,
    env: &napi::Env,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = utility_transform_refs.get(prop) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing utility transform callback `{id}` for `{prop}`"
        )));
    };

    let cache_key = UtilityTransformCacheKey {
        id: id.clone(),
        prop: prop.to_owned(),
        value: pandacss_project::atom_value_cache_key(original),
    };
    if let Some(cached) = cache.get(&cache_key).cloned() {
        tracing::trace!(name: "utility_transform_cache_hit", cache = "utility_transform", action = "hit", target = prop);
        return Ok(Some(cached));
    }
    tracing::trace!(name: "utility_transform_cache_miss", cache = "utility_transform", action = "miss", target = prop);

    let resolved_json = atom_value_to_json(resolved);
    let original_json = atom_value_to_json(original);
    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow utility transform callback `{id}` for `{prop}`: {err}"
        ))
    })?;
    let result = transform
        .call(FnArgs::from((resolved_json, original_json)))
        .map_err(|err| {
            callback_diagnostic(format!(
                "Utility transform callback `{id}` for `{prop}` threw: {}",
                err.reason
            ))
        })?;
    let styles = match json_value_to_literal(&result) {
        Some(object @ Literal::Object(_)) => object,
        _ => Literal::Object(Vec::new()),
    };
    trace_cache_store("utility_transform", prop, cache.len(), cache.cap().get());
    cache.put(cache_key, styles.clone());
    Ok(Some(styles))
}

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract; boxing would diverge from PatternTransformFn"
)]
pub(super) fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    cache: &mut LruCache<PatternTransformCacheKey, Option<Literal>>,
    env: &napi::Env,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = pattern_transform_refs.get(name) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing pattern transform callback `{id}` for `{name}`"
        )));
    };

    let cache_key =
        pandacss_project::literal_cache_key(styles, MAX_TRANSFORM_CACHE_KEY_BYTES).map(|props| {
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
    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow pattern transform callback `{id}` for `{name}`: {err}"
        ))
    })?;
    let result = transform.call(FnArgs::from((props,))).map_err(|err| {
        callback_diagnostic(format!(
            "Pattern transform callback `{id}` for `{name}` threw: {}",
            err.reason
        ))
    })?;
    let transformed = if result.is_null() {
        None
    } else {
        json_value_to_literal(&result).map(Some).ok_or_else(|| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` returned an invalid style object"
            ))
        })?
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

/*
 * Callback ref lookup.
 */
pub(super) fn get_utility_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (prop, utility) in &config.utilities {
        if let Some(id) = utility_callback_id(utility) {
            refs.insert(prop.clone(), id.to_owned());
        }
    }
    refs
}

pub(super) fn get_pattern_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (name, pattern) in &config.patterns {
        let Some(id) = pattern_callback_id(pattern).map(str::to_owned) else {
            continue;
        };
        refs.insert(name.clone(), id.clone());
        refs.insert(capitalize(name), id.clone());
        if let Some(jsx_name) = pattern.jsx_name.as_deref() {
            refs.insert(jsx_name.to_owned(), id.clone());
        }
        for item in &pattern.jsx {
            if let JsxSpecifier::String(jsx_name) = item {
                refs.insert(jsx_name.to_owned(), id.clone());
            }
        }
    }
    refs
}

fn utility_callback_id(utility: &UtilityConfig) -> Option<&str> {
    callback_ref_id(utility.transform.as_ref()?)
}

fn pattern_callback_id(pattern: &PatternConfig) -> Option<&str> {
    callback_ref_id(pattern.transform.as_ref()?)
}

fn callback_ref_id(value: &CallbackRef) -> Option<&str> {
    (value.kind == "js-callback")
        .then_some(value.id.as_deref())
        .flatten()
}

fn callback_diagnostic(message: String) -> pandacss_extractor::Diagnostic {
    pandacss_extractor::Diagnostic {
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
