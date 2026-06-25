use super::Compiler;

use napi_derive::napi;

#[napi]
impl Compiler {
    /// Build a `panda.lib.json` value from host-supplied fields, stamping the
    /// engine-owned schema version. Backs the `designSystem.create` JS namespace.
    ///
    /// # Errors
    /// Returns an error if `input` is invalid or the manifest fails to serialize.
    #[napi(js_name = createDesignSystemManifest)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn create_design_system_manifest(
        &self,
        input: serde_json::Value,
    ) -> napi::Result<serde_json::Value> {
        let input: pandacss_project::ManifestInput = serde_json::from_value(input)
            .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        let manifest = self.inner.design_system_manifest(input);
        serde_json::to_value(&manifest).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// The manifest wire-format version this binding reads/writes. The JS
    /// `designSystem.validate` compares a manifest's `schemaVersion` against it.
    #[napi(js_name = designSystemManifestSchemaVersion)]
    #[must_use]
    pub fn design_system_manifest_schema_version(&self) -> u32 {
        pandacss_project::MANIFEST_SCHEMA_VERSION
    }

    /// Order already-read manifests by their `designSystem` parent links into a
    /// root-first hydrate/merge plan (or report a cycle). Backs the
    /// `designSystem.resolveChain` JS namespace. Pure — the host did the reads.
    ///
    /// # Errors
    /// Returns an error if `manifests` isn't a valid manifest array or the plan
    /// fails to serialize.
    #[napi(js_name = resolveDesignSystemChain)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn resolve_design_system_chain(
        &self,
        manifests: serde_json::Value,
    ) -> napi::Result<serde_json::Value> {
        let manifests: Vec<pandacss_project::DesignSystemManifest> =
            serde_json::from_value(manifests)
                .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        let plan = pandacss_project::resolve_chain(&manifests);
        serde_json::to_value(&plan).map_err(|err| napi::Error::from_reason(err.to_string()))
    }
}
