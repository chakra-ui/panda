use super::{
    CodegenArtifact, CodegenFile, Compiler, GenerateArtifactOptions, WriteArtifactsOptions,
};

use napi_derive::napi;
use pandacss_codegen::{Artifact, ArtifactId, ConfigDependency, DependencySet, GenerateOptions};
use pandacss_config::UserConfig;
use pandacss_fs::PathSystem;

/*
 * Codegen entrypoints.
 */
#[napi]
impl Compiler {
    /// Generate artifacts and write them under `outdir`.
    ///
    /// # Errors
    /// Returns an error if a file fails to write.
    #[napi(js_name = writeArtifacts)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_artifacts(&self, options: WriteArtifactsOptions) -> napi::Result<Vec<String>> {
        let artifacts = if let Some(artifacts) = options.artifacts {
            artifacts
        } else {
            let generate = generate_options(
                &self.user_config,
                Some(GenerateArtifactOptions {
                    force_import_extension: options.force_import_extension,
                }),
            );
            self.inner
                .generate_artifacts(&self.user_config, generate)
                .into_iter()
                .map(to_codegen_artifact)
                .collect()
        };
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

/*
 * Codegen boundary conversion.
 */
fn generate_options(
    user_config: &UserConfig,
    options: Option<GenerateArtifactOptions>,
) -> GenerateOptions {
    let import_extensions = options
        .and_then(|options| options.force_import_extension)
        .unwrap_or(user_config.force_import_extension);

    GenerateOptions {
        format: user_config.out_extension,
        import_extensions,
    }
}

fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifact {
    CodegenArtifact {
        id: artifact.id.as_str().to_owned(),
        files: artifact
            .files
            .into_iter()
            .map(|file| CodegenFile {
                path: file.path,
                code: file.code,
                dependencies: dependency_names(file.dependencies),
            })
            .collect(),
    }
}

fn dependency_names(dependencies: DependencySet) -> Vec<String> {
    dependencies
        .to_vec()
        .into_iter()
        .map(|dependency| dependency.as_str().to_owned())
        .collect()
}

fn dependency_set_from_strings(dependencies: Vec<String>) -> napi::Result<DependencySet> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let dependency = dependency.parse::<ConfigDependency>().map_err(|()| {
            napi::Error::from_reason(format!("unknown config dependency `{dependency}`"))
        })?;
        set = set.union(DependencySet::one(dependency));
    }
    Ok(set)
}
