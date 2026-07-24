use super::WasmCompiler;
use super::transforms::apply_utility_transform;

use pandacss_encoder::Atom as CoreAtom;
use pandacss_fs::{FileSystem, PathSystem};
use serde::Serialize as _;
use std::collections::BTreeSet;
use std::path::Path;
use std::sync::Arc;
use wasm_bindgen::prelude::*;

use super::interop::{
    compile_options_from_js, css_output_options_from_js, parse_required_options,
    write_css_options_from_js, write_layer_css_options_from_js, write_split_css_options_from_js,
};
use super::serde_types::{
    CompileFileManifestSerde, CompileLayerRangeSerde, CompileLayerRangesSerde,
    CompileManifestSerde, CompileOptionsSerde, CompileOutputSerde, CssOutputOptionsSerde,
    LayerCssOptionsSerde, SplitCssFileSerde, SplitCssResultSerde, WriteCssResultSerde,
    WriteSplitCssResultSerde,
};

fn with_stylesheet_utility_transform<R>(
    compiler: &mut WasmCompiler,
    build: impl FnOnce(
        &mut pandacss_project::Project,
        &pandacss_config::UserConfig,
        Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    ) -> R,
) -> R {
    let has_utility_transforms = compiler.callbacks.has_utility_transforms();
    let WasmCompiler {
        inner,
        user_config,
        callbacks,
        ..
    } = compiler;
    if !has_utility_transforms {
        return build(inner, user_config, None);
    }

    let utility_cache = &mut callbacks.transform_cache.utility;
    let mut utility_transform =
        |prop: &str,
         resolved: &pandacss_encoder::AtomValue,
         original: &pandacss_encoder::AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
            )
        };
    build(inner, user_config, Some(&mut utility_transform))
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
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let options = compile_options_from_js(options)?;
        let output =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_compile_output(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    StylesheetEmitOptions {
                        emit_layer_declaration: options.emit_layer_declaration.unwrap_or(true),
                        minify_override: options.minify,
                        polyfill_override: options.polyfill,
                    },
                )
            });
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
        let output =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_compile_output(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    StylesheetEmitOptions {
                        emit_layer_declaration: options.emit_layer_declaration.unwrap_or(true),
                        minify_override: options.minify,
                        polyfill_override: options.polyfill,
                    },
                )
            });
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
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let options = compile_options_from_js(options)?;
        let output =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_keyframes_compile_output(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    &options,
                )
            });
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
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let output =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_layer_compile_output(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    &options,
                )
            });
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
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let output =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_layer_compile_output(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    &layer_options,
                )
            });
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
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let result =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_split_css(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    &options,
                )
            });
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeSplitCss)]
    pub fn write_split_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("split_css", method = "wasm_write_split_css").entered();
        let options = write_split_css_options_from_js(options)?;
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let css_options = CssOutputOptionsSerde {
            layers: options.layers.clone(),
            emit_layer_declaration: options.emit_layer_declaration,
            minify: options.minify,
            polyfill: options.polyfill,
        };
        let result =
            with_stylesheet_utility_transform(self, |project, user_config, utility_transform| {
                build_split_css(
                    project,
                    user_config,
                    &static_pattern_atoms,
                    static_pattern_diagnostics,
                    utility_transform,
                    &css_options,
                )
            });
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

/*
 * CSS output assembly.
 */
#[derive(Clone, Copy)]
struct StylesheetEmitOptions {
    emit_layer_declaration: bool,
    minify_override: Option<bool>,
    polyfill_override: Option<bool>,
}

fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: StylesheetEmitOptions,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        utility_transform,
        options,
    );
    let diagnostics =
        collect_output_diagnostics(project, static_pattern_diagnostics, output.diagnostics);
    CompileOutputSerde {
        css: output.css,
        source_map: output.source_map,
        manifest,
        layer_ranges: layer_ranges_from(&output.layer_ranges),
        diagnostics,
    }
}

fn build_keyframes_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: &CompileOptionsSerde,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let snapshots = if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    };
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill);
    let stylesheet_options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(user_config, options.minify),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: options.emit_layer_declaration.unwrap_or(true),
        polyfill,
        layers: None,
    };
    let mut snapshot_diagnostics = snapshots.diagnostics;
    let mut output = pandacss_stylesheet::compile_keyframes(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            view_transitions: snapshots.view_transitions,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &stylesheet_options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    let diagnostics =
        collect_output_diagnostics(project, static_pattern_diagnostics, snapshot_diagnostics);
    CompileOutputSerde {
        css: output.css,
        source_map: output.source_map,
        manifest,
        layer_ranges: empty_layer_ranges(),
        diagnostics,
    }
}

