//! CSS output orchestration over project state and the stylesheet emitter.

use std::collections::BTreeSet;
use std::sync::Arc;

use pandacss_config::UserConfig;
use pandacss_encoder::Atom;
use pandacss_shared::Diagnostic;
use pandacss_tokens::TokenDictionary;
use serde::Serialize;

use pandacss_project::{
    PatternTransformFn, Project, ProjectStylesheetSnapshots, UtilityTransformFn,
};

/// CSS emission overrides supplied by a host method.
#[derive(Clone, Default)]
pub struct CssOutputOptions {
    pub layers: Option<Vec<String>>,
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
    pub polyfill: Option<bool>,
}

/// Complete output returned by merged, layer, and keyframe compilation.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileOutput {
    pub css: String,
    pub source_map: Option<String>,
    pub manifest: CompileManifest,
    pub layer_ranges: CompileLayerRanges,
    pub diagnostics: Vec<Diagnostic>,
}

/// Inputs represented in a compiled stylesheet.
#[derive(Serialize)]
pub struct CompileManifest {
    pub files: Vec<CompileFileManifest>,
    pub tokens: Vec<String>,
}

/// Source hash used by hosts for output change detection.
#[derive(Serialize)]
pub struct CompileFileManifest {
    pub path: String,
    pub hash: String,
}

/// UTF-8 byte ranges for the five top-level Panda layers.
#[derive(Serialize)]
pub struct CompileLayerRanges {
    pub reset: Option<CompileLayerRange>,
    pub base: Option<CompileLayerRange>,
    pub tokens: Option<CompileLayerRange>,
    pub recipes: Option<CompileLayerRange>,
    pub utilities: Option<CompileLayerRange>,
}

/// One UTF-8 byte range in the compiled CSS string.
#[derive(Serialize)]
pub struct CompileLayerRange {
    pub start: u32,
    pub end: u32,
}

/// One file in a split stylesheet output set.
#[derive(Serialize)]
pub struct SplitCssFile {
    pub path: String,
    pub code: String,
}

/// Complete split stylesheet output.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitCssOutput {
    pub files: Vec<SplitCssFile>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Compile the complete project stylesheet.
#[must_use]
pub fn compile_css(
    project: &mut Project,
    user_config: &UserConfig,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
    utility_transform: Option<&mut UtilityTransformFn<'_>>,
    options: &CssOutputOptions,
) -> CompileOutput {
    let (static_pattern_atoms, static_pattern_diagnostics) =
        project.static_pattern_atoms(user_config, pattern_transform);
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        &static_pattern_atoms,
        utility_transform,
        options,
        options.emit_layer_declaration.unwrap_or(true),
    );
    CompileOutput {
        css: output.css,
        source_map: output.source_map,
        manifest,
        layer_ranges: layer_ranges_from(&output.layer_ranges),
        diagnostics: collect_output_diagnostics(
            project,
            static_pattern_diagnostics,
            output.diagnostics,
        ),
    }
}

/// Compile only theme and inline keyframes.
#[must_use]
pub fn compile_keyframes(
    project: &mut Project,
    user_config: &UserConfig,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
    utility_transform: Option<&mut UtilityTransformFn<'_>>,
    options: &CssOutputOptions,
) -> CompileOutput {
    let (static_pattern_atoms, static_pattern_diagnostics) =
        project.static_pattern_atoms(user_config, pattern_transform);
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest(project, token_dictionary.as_ref());
    let snapshots = stylesheet_snapshots(project, user_config, utility_transform);
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
            position_try: snapshots.position_try,
            inline_keyframes: snapshots.inline_keyframes,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &stylesheet_options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    CompileOutput {
        css: output.css,
        source_map: output.source_map,
        manifest,
        layer_ranges: empty_layer_ranges(),
        diagnostics: collect_output_diagnostics(
            project,
            static_pattern_diagnostics,
            snapshot_diagnostics,
        ),
    }
}

/// Compile a selected set of top-level cascade layers.
#[must_use]
pub fn compile_layers(
    project: &mut Project,
    user_config: &UserConfig,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
    utility_transform: Option<&mut UtilityTransformFn<'_>>,
    options: &CssOutputOptions,
) -> CompileOutput {
    let (static_pattern_atoms, static_pattern_diagnostics) =
        project.static_pattern_atoms(user_config, pattern_transform);
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        &static_pattern_atoms,
        utility_transform,
        options,
        false,
    );
    let selected: Vec<pandacss_stylesheet::StylesheetLayer> = options
        .layers
        .as_deref()
        .unwrap_or_default()
        .iter()
        .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
        .collect();
    let mut css = output.get_layer_css(&selected);
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill);
    if options.emit_layer_declaration.unwrap_or(false) && !polyfill {
        let preamble =
            pandacss_stylesheet::layer_order_declaration(&user_config.layers, Some(&selected));
        if !preamble.is_empty() {
            css.insert_str(0, &format!("{preamble}\n"));
        }
    }
    CompileOutput {
        css,
        source_map: output.source_map,
        manifest,
        layer_ranges: empty_layer_ranges(),
        diagnostics: collect_output_diagnostics(
            project,
            static_pattern_diagnostics,
            output.diagnostics,
        ),
    }
}

