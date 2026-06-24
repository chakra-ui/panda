use super::support::{dependency_set_from_strings, generate_options, to_codegen_artifact};
use super::{CodegenArtifact, Compiler, GenerateArtifactOptions};

use napi_derive::napi;

use pandacss_codegen::ArtifactId;

#[napi]
impl Compiler {
    #[napi(js_name = generateArtifacts)]
    pub fn generate_artifacts(
        &self,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Vec<CodegenArtifact>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("codegen", method = "generate_artifacts").entered();
        let options = generate_options(&self.user_config, options);
        let artifacts = self
            .inner
            .generate_artifacts(&self.user_config, options)
            .into_iter()
            .map(to_codegen_artifact)
            .collect();
        crate::flush_tracing();
        Ok(artifacts)
    }

    #[napi(js_name = generateArtifact)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn generate_artifact(
        &self,
        id: String,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Option<CodegenArtifact>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("codegen", method = "generate_artifact", id).entered();
        let id = id
            .parse::<ArtifactId>()
            .map_err(|()| napi::Error::from_reason(format!("unknown codegen artifact `{id}`")))?;
        let options = generate_options(&self.user_config, options);
        let artifact = self
            .inner
            .generate_artifact(&self.user_config, id, options)
            .map(to_codegen_artifact);
        crate::flush_tracing();
        Ok(artifact)
    }

    #[napi(js_name = generateAffectedArtifacts)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn generate_affected_artifacts(
        &self,
        dependencies: Vec<String>,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Vec<CodegenArtifact>> {
        crate::init_tracing();
        let _span =
            tracing::trace_span!("codegen", method = "generate_affected_artifacts").entered();
        let changed = dependency_set_from_strings(dependencies)?;
        let options = generate_options(&self.user_config, options);
        let artifacts = self
            .inner
            .generate_affected_artifacts(&self.user_config, changed, options)
            .into_iter()
            .map(to_codegen_artifact)
            .collect();
        crate::flush_tracing();
        Ok(artifacts)
    }
}
