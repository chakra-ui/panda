use super::{
    Compiler, JsCallbackArg, SourceTransformCallback, SourceTransformRef, UtilityTransformRef,
    UtilityValueCallbacks,
};

use napi::bindgen_prelude::{FnArgs, FunctionRef, JsValue};
use napi_derive::napi;
use pandacss_compiler::{
    CallbackError, PatternTransformCache, UtilityTransformCache, utility_values_callback_id,
};
use pandacss_config::UserConfig;
use pandacss_encoder::AtomValue;
use pandacss_literal::Literal;
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
            .map(pandacss_compiler::HookFilter::from_json)
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
    pandacss_compiler::apply_source_transforms(
        path,
        source,
        callbacks
            .iter()
            .map(|(id, entry)| (id.as_str(), &entry.filter, &entry.callback)),
        |callback, path, input| {
            callback
                .borrow_back(env)
                .map_err(|err| CallbackError::Unavailable(err.to_string()))?
                .call(FnArgs::from((path.to_owned(), input.to_owned())))
                .map_err(|err| CallbackError::Threw(err.reason.clone()))
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
    callbacks: &HashMap<String, UtilityTransformRef>,
    cache: &mut UtilityTransformCache,
    env: &napi::Env,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    pandacss_compiler::apply_utility_transform(
        prop,
        resolved,
        original,
        utility_transform_refs,
        callbacks,
        cache,
        |callback, resolved, original| {
            callback
                .borrow_back(env)
                .map_err(|err| CallbackError::Unavailable(err.to_string()))?
                .call(FnArgs::from((resolved, original)))
                .map_err(|err| CallbackError::Threw(err.reason.clone()))
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
    callbacks: &HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    cache: &mut PatternTransformCache,
    env: &napi::Env,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    pandacss_compiler::apply_pattern_transform(
        name,
        styles,
        pattern_transform_refs,
        callbacks,
        cache,
        |callback, props| {
            callback
                .borrow_back(env)
                .map_err(|err| CallbackError::Unavailable(err.to_string()))?
                .call(FnArgs::from((props,)))
                .map_err(|err| CallbackError::Threw(err.reason.clone()))
        },
    )
}
