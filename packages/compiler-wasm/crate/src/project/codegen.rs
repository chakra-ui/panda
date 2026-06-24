use super::WasmCompiler;

use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use pandacss_codegen::ArtifactId;

use super::support::{
    dependency_set_from_strings, generate_artifact_options_from_js, generate_options,
    serialize_codegen_artifacts, to_codegen_artifact,
};

#[wasm_bindgen]
impl WasmCompiler {
    /// Generate every codegen artifact from the resolved project state.
    ///
    /// # Errors
    /// Returns a JS error if options are invalid or serializing fails.
    #[wasm_bindgen(js_name = generateArtifacts)]
    pub fn generate_artifacts(&self, options: &JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("codegen", method = "wasm_generate_artifacts").entered();
        let options = generate_options(
            &self.user_config,
            &generate_artifact_options_from_js(options)?,
        );
        serialize_codegen_artifacts(self.inner.generate_artifacts(&self.user_config, options))
    }

    /// Generate one codegen artifact by id.
    ///
    /// # Errors
    /// Returns a JS error if the id/options are invalid or serializing fails.
    #[wasm_bindgen(js_name = generateArtifact)]
    pub fn generate_artifact(&self, id: &str, options: &JsValue) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("codegen", method = "wasm_generate_artifact", id).entered();
        let id = id
            .parse::<ArtifactId>()
            .map_err(|()| JsValue::from_str(&format!("unknown codegen artifact `{id}`")))?;
        let options = generate_options(
            &self.user_config,
            &generate_artifact_options_from_js(options)?,
        );
        let artifact = self.inner.generate_artifact(&self.user_config, id, options);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        artifact
            .map(to_codegen_artifact)
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Generate artifacts affected by the provided config dependency names.
    ///
    /// # Errors
    /// Returns a JS error if dependencies/options are invalid or serializing fails.
    #[wasm_bindgen(js_name = generateAffectedArtifacts)]
    pub fn generate_affected_artifacts(
        &self,
        dependencies: JsValue,
        options: &JsValue,
    ) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("codegen", method = "wasm_generate_affected_artifacts").entered();
        let dependencies: Vec<String> = serde_wasm_bindgen::from_value(dependencies)
            .map_err(|err| JsValue::from_str(&format!("invalid dependencies: {err}")))?;
        let changed = dependency_set_from_strings(dependencies)?;
        let options = generate_options(
            &self.user_config,
            &generate_artifact_options_from_js(options)?,
        );
        serialize_codegen_artifacts(self.inner.generate_affected_artifacts(
            &self.user_config,
            changed,
            options,
        ))
    }
}
