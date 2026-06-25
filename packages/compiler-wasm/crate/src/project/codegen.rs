use super::WasmCompiler;

use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use pandacss_codegen::{Artifact, ArtifactId, ConfigDependency, DependencySet, GenerateOptions};
use pandacss_config::UserConfig;
use pandacss_fs::PathSystem;

use super::interop::parse_required_options;
use super::serde_types::{
    CodegenArtifactSerde, CodegenFileSerde, GenerateArtifactOptionsSerde,
    WriteArtifactsOptionsSerde,
};

/*
 * Codegen entrypoints.
 */
#[wasm_bindgen]
impl WasmCompiler {
    /// Generate artifacts and write them under `outdir`.
    ///
    /// # Errors
    /// Returns a JS error if writing or serializing fails.
    #[wasm_bindgen(js_name = writeArtifacts)]
    pub fn write_artifacts(&self, options: JsValue) -> Result<JsValue, JsValue> {
        let options: WriteArtifactsOptionsSerde =
            parse_required_options(options, "writeArtifacts")?;
        let artifacts = if let Some(artifacts) = options.artifacts {
            artifacts
        } else {
            self.inner
                .generate_artifacts(
                    &self.user_config,
                    generate_options(
                        &self.user_config,
                        &GenerateArtifactOptionsSerde {
                            force_import_extension: options.force_import_extension,
                        },
                    ),
                )
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
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        written
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

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

/*
 * Codegen boundary conversion.
 */
fn generate_artifact_options_from_js(
    options: &JsValue,
) -> Result<GenerateArtifactOptionsSerde, JsValue> {
    if options.is_undefined() || options.is_null() {
        return Ok(GenerateArtifactOptionsSerde::default());
    }
    serde_wasm_bindgen::from_value(options.clone())
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

fn serialize_codegen_artifacts(artifacts: Vec<Artifact>) -> Result<JsValue, JsValue> {
    let _span = tracing::trace_span!("boundary_encode", method = "codegen_artifacts").entered();
    let artifacts = artifacts
        .into_iter()
        .map(to_codegen_artifact)
        .collect::<Vec<_>>();
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    artifacts
        .serialize(&serializer)
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifactSerde {
    CodegenArtifactSerde {
        id: artifact.id.as_str().to_owned(),
        files: artifact
            .files
            .into_iter()
            .map(|file| CodegenFileSerde {
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

fn dependency_set_from_strings(dependencies: Vec<String>) -> Result<DependencySet, JsValue> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let dependency = dependency.parse::<ConfigDependency>().map_err(|()| {
            JsValue::from_str(&format!("unknown config dependency `{dependency}`"))
        })?;
        set = set.union(DependencySet::one(dependency));
    }
    Ok(set)
}

fn generate_options(
    user_config: &UserConfig,
    options: &GenerateArtifactOptionsSerde,
) -> GenerateOptions {
    let import_extensions = options
        .force_import_extension
        .unwrap_or(user_config.force_import_extension);

    GenerateOptions {
        format: user_config.out_extension,
        import_extensions,
    }
}
