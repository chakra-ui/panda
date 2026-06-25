use super::WasmCompiler;

use pandacss_encoder::Atom as CoreAtom;
use pandacss_fs::{FileSystem, PathSystem};
use serde::Serialize as _;
use std::collections::BTreeSet;
use std::path::Path;
use std::sync::Arc;
use wasm_bindgen::prelude::*;

use super::interop::{
    compile_options_from_js, css_output_options_from_js, parse_required_options,
    write_css_options_from_js, write_split_css_options_from_js,
};
use super::serde_types::{
    CompileFileManifestSerde, CompileLayerRangeSerde, CompileLayerRangesSerde,
    CompileManifestSerde, CompileOutputSerde, CssOutputOptionsSerde, LayerCssOptionsSerde,
    SplitCssFileSerde, WriteCssResultSerde, WriteFilesResultSerde,
};

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

/*
 * CSS output assembly.
 */
fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    emit_layer_declaration: bool,
    minify_override: Option<bool>,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        emit_layer_declaration,
        minify_override,
    );
    let diagnostics = project
        .diagnostics()
        .iter()
        .cloned()
        .chain(static_pattern_diagnostics)
        .chain(output.diagnostics)
        .collect();
    CompileOutputSerde {
        css: output.css,
        source_map: output.source_map,
        manifest,
        layer_ranges: layer_ranges_from(&output.layer_ranges),
        diagnostics,
    }
}

fn build_layer_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    options: &LayerCssOptionsSerde,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        false,
        options.minify,
    );
    let selected: Vec<_> = options
        .layers
        .iter()
        .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
        .collect();
    let mut css = output.get_layer_css(&selected);
    if options.emit_layer_declaration.unwrap_or(false) {
        let preamble =
            pandacss_stylesheet::layer_order_declaration(&user_config.layers, Some(&selected));
        if !preamble.is_empty() {
            css.insert_str(0, &format!("{preamble}\n"));
        }
    }
    let diagnostics = project
        .diagnostics()
        .iter()
        .cloned()
        .chain(static_pattern_diagnostics)
        .chain(output.diagnostics)
        .collect();
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
    css_options: &CssOutputOptionsSerde,
) -> Vec<SplitCssFileSerde> {
    let token_dictionary = project.config().token_dictionary();
    let snapshots = project.stylesheet_snapshots(user_config);
    let selected_layers = css_options.layers.as_ref().map(|layers| {
        layers
            .iter()
            .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
            .collect::<Vec<_>>()
    });
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: resolve_minify(user_config, css_options.minify),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: css_options.emit_layer_declaration.unwrap_or(true),
        layers: selected_layers,
    };
    pandacss_stylesheet::split_css(
        &pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
    .into_iter()
    .map(|file| SplitCssFileSerde {
        path: file.path,
        code: file.code,
    })
    .collect()
}

fn build_stylesheet_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    token_dictionary: Option<Arc<pandacss_tokens::TokenDictionary>>,
    static_pattern_atoms: &[CoreAtom],
    emit_layer_declaration: bool,
    minify_override: Option<bool>,
) -> pandacss_stylesheet::StylesheetOutput {
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: resolve_minify(user_config, minify_override),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration,
        layers: None,
    };
    pandacss_stylesheet::compile(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
}

fn resolve_minify(
    user_config: &pandacss_config::UserConfig,
    minify_override: Option<bool>,
) -> bool {
    minify_override.unwrap_or_else(|| {
        user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false)
    })
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
