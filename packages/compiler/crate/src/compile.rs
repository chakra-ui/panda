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
}

impl CompileOptions {
    pub(crate) fn should_emit_layer_declaration(&self) -> bool {
        self.emit_layer_declaration.unwrap_or(true)
    }
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
    let _span = tracing::debug_span!("config_compile", entry = "top_level_compile").entered();

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
        emit_layer_declaration,
    )
}

pub(crate) fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    emit_layer_declaration: bool,
) -> CompileOutput {
    let token_dictionary = project.config().token_dictionary();
    let manifest_files = project
        .file_manifest()
        .into_iter()
        .map(|(path, hash)| CompileFileManifest {
            path: path.as_ref().to_owned(),
            hash: format!("{hash:016x}"),
        })
        .collect();
    let manifest_tokens = token_dictionary.as_ref().map_or_else(Vec::new, |dict| {
        let mut paths: BTreeSet<String> = BTreeSet::new();
        for token in dict.iter() {
            paths.insert(token.path.to_string());
        }
        paths.into_iter().collect()
    });
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        emit_layer_declaration,
    );
    CompileOutput {
        css: output.css,
        source_map: output.source_map,
        manifest: CompileManifest {
            files: manifest_files,
            tokens: manifest_tokens,
        },
        layer_ranges: layer_ranges_from(&output.layer_ranges),
        diagnostics: project
            .diagnostics()
            .iter()
            .cloned()
            .chain(static_pattern_diagnostics)
            .chain(output.diagnostics)
            .map(crate::convert::convert_diagnostic)
            .collect(),
    }
}

/// One file in a `--splitting` output set. Host writes `path -> code`.
#[napi(object)]
pub struct SplitCssFile {
    pub path: String,
    pub code: String,
}

/// Split the stylesheet into per-file outputs (layers + recipes + indexes).
pub(crate) fn build_split_css(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    static_pattern_atoms: &[CoreAtom],
) -> Vec<SplitCssFile> {
    let token_dictionary = project.config().token_dictionary();
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: true,
    };
    pandacss_stylesheet::split_css(
        &pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
    .into_iter()
    .map(|file| SplitCssFile {
        path: file.path,
        code: file.code,
    })
    .collect()
}

/// Compile the project's atoms + recipes into a raw stylesheet (css + layer
/// ranges). Shared by `build_compile_output` and `css_for_layers`.
pub(crate) fn build_stylesheet_output(
    project: &mut pandacss_project::Project,
    user_config: &UserConfig,
    token_dictionary: Option<std::sync::Arc<pandacss_tokens::TokenDictionary>>,
    static_pattern_atoms: &[CoreAtom],
    emit_layer_declaration: bool,
) -> pandacss_stylesheet::StylesheetOutput {
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration,
    };
    pandacss_stylesheet::compile(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
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

fn empty_layer_ranges() -> CompileLayerRanges {
    CompileLayerRanges {
        reset: None,
        base: None,
        tokens: None,
        recipes: None,
        utilities: None,
    }
}

fn error_output(code: &str, message: String) -> CompileOutput {
    let mut output = empty_compile_output();
    output.diagnostics.push(Diagnostic {
        code: code.to_owned(),
        message,
        severity: DiagnosticSeverity::Error,
        span: None,
        location: None,
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
