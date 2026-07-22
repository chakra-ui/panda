use crate::{Diagnostic, DiagnosticSeverity};
use napi_derive::napi;
use pandacss_config::{
    UserConfig, ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_encoder::Atom as CoreAtom;
use pandacss_shared::diagnostic_codes;
use std::collections::BTreeSet;

#[napi(object)]
pub struct CompileInput {
    pub files: Option<Vec<InputFile>>,
    pub config: Option<serde_json::Value>,
    pub cwd: Option<String>,
    pub cache_dir: Option<String>,
    pub emit_layer_declaration: Option<bool>,
}

#[napi(object)]
#[derive(Default)]
pub struct CompileOptions {
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
    pub polyfill: Option<bool>,
}

impl CompileOptions {
    pub(crate) fn should_emit_layer_declaration(&self) -> bool {
        self.emit_layer_declaration.unwrap_or(true)
    }
}

#[napi(object)]
#[derive(Default)]
pub struct CssOutputOptions {
    pub layers: Option<Vec<String>>,
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
    pub polyfill: Option<bool>,
}

#[napi(object)]
pub struct LayerCssOptions {
    pub layers: Vec<String>,
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
    pub polyfill: Option<bool>,
}

#[napi(object)]
pub struct WriteLayerCssOptions {
    pub outfile: String,
    pub layers: Vec<String>,
    pub cwd: Option<String>,
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
    pub polyfill: Option<bool>,
}

#[napi(object)]
pub struct InputFile {
    pub path: String,
    pub content: String,
}

#[napi(object)]
pub struct CompileOutput {
    pub css: String,
    pub source_map: Option<String>,
    pub manifest: CompileManifest,
    pub layer_ranges: CompileLayerRanges,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi(object)]
pub struct CompileManifest {
    pub files: Vec<CompileFileManifest>,
    pub tokens: Vec<String>,
}

#[napi(object)]
pub struct CompileFileManifest {
    pub path: String,
    pub hash: String,
}

/// Byte slices into `CompileOutput.css` so callers can pull a single
/// layer without re-parsing. `None` when the layer wasn't emitted.
#[napi(object)]
pub struct CompileLayerRanges {
    pub reset: Option<CompileLayerRange>,
    pub base: Option<CompileLayerRange>,
    pub tokens: Option<CompileLayerRange>,
    pub recipes: Option<CompileLayerRange>,
    pub utilities: Option<CompileLayerRange>,
}

#[napi(object)]
pub struct CompileLayerRange {
    pub start: u32,
    pub end: u32,
}

/// One-shot stateless compile. Callback-bearing configs are not
/// supported — use `Compiler.fromConfig(...)` + `registerPatternTransform`
/// / `registerUtilityTransform` for that.
#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned input on the JS-facing boundary"
)]
pub fn compile(input: Option<CompileInput>) -> CompileOutput {
    crate::init_tracing();
    let _span = tracing::debug_span!(target: "css", "compile").entered();

    let input = input.unwrap_or(CompileInput {
        files: None,
        config: None,
        cwd: None,
        cache_dir: None,
        emit_layer_declaration: None,
    });
    let emit_layer_declaration = input.emit_layer_declaration.unwrap_or(true);
    let files = input.files.unwrap_or_default();
    let Some(config_value) = input.config else {
        return error_output(
            diagnostic_codes::COMPILE_PLACEHOLDER,
            "compile() requires a `config`".to_owned(),
        );
    };

    let raw_diagnostics = validate_config_value(&config_value);
    if validation_mode_from_value(&config_value) == ValidationMode::Error
        && !raw_diagnostics.is_empty()
    {
        return diagnostics_only_output(raw_diagnostics);
    }
    let user_config: UserConfig = match serde_json::from_value(config_value) {
        Ok(config) => config,
        Err(err) => {
            return error_output(
                diagnostic_codes::COMPILE_PLACEHOLDER,
                format!("invalid config: {err}"),
            );
        }
    };

    let mut project = match pandacss_project::System::new(pandacss_project::SystemInput {
        config: user_config.clone(),
        diagnostics: Some(raw_diagnostics),
        token_dictionary: None,
    }) {
        Ok(system) => pandacss_project::Project::new(system),
        Err(err) => {
            return error_output(
                diagnostic_codes::COMPILE_PLACEHOLDER,
                format!("invalid config: {err}"),
            );
        }
    };

    for file in files {
        project.parse_file(&file.path, &file.content);
    }
    let (static_pattern_atoms, static_pattern_diagnostics) =
        project.static_pattern_atoms(&user_config, None);
    build_compile_output(
        &mut project,
        &user_config,
        &static_pattern_atoms,
        static_pattern_diagnostics,
        None,
        StylesheetEmitOptions {
            emit_layer_declaration,
            minify_override: None,
            polyfill_override: None,
        },
    )
}

