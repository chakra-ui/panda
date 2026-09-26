use super::{SourceTransformCallback, WasmCompiler};

use pandacss_compiler::{
    CallbackError, PatternTransformCache, UtilityTransformCache, utility_values_callback_id,
};
use pandacss_encoder::AtomValue;
use pandacss_literal::Literal;
use pandacss_tokens::TokenCategory;
use serde::Serialize as _;
use std::collections::HashMap;
use std::sync::Arc;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use pandacss_config::UserConfig;

use super::interop::js_error_message;

/*
 * Callback registration.
 */
#[wasm_bindgen]
impl WasmCompiler {
    /// Register a JS-backed utility transform callback.
    #[wasm_bindgen(js_name = registerUtilityTransform)]
    pub fn register_utility_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed pattern transform callback.
    #[wasm_bindgen(js_name = registerPatternTransform)]
    pub fn register_pattern_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.pattern_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_pattern();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed `parser:before` source transform.
    #[wasm_bindgen(js_name = registerSourceTransform)]
    pub fn register_source_transform(
        &mut self,
        id: String,
        filter: JsValue,
        callback: js_sys::Function,
    ) -> Result<(), JsValue> {
        let filter = if filter.is_null() || filter.is_undefined() {
            pandacss_compiler::HookFilter::default()
        } else {
            let value: serde_json::Value =
                serde_wasm_bindgen::from_value(filter).map_err(|err| {
                    JsValue::from_str(&format!("invalid parser:before filter: {err}"))
                })?;
            pandacss_compiler::HookFilter::from_json(&value).map_err(|err| {
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

/*
 * Config-time `utility.values` callbacks.
 */
pub(super) fn resolve_utility_values_callbacks(
    config: &mut UserConfig,
    token_dictionary: Option<&Arc<pandacss_tokens::TokenDictionary>>,
    callbacks: &HashMap<String, js_sys::Function>,
) -> Result<(), JsValue> {
    if callbacks.is_empty() {
        return Ok(());
    }

    // Keep theme closures alive for the duration of this resolve pass.
    let mut theme_closures = Vec::new();

    for (prop, utility) in &mut config.utilities {
        let Some(id) = utility_values_callback_id(utility).map(str::to_owned) else {
            continue;
        };
        let Some(callback) = callbacks.get(&id) else {
            continue;
        };
        let theme = create_theme_function(token_dictionary.cloned(), &mut theme_closures);
        let result = callback.call1(&JsValue::UNDEFINED, &theme).map_err(|err| {
            JsValue::from_str(&format!(
                "Utility values callback `{id}` for `{prop}` threw: {err:?}"
            ))
        })?;
        if result.is_null() || result.is_undefined() {
            utility.values = None;
            continue;
        }
        utility.values = Some(serde_wasm_bindgen::from_value(result).map_err(|err| {
            JsValue::from_str(&format!(
                "Utility values callback `{id}` for `{prop}` returned invalid values: {err}"
            ))
        })?);
    }

    Ok(())
}

fn create_theme_function(
    token_dictionary: Option<Arc<pandacss_tokens::TokenDictionary>>,
    keep_alive: &mut Vec<Closure<dyn Fn(String) -> JsValue>>,
) -> js_sys::Function {
    let closure = Closure::new(move |category: String| -> JsValue {
        let Some(dictionary) = token_dictionary.as_ref() else {
            return JsValue::UNDEFINED;
        };
        let cat = TokenCategory::from_path_segment(&category);
        let Some(values) = dictionary.category_values_str(&cat) else {
            return JsValue::UNDEFINED;
        };
        if values.is_empty() {
            return JsValue::UNDEFINED;
        }
        let out = js_sys::Object::new();
        for (key, value) in values {
            let _ = js_sys::Reflect::set(
                &out,
                &JsValue::from_str(key.as_ref()),
                &JsValue::from_str(value.as_ref()),
            );
        }
        out.into()
    });
    let function = closure.as_ref().unchecked_ref::<js_sys::Function>().clone();
    keep_alive.push(closure);
    function
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
) -> Result<Option<String>, pandacss_extractor::Diagnostic> {
    pandacss_compiler::apply_source_transforms(
        path,
        source,
        callbacks
            .iter()
            .map(|(id, entry)| (id.as_str(), &entry.filter, &entry.callback)),
        |callback, path, input| {
            let result = callback
                .call2(
                    &JsValue::NULL,
                    &JsValue::from_str(path),
                    &JsValue::from_str(input),
                )
                .map_err(|err| CallbackError::Threw(js_error_message(&err)))?;
            if result.is_null() || result.is_undefined() {
                return Ok(None);
            }
            result
                .as_string()
                .map(Some)
                .ok_or_else(|| CallbackError::InvalidResult(String::new()))
        },
    )
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
    cache: &mut UtilityTransformCache,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    pandacss_compiler::apply_utility_transform(
        prop,
        resolved,
        original,
        utility_transform_refs,
        callbacks,
        cache,
        |callback, resolved, original| {
            let resolved = to_js(&resolved)?;
            let original = to_js(&original)?;
            let result = callback
                .call2(&JsValue::NULL, &resolved, &original)
                .map_err(|err| CallbackError::Threw(js_error_message(&err)))?;
            from_js(result)
        },
    )
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
    cache: &mut PatternTransformCache,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    pandacss_compiler::apply_pattern_transform(
        name,
        styles,
        pattern_transform_refs,
        callbacks,
        cache,
        |callback, props| {
            let props = to_js(&props)?;
            let result = callback
                .call2(&JsValue::NULL, &props, &JsValue::NULL)
                .map_err(|err| CallbackError::Threw(js_error_message(&err)))?;
            from_js(result)
        },
    )
}

fn to_js(value: &serde_json::Value) -> Result<JsValue, CallbackError> {
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    value
        .serialize(&serializer)
        .map_err(|err| CallbackError::Serialize(err.to_string()))
}

fn from_js(value: JsValue) -> Result<serde_json::Value, CallbackError> {
    if value.is_null() || value.is_undefined() {
        return Ok(serde_json::Value::Null);
    }
    serde_wasm_bindgen::from_value(value)
        .map_err(|err| CallbackError::InvalidResult(err.to_string()))
}
