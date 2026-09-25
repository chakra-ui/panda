use super::{
    CodegenArtifact, CodegenFile, CodegenOverlay, Compiler, GenerateArtifactOptions,
    WriteArtifactsOptions,
};

use napi_derive::napi;
use pandacss_fs::PathSystem;

#[napi]
impl Compiler {
    /// Generate artifacts and write them under `outdir`.
    #[napi(js_name = writeArtifacts)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_artifacts(&self, options: WriteArtifactsOptions) -> napi::Result<Vec<String>> {
        let artifacts = options.artifacts.unwrap_or_else(|| {
            pandacss_compiler::generate_artifacts(
                &self.inner,
                &self.user_config,
                pandacss_compiler::GenerateArtifactOptions {
                    force_import_extension: options.force_import_extension,
                    overlay: options.overlay.map(to_core_overlay),
                },
            )
            .into_iter()
            .map(Into::into)
            .collect()
        });
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let root = self.paths.resolve(&cwd, &options.outdir);
        let mut written = Vec::new();
        for artifact in artifacts {
            written.extend(
                self.write_relative_files(
                    &root,
                    artifact
                        .files
                        .iter()
                        .map(|file| (file.path.as_str(), file.code.as_str())),
                    "artifact",
                )?,
            );
        }
        Ok(written)
    }

    #[napi(js_name = generateArtifacts)]
    pub fn generate_artifacts(
        &self,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Vec<CodegenArtifact>> {
        crate::init_tracing();
        let artifacts = pandacss_compiler::generate_artifacts(
            &self.inner,
            &self.user_config,
            core_options(options),
        )
        .into_iter()
        .map(Into::into)
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
        let artifact = pandacss_compiler::generate_artifact(
            &self.inner,
            &self.user_config,
            &id,
            core_options(options),
        )
        .map_err(napi::Error::from_reason)?
        .map(Into::into);
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
        let artifacts = pandacss_compiler::generate_affected_artifacts(
            &self.inner,
            &self.user_config,
            &dependencies,
            core_options(options),
        )
        .map_err(napi::Error::from_reason)?
        .into_iter()
        .map(Into::into)
        .collect();
        crate::flush_tracing();
        Ok(artifacts)
    }
}

fn core_options(
    options: Option<GenerateArtifactOptions>,
) -> pandacss_compiler::GenerateArtifactOptions {
    options.map_or_else(Default::default, |options| {
        pandacss_compiler::GenerateArtifactOptions {
            force_import_extension: options.force_import_extension,
            overlay: options.overlay.map(to_core_overlay),
        }
    })
}

fn to_core_overlay(overlay: CodegenOverlay) -> pandacss_compiler::CodegenOverlay {
    pandacss_compiler::CodegenOverlay {
        jsx: overlay.jsx,
        recipes: overlay.recipes,
        patterns: overlay.patterns,
        css: overlay.css,
        helpers: overlay.helpers,
        owned_recipes: overlay.owned_recipes,
        owned_patterns: overlay.owned_patterns,
        virtualize_helpers: overlay.virtualize_helpers,
        virtualize_css: overlay.virtualize_css,
    }
}

impl From<pandacss_compiler::CodegenArtifact> for CodegenArtifact {
    fn from(artifact: pandacss_compiler::CodegenArtifact) -> Self {
        Self {
            id: artifact.id,
            files: artifact.files.into_iter().map(Into::into).collect(),
        }
    }
}

impl From<pandacss_compiler::CodegenFile> for CodegenFile {
    fn from(file: pandacss_compiler::CodegenFile) -> Self {
        Self {
            path: file.path,
            code: file.code,
            dependencies: file.dependencies,
        }
    }
}