fn build_layer_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: &LayerCssOptionsSerde,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill);
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        utility_transform,
        StylesheetEmitOptions {
            emit_layer_declaration: false,
            minify_override: options.minify,
            polyfill_override: options.polyfill,
        },
    );
    let selected: Vec<_> = options
        .layers
        .iter()
        .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
        .collect();
    let mut css = output.get_layer_css(&selected);
    if options.emit_layer_declaration.unwrap_or(false) && !polyfill {
        let preamble =
            pandacss_stylesheet::layer_order_declaration(&user_config.layers, Some(&selected));
        if !preamble.is_empty() {
            css.insert_str(0, &format!("{preamble}\n"));
        }
    }
    let diagnostics =
        collect_output_diagnostics(project, static_pattern_diagnostics, output.diagnostics);
    CompileOutputSerde {
        css,
        source_map: output.source_map,
        manifest,
        layer_ranges: empty_layer_ranges(),
        diagnostics,
    }
}

fn build_split_css(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    css_options: &CssOutputOptionsSerde,
) -> SplitCssResultSerde {
    let token_dictionary = project.config().token_dictionary();
    let snapshots = if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    };
    let selected_layers = css_options.layers.as_ref().map(|layers| {
        layers
            .iter()
            .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
            .collect::<Vec<_>>()
    });
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, css_options.polyfill);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(user_config, css_options.minify),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: css_options.emit_layer_declaration.unwrap_or(true) && !polyfill,
        polyfill,
        layers: selected_layers,
    };
    let mut snapshot_diagnostics = snapshots.diagnostics;
    let mut output = pandacss_stylesheet::split_css(
        &pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            view_transitions: snapshots.view_transitions,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    let files = output
        .files
        .into_iter()
        .map(|file| SplitCssFileSerde {
            path: file.path,
            code: file.code,
        })
        .collect();
    let diagnostics =
        collect_output_diagnostics(project, static_pattern_diagnostics, snapshot_diagnostics);
    SplitCssResultSerde { files, diagnostics }
}

fn collect_output_diagnostics(
    project: &pandacss_project::Project,
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    stylesheet_diagnostics: Vec<pandacss_shared::Diagnostic>,
) -> Vec<pandacss_shared::Diagnostic> {
    project
        .diagnostics()
        .iter()
        .cloned()
        .chain(project.file_diagnostics().into_iter().cloned())
        .chain(static_pattern_diagnostics)
        .chain(stylesheet_diagnostics)
        .collect()
}

fn build_stylesheet_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    token_dictionary: Option<Arc<pandacss_tokens::TokenDictionary>>,
    static_pattern_atoms: &[CoreAtom],
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: StylesheetEmitOptions,
) -> pandacss_stylesheet::StylesheetOutput {
    let snapshots = if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    };
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill_override);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(user_config, options.minify_override),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: options.emit_layer_declaration && !polyfill,
        polyfill,
        layers: None,
    };
    let mut snapshot_diagnostics = snapshots.diagnostics;
    let mut output = pandacss_stylesheet::compile(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            view_transitions: snapshots.view_transitions,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    output.diagnostics = snapshot_diagnostics;
    output
}

/*
 * Compile output serialization.
 */
fn compile_manifest_serde(
    project: &pandacss_project::Project,
    token_dictionary: Option<&Arc<pandacss_tokens::TokenDictionary>>,
) -> CompileManifestSerde {
    let files = project
        .file_manifest()
        .into_iter()
        .map(|(path, hash)| CompileFileManifestSerde {
            path: path.as_ref().to_owned(),
            hash: format!("{hash:016x}"),
        })
        .collect();
    let tokens = token_dictionary.map_or_else(Vec::new, |dict| {
        let mut paths = BTreeSet::new();
        for token in dict.iter() {
            paths.insert(token.path.to_string());
        }
        paths.into_iter().collect()
    });
    CompileManifestSerde { files, tokens }
}

fn empty_layer_ranges() -> CompileLayerRangesSerde {
    CompileLayerRangesSerde {
        reset: None,
        base: None,
        tokens: None,
        recipes: None,
        utilities: None,
    }
}

fn layer_ranges_from(
    ranges: &pandacss_stylesheet::StylesheetLayerRanges,
) -> CompileLayerRangesSerde {
    CompileLayerRangesSerde {
        reset: ranges.reset.as_ref().map(to_serde_range),
        base: ranges.base.as_ref().map(to_serde_range),
        tokens: ranges.tokens.as_ref().map(to_serde_range),
        recipes: ranges.recipes.as_ref().map(to_serde_range),
        utilities: ranges.utilities.as_ref().map(to_serde_range),
    }
}

fn to_serde_range(range: &std::ops::Range<usize>) -> CompileLayerRangeSerde {
    CompileLayerRangeSerde {
        start: u32::try_from(range.start).unwrap_or(u32::MAX),
        end: u32::try_from(range.end).unwrap_or(u32::MAX),
    }
}
