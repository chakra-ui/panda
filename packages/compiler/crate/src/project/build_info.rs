use super::Compiler;

use napi_derive::napi;

#[napi]
impl Compiler {
    /// Low-level build-info primitive — serialize the project's encoded atoms
    /// (string-interned, per-module provenance). The public surface is the
    /// `buildInfo.create` namespace in JS; `configFingerprint` is engine-owned.
    ///
    /// # Errors
    /// Returns an error if the build info fails to serialize.
    #[napi(js_name = serializeBuildInfo)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn serialize_build_info(&self, panda: String) -> napi::Result<serde_json::Value> {
        let info = self.inner.build_info(panda);
        serde_json::to_value(&info).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Low-level build-info primitive — hydrate a deserialized build info into
    /// this project (additive), optionally restricted to imported modules
    /// (tree-shaking). Returns `false` on schema-version mismatch. The public
    /// surface (with validation) is the `buildInfo.hydrate` namespace in JS.
    ///
    /// # Errors
    /// Returns an error if `buildInfo` isn't a valid build-info document.
    #[napi(js_name = applyBuildInfo)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn apply_build_info(
        &mut self,
        name: String,
        build_info: serde_json::Value,
        only_modules: Option<Vec<String>>,
    ) -> napi::Result<bool> {
        let info: pandacss_project::BuildInfo = serde_json::from_value(build_info)
            .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        Ok(self.inner.hydrate(&name, &info, only_modules.as_deref()))
    }

    /// The build-info wire-format version this binding reads/writes. The JS
    /// `buildInfo.validate` compares an artifact's `schemaVersion` against it.
    #[napi(js_name = buildInfoSchemaVersion)]
    #[must_use]
    pub fn build_info_schema_version(&self) -> u32 {
        pandacss_project::SCHEMA_VERSION
    }
}
