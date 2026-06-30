use super::WasmCompiler;

use serde::Serialize as _;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl WasmCompiler {
    /// Build a `panda.lib.json` value from host-supplied fields, stamping the
    /// engine-owned schema version. Backs the `designSystem.create` JS namespace.
    ///
    /// # Errors
    /// Returns a JS error if `input` is invalid or the manifest fails to serialize.
    #[wasm_bindgen(js_name = createDesignSystemManifest)]
    pub fn create_design_system_manifest(&self, input: JsValue) -> Result<JsValue, JsValue> {
        let input: pandacss_project::ManifestInput = serde_wasm_bindgen::from_value(input)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let manifest = self.inner.design_system_manifest(input);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        manifest
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Order already-read manifests by their `designSystem` parent links into a
    /// root-first hydrate/merge plan (or report a cycle). Backs the
    /// `designSystem.resolveChain` JS namespace. Pure — the host did the reads.
    ///
    /// # Errors
    /// Returns a JS error if `manifests` is invalid or the plan fails to serialize.
    #[wasm_bindgen(js_name = resolveDesignSystemChain)]
    pub fn resolve_design_system_chain(&self, manifests: JsValue) -> Result<JsValue, JsValue> {
        let manifests: Vec<pandacss_project::DesignSystemManifest> =
            serde_wasm_bindgen::from_value(manifests)
                .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let plan = pandacss_project::resolve_chain(&manifests);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        plan.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// The manifest wire-format version this binding reads/writes.
    #[wasm_bindgen(js_name = designSystemManifestSchemaVersion)]
    #[must_use]
    pub fn design_system_manifest_schema_version(&self) -> u32 {
        pandacss_project::MANIFEST_SCHEMA_VERSION
    }
}