/// Compile the project into per-layer and per-recipe stylesheet files.
#[must_use]
pub fn compile_split_css(
    project: &mut Project,
    user_config: &UserConfig,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
    utility_transform: Option<&mut UtilityTransformFn<'_>>,
    options: &CssOutputOptions,
) -> SplitCssOutput {
    let (static_pattern_atoms, static_pattern_diagnostics) =
        project.static_pattern_atoms(user_config, pattern_transform);
    let token_dictionary = project.config().token_dictionary();
    let snapshots = stylesheet_snapshots(project, user_config, utility_transform);
    let selected_layers = options.layers.as_ref().map(|layers| {
        layers
            .iter()
            .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
            .collect::<Vec<_>>()
    });
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill);
    let stylesheet_options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(user_config, options.minify),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: options.emit_layer_declaration.unwrap_or(true) && !polyfill,
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
            position_try: snapshots.position_try,
            inline_keyframes: snapshots.inline_keyframes,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &stylesheet_options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    SplitCssOutput {
        files: output
            .files
            .into_iter()
            .map(|file| SplitCssFile {
                path: file.path,
                code: file.code,
            })
            .collect(),
        diagnostics: collect_output_diagnostics(
            project,
            static_pattern_diagnostics,
            snapshot_diagnostics,
        ),
    }
}

fn stylesheet_snapshots<'a>(
    project: &'a mut Project,
    user_config: &UserConfig,
    utility_transform: Option<&mut UtilityTransformFn<'_>>,
) -> ProjectStylesheetSnapshots<'a> {
    if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    }
}

fn build_stylesheet_output(
    project: &mut Project,
    user_config: &UserConfig,
    token_dictionary: Option<Arc<TokenDictionary>>,
    static_pattern_atoms: &[Atom],
    utility_transform: Option<&mut UtilityTransformFn<'_>>,
    options: &CssOutputOptions,
    emit_layer_declaration: bool,
) -> pandacss_stylesheet::StylesheetOutput {
    let span =
        tracing::trace_span!(target: "css", "stylesheet", atom_count = tracing::field::Empty);
    let _entered = span.enter();
    let snapshots = stylesheet_snapshots(project, user_config, utility_transform);
    span.record("atom_count", snapshots.atoms.len());
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill);
    let stylesheet_options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(user_config, options.minify),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: emit_layer_declaration && !polyfill,
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
            position_try: snapshots.position_try,
            inline_keyframes: snapshots.inline_keyframes,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &stylesheet_options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    output.diagnostics = snapshot_diagnostics;
    output
}

fn collect_output_diagnostics(
    project: &Project,
    static_pattern_diagnostics: Vec<Diagnostic>,
    stylesheet_diagnostics: Vec<Diagnostic>,
) -> Vec<Diagnostic> {
    project
        .diagnostics()
        .iter()
        .cloned()
        .chain(project.file_diagnostics().into_iter().cloned())
        .chain(static_pattern_diagnostics)
        .chain(stylesheet_diagnostics)
        .collect()
}

fn compile_manifest(
    project: &Project,
    token_dictionary: Option<&Arc<TokenDictionary>>,
) -> CompileManifest {
    let span = tracing::trace_span!(target: "css", "manifest", file_count = tracing::field::Empty);
    let _entered = span.enter();
    let files: Vec<CompileFileManifest> = project
        .file_manifest()
        .into_iter()
        .map(|(path, hash)| CompileFileManifest {
            path: path.as_ref().to_owned(),
            hash: format!("{hash:016x}"),
        })
        .collect();
    span.record("file_count", files.len());
    let tokens = token_dictionary.map_or_else(Vec::new, |dict| {
        let mut paths = BTreeSet::new();
        for token in dict.iter() {
            paths.insert(token.path.to_string());
        }
        paths.into_iter().collect()
    });
    CompileManifest { files, tokens }
}

fn empty_layer_ranges() -> CompileLayerRanges {
    CompileLayerRanges {
        reset: None,
        base: None,
        tokens: None,
        recipes: None,
        utilities: None,
    }
}

fn layer_ranges_from(ranges: &pandacss_stylesheet::StylesheetLayerRanges) -> CompileLayerRanges {
    CompileLayerRanges {
        reset: ranges.reset.as_ref().map(to_compile_range),
        base: ranges.base.as_ref().map(to_compile_range),
        tokens: ranges.tokens.as_ref().map(to_compile_range),
        recipes: ranges.recipes.as_ref().map(to_compile_range),
        utilities: ranges.utilities.as_ref().map(to_compile_range),
    }
}

fn to_compile_range(range: &std::ops::Range<usize>) -> CompileLayerRange {
    CompileLayerRange {
        start: u32::try_from(range.start).unwrap_or(u32::MAX),
        end: u32::try_from(range.end).unwrap_or(u32::MAX),
    }
}
