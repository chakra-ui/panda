use super::WasmCompiler;
use super::transforms::{apply_pattern_transform, apply_utility_transform};

use pandacss_fs::{FileSystem, PathSystem};
use pandacss_literal::Literal;
use serde::Serialize as _;
use std::path::Path;
use wasm_bindgen::prelude::*;

use super::interop::{
    compile_options_from_js, css_output_options_from_js, parse_required_options,
    write_css_options_from_js, write_layer_css_options_from_js, write_split_css_options_from_js,
};
use super::serde_types::{
    CssOutputOptionsSerde, LayerCssOptionsSerde, WriteCssResultSerde, WriteSplitCssResultSerde,
};

fn with_stylesheet_transforms<R>(
    compiler: &mut WasmCompiler,
    build: impl FnOnce(
        &mut pandacss_project::Project,
        &pandacss_config::UserConfig,
        Option<&mut pandacss_project::PatternTransformFn<'_>>,
        Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    ) -> R,
) -> R {
    let has_pattern_transforms = compiler.callbacks.has_pattern_transforms();
    let has_utility_transforms = compiler.callbacks.has_utility_transforms();
    let WasmCompiler {
        inner,
        user_config,
        callbacks,
        ..
    } = compiler;
    let pattern_refs = &callbacks.pattern_transform_refs;
    let pattern_callbacks = &callbacks.pattern_transforms;
    let pattern_cache = &mut callbacks.transform_cache.pattern;
    let utility_refs = &callbacks.utility_transform_refs;
    let utility_callbacks = &callbacks.utility_transforms;
    let utility_cache = &mut callbacks.transform_cache.utility;
    let mut pattern_transform = |name: &str, styles: &Literal| {
        apply_pattern_transform(name, styles, pattern_refs, pattern_callbacks, pattern_cache)
    };
    let mut utility_transform =
        |prop: &str,
         resolved: &pandacss_encoder::AtomValue,
         original: &pandacss_encoder::AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                utility_refs,
                utility_callbacks,
                utility_cache,
            )
        };
    build(
        inner,
        user_config,
        has_pattern_transforms
            .then_some(&mut pattern_transform as &mut pandacss_project::PatternTransformFn<'_>),
        has_utility_transforms
            .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
    )
}

/*
 * Shared file-writing helpers for CSS and codegen outputs.
 */
#[wasm_bindgen]
impl WasmCompiler {
    pub(super) fn write_relative_files<'a>(
        &self,
        root: &str,
        files: impl IntoIterator<Item = (&'a str, &'a str)>,
        label: &str,
    ) -> Result<Vec<String>, JsValue> {
        let mut written = Vec::new();
        for (path, code) in files {
            if !self.paths.is_safe_relative(path) {
                return Err(JsValue::from_str(&format!(
                    "{label} output path must be a contained relative path: {path}"
                )));
            }
            let target = self.paths.join(&[root, path]);
            self.write_target_file(&target, code)?;
            written.push(target);
        }
        Ok(written)
    }

    pub(super) fn write_target_file(&self, target: &str, code: &str) -> Result<(), JsValue> {
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

    /*
     * CSS compile/write entrypoints.
     */
    /// Compile to CSS. Mirrors the NAPI `Project.compile()`.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn compile(&mut self, options: Option<JsValue>) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_project_compile").entered();
        let options = compile_options_from_js(options)?;
        let output = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_css(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: None,
                        emit_layer_declaration: options.emit_layer_declaration,
                        minify: options.minify,
                        polyfill: options.polyfill,
                    },
                )
            },
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeCss)]
    pub fn write_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_write_css").entered();
        let options = write_css_options_from_js(options)?;
        let output = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_css(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: None,
                        emit_layer_declaration: options.emit_layer_declaration,
                        minify: options.minify,
                        polyfill: options.polyfill,
                    },
                )
            },
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

    /// Theme `@keyframes` CSS only (no token vars or other layers).
    #[wasm_bindgen(js_name = getKeyframeCss)]
    pub fn get_keyframe_css(&mut self, options: Option<JsValue>) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("get_keyframe_css", method = "wasm").entered();
        let options = compile_options_from_js(options)?;
        let output = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_keyframes(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: None,
                        emit_layer_declaration: options.emit_layer_declaration,
                        minify: options.minify,
                        polyfill: options.polyfill,
                    },
                )
            },
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// CSS for the named cascade layers, concatenated in order. Sliced in Rust
    /// (byte offsets stay valid); unknown layer names are skipped.
    #[wasm_bindgen(js_name = getLayerCss)]
    pub fn get_layer_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("get_layer_css", method = "wasm").entered();
        let options: LayerCssOptionsSerde = parse_required_options(options, "getLayerCss")?;
        let output = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_layers(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: Some(options.layers),
                        emit_layer_declaration: options.emit_layer_declaration,
                        minify: options.minify,
                        polyfill: options.polyfill,
                    },
                )
            },
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeLayerCss)]
    pub fn write_layer_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("get_layer_css", method = "wasm_write_layer_css").entered();
        let options = write_layer_css_options_from_js(options)?;
        let layer_options = LayerCssOptionsSerde {
            layers: options.layers,
            emit_layer_declaration: options.emit_layer_declaration,
            minify: options.minify,
            polyfill: options.polyfill,
        };
        let output = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_layers(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: Some(layer_options.layers),
                        emit_layer_declaration: layer_options.emit_layer_declaration,
                        minify: layer_options.minify,
                        polyfill: layer_options.polyfill,
                    },
                )
            },
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

    /// Split the stylesheet into per-file outputs (one per layer + per recipe,
    /// plus `recipes.css` / `styles.css` index files) for `--splitting`.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = getSplitCss)]
    pub fn get_split_css(&mut self, options: Option<JsValue>) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("get_split_css", method = "wasm").entered();
        let options = css_output_options_from_js(options, "getSplitCss")?;
        let result = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_split_css(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: options.layers,
                        emit_layer_declaration: options.emit_layer_declaration,
                        minify: options.minify,
                        polyfill: options.polyfill,
                    },
                )
            },
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeSplitCss)]
    pub fn write_split_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("split_css", method = "wasm_write_split_css").entered();
        let options = write_split_css_options_from_js(options)?;
        let css_options = CssOutputOptionsSerde {
            layers: options.layers.clone(),
            emit_layer_declaration: options.emit_layer_declaration,
            minify: options.minify,
            polyfill: options.polyfill,
        };
        let result = with_stylesheet_transforms(
            self,
            |project, user_config, pattern_transform, utility_transform| {
                pandacss_compiler::compile_split_css(
                    project,
                    user_config,
                    pattern_transform,
                    utility_transform,
                    &pandacss_compiler::CssOutputOptions {
                        layers: css_options.layers,
                        emit_layer_declaration: css_options.emit_layer_declaration,
                        minify: css_options.minify,
                        polyfill: css_options.polyfill,
                    },
                )
            },
        );
        let files = result.files;
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let outdir = options
            .outdir
            .unwrap_or_else(|| self.user_config.outdir.clone());
        let root = self.paths.resolve(&cwd, &outdir);
        let paths = self.write_relative_files(
            &root,
            files
                .iter()
                .map(|file| (file.path.as_str(), file.code.as_str())),
            "split css",
        )?;
        let result = WriteSplitCssResultSerde {
            root,
            paths,
            files,
            diagnostics: result.diagnostics,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }
}