/// Emit toggles shared by [`build_compile_output`] / [`build_stylesheet_output`].
/// Kept separate from `&mut` project/transform refs so lifetimes stay independent.
#[derive(Clone, Copy)]
pub(crate) struct StylesheetEmitOptions {
    pub emit_layer_declaration: bool,
    pub minify_override: Option<bool>,
    pub polyfill_override: Option<bool>,
}

pub(crate) fn collect_output_diagnostics(
    project: &pandacss_project::Project,
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    stylesheet_diagnostics: Vec<pandacss_shared::Diagnostic>,
) -> Vec<crate::Diagnostic> {
    project
        .diagnostics()
        .iter()
        .cloned()
        .chain(project.file_diagnostics().into_iter().cloned())
        .chain(static_pattern_diagnostics)
        .chain(stylesheet_diagnostics)
        .map(crate::convert::convert_diagnostic)
        .collect()
}

pub(crate) fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: StylesheetEmitOptions,
) -> CompileOutput {
    // No span here — `manifest` and `stylesheet` (below) are the two real
    // pieces of work; this is thin orchestration around them.
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        utility_transform,
        options,
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

pub(crate) fn build_keyframes_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: Option<&CompileOptions>,
) -> CompileOutput {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest(project, token_dictionary.as_ref());
    let emit_layer_declaration = options.is_none_or(CompileOptions::should_emit_layer_declaration);
    let minify_override = options.and_then(|options| options.minify);
    let polyfill_override = options.and_then(|options| options.polyfill);
    let snapshots = if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    };
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, polyfill_override);
    let stylesheet_options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(user_config, minify_override),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration,
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
    output.diagnostics = snapshot_diagnostics;
    CompileOutput {
        css: output.css,
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

pub(crate) fn build_layer_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    layers: &[String],
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    css_options: Option<&CssOutputOptions>,
) -> CompileOutput {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest(project, token_dictionary.as_ref());
    let emit_layer_declaration = css_options
        .and_then(|options| options.emit_layer_declaration)
        .unwrap_or(false);
    let minify_override = css_options.and_then(|options| options.minify);
    let polyfill_override = css_options.and_then(|options| options.polyfill);
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        utility_transform,
        StylesheetEmitOptions {
            emit_layer_declaration: false,
            minify_override,
            polyfill_override,
        },
    );
    let selected: Vec<pandacss_stylesheet::StylesheetLayer> = layers
        .iter()
        .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
        .collect();
    let mut css = output.get_layer_css(&selected);
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, polyfill_override);
    if emit_layer_declaration && !polyfill {
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

/// One file in a `--splitting` output set. Host writes `path -> code`.
#[napi(object)]
pub struct SplitCssFile {
    pub path: String,
    pub code: String,
}

pub(crate) struct SplitCssBuildOutput {
    pub files: Vec<SplitCssFile>,
    pub diagnostics: Vec<pandacss_shared::Diagnostic>,
}

/// Split the stylesheet into per-file outputs (layers + recipes + indexes).
pub(crate) fn build_split_css(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    static_pattern_atoms: &[CoreAtom],
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: Option<&CssOutputOptions>,
) -> SplitCssBuildOutput {
    let token_dictionary = project.config().token_dictionary();
    let snapshots = if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    };
    let selected_layers = options.and_then(|options| {
        options.layers.as_ref().map(|layers| {
            layers
                .iter()
                .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
                .collect::<Vec<_>>()
        })
    });
    let polyfill = pandacss_stylesheet::resolve_polyfill(
        user_config,
        options.and_then(|options| options.polyfill),
    );
    let stylesheet_options = pandacss_stylesheet::StylesheetOptions {
        minify: pandacss_stylesheet::resolve_minify(
            user_config,
            options.and_then(|options| options.minify),
        ),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: options
            .and_then(|options| options.emit_layer_declaration)
            .unwrap_or(true)
            && !polyfill,
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
        &stylesheet_options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    let files = output
        .files
        .into_iter()
        .map(|file| SplitCssFile {
            path: file.path,
            code: file.code,
        })
        .collect();
    SplitCssBuildOutput {
        files,
        diagnostics: snapshot_diagnostics,
    }
}

/// Compile the project's atoms + recipes into a raw stylesheet (css + layer
/// ranges). Shared by `build_compile_output` and `css_for_layers`.
pub(crate) fn build_stylesheet_output(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    token_dictionary: Option<std::sync::Arc<pandacss_tokens::TokenDictionary>>,
    static_pattern_atoms: &[CoreAtom],
    utility_transform: Option<&mut pandacss_project::UtilityTransformFn<'_>>,
    options: StylesheetEmitOptions,
) -> pandacss_stylesheet::StylesheetOutput {
    let span =
        tracing::trace_span!(target: "css", "stylesheet", atom_count = tracing::field::Empty);
    let _entered = span.enter();
    let snapshots = if let Some(transform) = utility_transform {
        project.stylesheet_snapshots_with_utility_transform(user_config, transform)
    } else {
        project.stylesheet_snapshots(user_config)
    };
    span.record("atom_count", snapshots.atoms.len());
    let polyfill = pandacss_stylesheet::resolve_polyfill(user_config, options.polyfill_override);
    let stylesheet_options = pandacss_stylesheet::StylesheetOptions {
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
        &stylesheet_options,
    );
    snapshot_diagnostics.append(&mut output.diagnostics);
    output.diagnostics = snapshot_diagnostics;
    output
}

fn compile_manifest(
    project: &pandacss_project::Project,
    token_dictionary: Option<&std::sync::Arc<pandacss_tokens::TokenDictionary>>,
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
        let mut paths: BTreeSet<String> = BTreeSet::new();
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

fn layer_ranges_from(r: &pandacss_stylesheet::StylesheetLayerRanges) -> CompileLayerRanges {
    CompileLayerRanges {
        reset: r.reset.as_ref().map(to_napi_range),
        base: r.base.as_ref().map(to_napi_range),
        tokens: r.tokens.as_ref().map(to_napi_range),
        recipes: r.recipes.as_ref().map(to_napi_range),
        utilities: r.utilities.as_ref().map(to_napi_range),
    }
}

fn to_napi_range(range: &std::ops::Range<usize>) -> CompileLayerRange {
    CompileLayerRange {
        start: u32::try_from(range.start).unwrap_or(u32::MAX),
        end: u32::try_from(range.end).unwrap_or(u32::MAX),
    }
}

fn empty_compile_output() -> CompileOutput {
    CompileOutput {
        css: String::new(),
        source_map: None,
        manifest: CompileManifest {
            files: Vec::new(),
            tokens: Vec::new(),
        },
        layer_ranges: empty_layer_ranges(),
        diagnostics: Vec::new(),
    }
}

fn error_output(code: &str, message: String) -> CompileOutput {
    let mut output = empty_compile_output();
    output.diagnostics.push(Diagnostic {
        code: code.to_owned(),
        message,
        severity: DiagnosticSeverity::Error,
        file: None,
        category: None,
        span: None,
        location: None,
        labels: None,
        help: None,
    });
    output
}

fn diagnostics_only_output(diagnostics: Vec<pandacss_shared::Diagnostic>) -> CompileOutput {
    let mut output = empty_compile_output();
    output.diagnostics = diagnostics
        .into_iter()
        .map(crate::convert::convert_diagnostic)
        .collect();
    output
}
