use super::{SourceTransformCallback, WasmCompiler};

use lru::LruCache;
use pandacss_encoder::AtomValue;
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use serde::Serialize as _;
use std::collections::HashMap;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::cache::{
    MAX_TRANSFORM_CACHE_KEY_BYTES, PatternTransformCacheKey, UtilityTransformCacheKey,
};
use pandacss_config::{CallbackRef, JsxSpecifier, UserConfig, UtilityConfig, UtilityValues};

use super::support::{atom_value_to_json, capitalize, js_error_message};

#[wasm_bindgen]
impl WasmCompiler {
    /// Register a JS-backed utility transform callback. The JS package wraps
    /// the user callback so Rust only has to pass the raw value.
    #[wasm_bindgen(js_name = registerUtilityTransform)]
    pub fn register_utility_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed pattern transform callback. The wrapper package
    /// installs callbacks referenced by the serialized config snapshot.
    #[wasm_bindgen(js_name = registerPatternTransform)]
    pub fn register_pattern_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.pattern_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_pattern();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed `parser:before` source transform with a Rust-side
    /// filter. The filter is evaluated before calling into JS.
    #[wasm_bindgen(js_name = registerSourceTransform)]
    pub fn register_source_transform(
        &mut self,
        id: String,
        filter: JsValue,
        callback: js_sys::Function,
    ) -> Result<(), JsValue> {
        let filter = if filter.is_null() || filter.is_undefined() {
            pandacss_project::HookFilter::default()
        } else {
            let value: serde_json::Value =
                serde_wasm_bindgen::from_value(filter).map_err(|err| {
                    JsValue::from_str(&format!("invalid parser:before filter: {err}"))
                })?;
            pandacss_project::HookFilter::from_json(&value).map_err(|err| {
                JsValue::from_str(&format!(
                    "Invalid parser:before filter for callback `{id}`: {err}"
                ))
            })?
        };
        self.callbacks
            .source_transforms
            .push((id, SourceTransformCallback { filter, callback }));
        self.inner.bump_parse_epoch();
        Ok(())
    }
}

pub(super) fn resolve_utility_values_callbacks(
    config: &mut UserConfig,
    token_dictionary: Option<&pandacss_tokens::TokenDictionary>,
    callbacks: &HashMap<String, js_sys::Function>,
) -> Result<(), JsValue> {
    if callbacks.is_empty() {
        return Ok(());
    }

    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    let token_dictionary = match token_dictionary {
        Some(dictionary) => crate::matcher::from_core_token_dictionary(dictionary)
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))?,
        None => JsValue::UNDEFINED,
    };

    for (prop, utility) in &mut config.utilities {
        let Some(id) = utility_values_callback_id(utility).map(str::to_owned) else {
            continue;
        };
        let Some(callback) = callbacks.get(&id) else {
            continue;
        };
        let result = callback
            .call1(&JsValue::UNDEFINED, &token_dictionary)
            .map_err(|err| {
                JsValue::from_str(&format!(
                    "Utility values callback `{id}` for `{prop}` threw: {err:?}"
                ))
            })?;
        utility.values = Some(serde_wasm_bindgen::from_value(result).map_err(|err| {
            JsValue::from_str(&format!(
                "Utility values callback `{id}` for `{prop}` returned invalid values: {err}"
            ))
        })?);
    }

    Ok(())
}

