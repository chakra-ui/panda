use super::{Compiler, SourceTransformCallback, SourceTransformRef, UtilityTransformRef};

use napi::bindgen_prelude::{FnArgs, FunctionRef};
use napi_derive::napi;

#[napi]
impl Compiler {
    /// Register a JS-backed utility transform callback. The config snapshot
    /// stores only callback ids; the JS layer passes the live function refs
    /// through this method after constructing the native project.
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

    /// Register a JS-backed pattern transform callback. Pattern transforms
    /// run before atomic encoding and may return full system style objects,
    /// including nested conditions.
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

    /// Register a JS-backed `parser:before` source transform with a Rust-side
    /// filter. The filter is evaluated before calling into JS.
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
