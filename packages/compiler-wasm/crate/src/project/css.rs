use super::WasmCompiler;

use pandacss_fs::{FileSystem, PathSystem};
use serde::Serialize as _;
use std::path::Path;
use wasm_bindgen::prelude::*;

use super::serde_types::{
    CodegenArtifactSerde, CssOutputOptionsSerde, GenerateArtifactOptionsSerde,
    LayerCssOptionsSerde, WriteCssResultSerde, WriteFilesResultSerde,
};
use super::support::{
    build_compile_output, build_layer_compile_output, build_split_css, compile_options_from_js,
    css_output_options_from_js, generate_options, parse_required_options, to_codegen_artifact,
    write_artifacts_options_from_js, write_css_options_from_js, write_split_css_options_from_js,
};

#[wasm_bindgen]
impl WasmCompiler {
    fn write_relative_files<'a>(
        &self,
        root: &str,
        files: impl IntoIterator<Item = (&'a str, &'a str)>,
        label: &str,
    ) -> Result<Vec<String>, JsValue> {
        let mut written = Vec::new();
        for (path, code) in files {
            if self.paths.is_absolute(path) {
                return Err(JsValue::from_str(&format!(
                    "{label} output path must be relative: {path}"
                )));
            }
            let target = self.paths.join(&[root, path]);
            self.write_target_file(&target, code)?;
            written.push(target);
        }
        Ok(written)
    }

    fn write_artifacts_to_root(
        &self,
        root: &str,
        artifacts: &[CodegenArtifactSerde],
    ) -> Result<Vec<String>, JsValue> {
        let mut written = Vec::new();
        for artifact in artifacts {
            written.extend(
                self.write_relative_files(
                    root,
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

    fn write_target_file(&self, target: &str, code: &str) -> Result<(), JsValue> {
        let parent = self.paths.dirname(target);
        if !parent.is_empty() {
            self.fs
                .create_dir_all(Path::new(&parent))
                .map_err(|err| JsValue::from_str(&err.to_string()))?;
        }
        self.fs
            .write_if_changed(Path::new(target), code.as_bytes())
            .map(|_| ())
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Generate artifacts and write them under `outdir` via the in-memory fs.
    /// Returns the written paths.
    ///
    /// # Errors
    /// Returns a JS error if a file fails to write or results fail to serialize.
    #[wasm_bindgen(js_name = writeArtifacts)]
    pub fn write_artifacts(&self, options: JsValue) -> Result<JsValue, JsValue> {
        let options = write_artifacts_options_from_js(options)?;
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
        let base = self.paths.resolve(&cwd, &options.outdir);
        let written = self.write_artifacts_to_root(&base, &artifacts)?;
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        written
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Compile to CSS. Mirrors the NAPI `Project.compile()`.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn compile(&mut self, options: Option<JsValue>) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_project_compile").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let options = compile_options_from_js(options)?;
        let output = build_compile_output(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            options.emit_layer_declaration.unwrap_or(true),
            options.minify,
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeCss)]
    pub fn write_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_write_css").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let options = write_css_options_from_js(options)?;
        let output = build_compile_output(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            options.emit_layer_declaration.unwrap_or(true),
            options.minify,
        );
        let target = self.paths.resolve(
            &options.cwd.unwrap_or_else(|| self.user_config.cwd.clone()),
            &options.outfile,
        );
        self.write_target_file(&target, &output.css)?;

        let result = WriteCssResultSerde {
            path: target,
            css: output.css,
            source_map: output.source_map,
            manifest: output.manifest,
            layer_ranges: output.layer_ranges,
            diagnostics: output.diagnostics,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// CSS for the named cascade layers, concatenated in order. Sliced in Rust
    /// (byte offsets stay valid); unknown layer names are skipped.
    #[wasm_bindgen(js_name = getLayerCss)]
    pub fn get_layer_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("get_layer_css", method = "wasm").entered();
        let options: LayerCssOptionsSerde = parse_required_options(options, "getLayerCss")?;
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let output = build_layer_compile_output(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            &options,
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Split the stylesheet into per-file outputs (one per layer + per recipe,
    /// plus `recipes.css` / `styles.css` index files) for `--splitting`.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = getSplitCss)]
    pub fn get_split_css(&mut self, options: Option<JsValue>) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("get_split_css", method = "wasm").entered();
        let options = css_output_options_from_js(options, "getSplitCss")?;
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms();
        let files = build_split_css(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            &options,
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        files
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeSplitCss)]
    pub fn write_split_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("split_css", method = "wasm_write_split_css").entered();
        let options = write_split_css_options_from_js(options)?;
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms();
        let css_options = CssOutputOptionsSerde {
            layers: options.layers.clone(),
            emit_layer_declaration: options.emit_layer_declaration,
            minify: options.minify,
        };
        let files = build_split_css(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            &css_options,
        );
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let root = self.paths.resolve(&cwd, &options.outdir);
        let paths = self.write_relative_files(
            &root,
            files
                .iter()
                .map(|file| (file.path.as_str(), file.code.as_str())),
            "split css",
        )?;
        let result = WriteFilesResultSerde { root, paths, files };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }
}