pub(super) fn utility_value_callbacks_from_options(
    options: &JsValue,
) -> Result<HashMap<String, js_sys::Function>, JsValue> {
    if options.is_undefined() || options.is_null() {
        return Ok(HashMap::new());
    }
    let config_callbacks = js_sys::Reflect::get(options, &JsValue::from_str("configCallbacks"))?;
    if config_callbacks.is_undefined() || config_callbacks.is_null() {
        return Ok(HashMap::new());
    }
    let utility_values =
        js_sys::Reflect::get(&config_callbacks, &JsValue::from_str("utilityValues"))?;
    if utility_values.is_undefined() || utility_values.is_null() {
        return Ok(HashMap::new());
    }
    let utility_values = js_sys::Object::from(utility_values);
    let entries = js_sys::Object::entries(&utility_values);
    let mut callbacks = HashMap::new();
    for entry in entries.iter() {
        let pair = js_sys::Array::from(&entry);
        let Some(id) = pair.get(0).as_string() else {
            continue;
        };
        let callback = pair
            .get(1)
            .dyn_into::<js_sys::Function>()
            .map_err(|_| JsValue::from_str(&format!("invalid utility.values callback `{id}`")))?;
        callbacks.insert(id, callback);
    }
    Ok(callbacks)
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

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract used by other JS callbacks"
)]
pub(super) fn apply_source_transforms(
    path: &str,
    source: &str,
    callbacks: &[(String, SourceTransformCallback)],
) -> Result<Option<String>, pandacss_extractor::Diagnostic> {
    let mut current: Option<String> = None;
    for (id, entry) in callbacks {
        let input = current.as_deref().unwrap_or(source);
        if !entry.filter.admits(path, input) {
            continue;
        }

        let result = entry
            .callback
            .call2(
                &JsValue::NULL,
                &JsValue::from_str(path),
                &JsValue::from_str(input),
            )
            .map_err(|err| {
                callback_diagnostic(format!(
                    "parser:before callback `{id}` for `{path}` threw: {}",
                    js_error_message(&err)
                ))
            })?;
        if result.is_null() || result.is_undefined() {
            continue;
        }
        let Some(next) = result.as_string() else {
            return Err(callback_diagnostic(format!(
                "parser:before callback `{id}` for `{path}` must return a string or undefined"
            )));
        };
        current = Some(next);
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
    callbacks: &HashMap<String, js_sys::Function>,
    cache: &mut LruCache<UtilityTransformCacheKey, Literal>,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = utility_transform_refs.get(prop) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing utility transform callback `{id}` for `{prop}`"
        )));
    };

    // Keyed on the original alias (the resolved value is a function of it).
    let cache_key = UtilityTransformCacheKey {
        id: id.clone(),
        prop: prop.to_owned(),
        value: pandacss_project::atom_value_cache_key(original),
    };
    if let Some(cached) = cache.get(&cache_key).cloned() {
        tracing::trace!(
            cache = "utility_transform",
            action = "hit",
            target = prop,
            entries = cache.len()
        );
        return Ok(Some(cached));
    }
    tracing::trace!(
        cache = "utility_transform",
        action = "miss",
        target = prop,
        entries = cache.len()
    );

    // Positional = resolved value; second arg = original alias (`args.raw`).
    let resolved_js =
        serde_wasm_bindgen::to_value(&atom_value_to_json(resolved)).map_err(|err| {
            callback_diagnostic(format!(
                "Failed to serialize utility transform value for `{prop}`: {err}"
            ))
        })?;
    let original_js =
        serde_wasm_bindgen::to_value(&atom_value_to_json(original)).map_err(|err| {
            callback_diagnostic(format!(
                "Failed to serialize utility transform value for `{prop}`: {err}"
            ))
        })?;
    let result = callback
        .call2(&JsValue::NULL, &resolved_js, &original_js)
        .map_err(|err| {
            callback_diagnostic(format!(
                "Utility transform callback `{id}` for `{prop}` threw: {}",
                js_error_message(&err)
            ))
        })?;
    // Keep the style object whole for the emitter; non-object/empty → empty
    // object, which drops the carrier atom downstream.
    let styles = if result.is_null() || result.is_undefined() {
        Literal::Object(Vec::new())
    } else {
        let value: serde_json::Value = serde_wasm_bindgen::from_value(result).map_err(|err| {
            callback_diagnostic(format!(
                "Utility transform callback `{id}` for `{prop}` returned an invalid style object: {err}"
            ))
        })?;
        match json_value_to_literal(&value) {
            Some(object @ Literal::Object(_)) => object,
            _ => Literal::Object(Vec::new()),
        }
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
    callbacks: &HashMap<String, js_sys::Function>,
    cache: &mut LruCache<PatternTransformCacheKey, Option<Literal>>,
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
        tracing::trace!(
            cache = "pattern_transform",
            action = "hit",
            target = name,
            entries = cache.len()
        );
        return Ok(cached);
    }
    tracing::trace!(
        cache = "pattern_transform",
        action = if cache_key.is_some() {
            "miss"
        } else {
            "skip_oversized_key"
        },
        target = name,
        entries = cache.len()
    );

    let props_value = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;

    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    let props = props_value.serialize(&serializer).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let result = callback
        .call2(&JsValue::NULL, &props, &JsValue::NULL)
        .map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` threw: {}",
                js_error_message(&err)
            ))
        })?;
    let transformed = if result.is_null() || result.is_undefined() {
        None
    } else {
        let value: serde_json::Value = serde_wasm_bindgen::from_value(result).map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` returned an invalid style object: {err}"
            ))
        })?;
        json_value_to_literal(&value).map(Some).ok_or_else(|| {
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
        cache,
        action = "store",
        target,
        entries = len.saturating_add(1).min(capacity),
        evicted = len == capacity
    );
}

pub(super) fn get_utility_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (prop, utility) in &config.utilities {
        if let Some(id) = utility_callback_id(utility) {
            refs.insert(prop.clone(), id);
        }
    }

    refs
}

pub(super) fn get_pattern_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (name, pattern) in &config.patterns {
        let Some(id) = pattern.transform.as_ref().and_then(callback_ref_id) else {
            continue;
        };
        refs.insert(name.clone(), id.clone());
        refs.insert(capitalize(name), id.clone());
        if let Some(jsx_name) = &pattern.jsx_name {
            refs.insert(jsx_name.clone(), id.clone());
        }
        for specifier in &pattern.jsx {
            if let JsxSpecifier::String(jsx_name) = specifier {
                refs.insert(jsx_name.clone(), id.clone());
            }
        }
    }
    refs
}

fn utility_callback_id(utility: &UtilityConfig) -> Option<String> {
    utility.transform.as_ref().and_then(callback_ref_id)
}

fn callback_ref_id(value: &CallbackRef) -> Option<String> {
    (value.kind == "js-callback")
        .then(|| value.id.clone())
        .flatten()
}

pub(super) fn json_value_to_literal(value: &serde_json::Value) -> Option<Literal> {
    match value {
        serde_json::Value::String(value) => Some(Literal::String(value.clone())),
        serde_json::Value::Number(value) => value.as_f64().map(Literal::Number),
        serde_json::Value::Bool(value) => Some(Literal::Bool(*value)),
        serde_json::Value::Null => Some(Literal::Null),
        serde_json::Value::Array(items) => items
            .iter()
            .map(json_value_to_literal)
            .collect::<Option<Vec<_>>>()
            .map(Literal::Array),
        serde_json::Value::Object(entries) => {
            let mut out = Vec::with_capacity(entries.len());
            for (key, value) in entries {
                out.push((key.clone(), json_value_to_literal(value)?));
            }
            Some(Literal::Object(out))
        }
    }
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
