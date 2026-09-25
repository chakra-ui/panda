use super::WasmCompiler;

use wasm_bindgen::prelude::*;

use pandacss_fs::PathSystem;

use super::interop::parse_required_options;
use super::serde_types::{
    CodegenArtifactSerde, CodegenFileSerde, GenerateArtifactOptionsSerde,
    WriteArtifactsOptionsSerde,
};

#[wasm_bindgen]
impl WasmCompiler {
    /// Generate artifacts and write them under `outdir`.
    #[wasm_bindgen(js_name = writeArtifacts)]
    pub fn write_artifacts(&self, options: JsValue) -> Result<JsValue, JsValue> {
        let options: WriteArtifactsOptionsSerde =
            parse_required_options(options, "writeArtifacts")?;
        let artifacts = options.artifacts.unwrap_or_else(|| {
            pandacss_compiler::generate_artifacts(
                &self.inner,
                &self.user_config,
                pandacss_compiler::GenerateArtifactOptions {
                    force_import_extension: options.force_import_extension,
                    overlay: options.overlay,
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
        serialize(&written)
    }

    /// Generate every codegen artifact from the resolved project state.
    #[wasm_bindgen(js_name = generateArtifacts)]
    pub fn generate_artifacts(&self, options: &JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("codegen", method = "wasm_generate_artifacts").entered();
        let options = generate_artifact_options_from_js(options)?;
        let artifacts =
            pandacss_compiler::generate_artifacts(&self.inner, &self.user_config, options);
        serialize(&artifacts)
    }

    /// Generate one codegen artifact by id.
    #[wasm_bindgen(js_name = generateArtifact)]
    pub fn generate_artifact(&self, id: &str, options: &JsValue) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("codegen", method = "wasm_generate_artifact", id).entered();
        let artifact = pandacss_compiler::generate_artifact(
            &self.inner,
            &self.user_config,
            id,
            generate_artifact_options_from_js(options)?,
        )
        .map_err(|err| JsValue::from_str(&err.to_string()))?;
        serialize(&artifact)
    }

    /// Generate artifacts affected by the provided config dependency names.
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
        let artifacts = pandacss_compiler::generate_affected_artifacts(
            &self.inner,
            &self.user_config,
            &dependencies,
            generate_artifact_options_from_js(options)?,
        )
        .map_err(|err| JsValue::from_str(&err.to_string()))?;
        serialize(&artifacts)
    }
}

fn generate_artifact_options_from_js(
    options: &JsValue,
) -> Result<GenerateArtifactOptionsSerde, JsValue> {
    if options.is_undefined() || options.is_null() {
        return Ok(GenerateArtifactOptionsSerde::default());
    }
    serde_wasm_bindgen::from_value(options.clone())
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

fn serialize(value: &impl serde::Serialize) -> Result<JsValue, JsValue> {
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    value
        .serialize(&serializer)
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

impl From<pandacss_compiler::CodegenArtifact> for CodegenArtifactSerde {
    fn from(artifact: pandacss_compiler::CodegenArtifact) -> Self {
        Self {
            id: artifact.id,
            files: artifact.files.into_iter().map(Into::into).collect(),
        }
    }
}

impl From<pandacss_compiler::CodegenFile> for CodegenFileSerde {
    fn from(file: pandacss_compiler::CodegenFile) -> Self {
        Self {
            path: file.path,
            code: file.code,
            dependencies: file.dependencies,
        }
    }
}
