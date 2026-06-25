use super::WasmCompiler;

use serde::Serialize as _;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl WasmCompiler {
    /// Serialize the project's encoded atoms + recipes into a portable build info
    /// (the `panda buildinfo` producer). `configFingerprint` is engine-owned; the
    /// caller supplies only the published `panda` peer range.
    ///
    /// # Errors
    /// Returns a JS error if serializing the build info fails.
    #[wasm_bindgen(js_name = serializeBuildInfo)]
    pub fn serialize_build_info(&self, panda: String) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("boundary_encode", method = "serialize_build_info").entered();
        let info = self.inner.build_info(panda);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        info.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Hydrate an external build info into this project (additive), optionally
    /// restricted to imported modules (tree-shaking). Returns `false` on a
    /// schema-version mismatch.
    ///
    /// # Errors
    /// Returns a JS error if `build_info` isn't a valid build-info document.
    #[wasm_bindgen(js_name = applyBuildInfo)]
    pub fn apply_build_info(
        &mut self,
        name: &str,
        build_info: JsValue,
        only: JsValue,
    ) -> Result<bool, JsValue> {
        let info: pandacss_project::BuildInfo = serde_wasm_bindgen::from_value(build_info)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;

        // `only` is optional — wasm_bindgen passes `undefined`/`null` when omitted.
        let only: Option<Vec<String>> = if only.is_undefined() || only.is_null() {
            None
        } else {
            serde_wasm_bindgen::from_value(only)
                .map_err(|err| JsValue::from_str(&err.to_string()))?
        };

        Ok(self.inner.hydrate(name, &info, only.as_deref()))
    }

    /// The build-info wire-format version this binding reads/writes.
    #[wasm_bindgen(js_name = buildInfoSchemaVersion)]
    #[must_use]
    pub fn build_info_schema_version(&self) -> u32 {
        pandacss_project::SCHEMA_VERSION
    }
}
