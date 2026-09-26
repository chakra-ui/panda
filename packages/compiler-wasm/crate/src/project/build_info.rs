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
    pub fn serialize_build_info(
        &self,
        panda: String,
        dependencies: JsValue,
    ) -> Result<JsValue, JsValue> {
        #[derive(serde::Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct DependencyQuery {
            name: String,
            package_roots: Vec<String>,
            exclude_modules: Option<Vec<String>>,
        }

        let _span =
            tracing::trace_span!("boundary_encode", method = "serialize_build_info").entered();
        let dependencies: Vec<DependencyQuery> =
            if dependencies.is_undefined() || dependencies.is_null() {
                Vec::new()
            } else {
                serde_wasm_bindgen::from_value(dependencies)
                    .map_err(|err| JsValue::from_str(&err.to_string()))?
            };
        let dependencies: Vec<pandacss_project::DesignSystemDependency> = dependencies
            .into_iter()
            .map(|dependency| pandacss_project::DesignSystemDependency {
                name: dependency.name,
                roots: dependency.package_roots,
                exclude_modules: dependency.exclude_modules.unwrap_or_default(),
            })
            .collect();
        let info = self
            .inner
            .build_info_with_dependencies(panda, &dependencies);
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
