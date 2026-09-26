use crate::{Diagnostic, DiagnosticSeverity};
use napi_derive::napi;
use pandacss_shared::diagnostic_codes;

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

/// One file in a `--splitting` output set. Host writes `path -> code`.
#[napi(object)]
pub struct SplitCssFile {
    pub path: String,
    pub code: String,
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
    let files = input.files.unwrap_or_default();
    let Some(config_value) = input.config else {
        return error_output(
            diagnostic_codes::COMPILE_PLACEHOLDER,
            "compile() requires a `config`".to_owned(),
        );
    };

    let loaded =
        pandacss_compiler::load_system(config_value, |_, _| Ok::<(), std::convert::Infallible>(()));
    let (mut project, user_config) = match loaded {
        Ok(loaded) => (
            pandacss_project::Project::new(loaded.system),
            loaded.user_config,
        ),
        Err(pandacss_compiler::LoadSystemError::Invalid(diagnostics)) => {
            return diagnostics_only_output(diagnostics);
        }
        Err(err) => {
            return error_output(
                diagnostic_codes::COMPILE_PLACEHOLDER,
                err.message().unwrap_or_default(),
            );
        }
    };

    for file in files {
        project.parse_file(&file.path, &file.content);
    }
    pandacss_compiler::compile_css(
        &mut project,
        &user_config,
        None,
        None,
        &pandacss_compiler::CssOutputOptions {
            emit_layer_declaration: input.emit_layer_declaration,
            ..Default::default()
        },
    )
    .into()
}

impl From<pandacss_compiler::CompileOutput> for CompileOutput {
    fn from(output: pandacss_compiler::CompileOutput) -> Self {
        Self {
            css: output.css,
            source_map: output.source_map,
            manifest: output.manifest.into(),
            layer_ranges: output.layer_ranges.into(),
            diagnostics: output
                .diagnostics
                .into_iter()
                .map(crate::convert::convert_diagnostic)
                .collect(),
        }
    }
}

impl From<pandacss_compiler::CompileManifest> for CompileManifest {
    fn from(manifest: pandacss_compiler::CompileManifest) -> Self {
        Self {
            files: manifest.files.into_iter().map(Into::into).collect(),
            tokens: manifest.tokens,
        }
    }
}

impl From<pandacss_compiler::CompileFileManifest> for CompileFileManifest {
    fn from(file: pandacss_compiler::CompileFileManifest) -> Self {
        Self {
            path: file.path,
            hash: file.hash,
        }
    }
}

impl From<pandacss_compiler::CompileLayerRanges> for CompileLayerRanges {
    fn from(ranges: pandacss_compiler::CompileLayerRanges) -> Self {
        Self {
            reset: ranges.reset.map(Into::into),
            base: ranges.base.map(Into::into),
            tokens: ranges.tokens.map(Into::into),
            recipes: ranges.recipes.map(Into::into),
            utilities: ranges.utilities.map(Into::into),
        }
    }
}

impl From<pandacss_compiler::CompileLayerRange> for CompileLayerRange {
    fn from(range: pandacss_compiler::CompileLayerRange) -> Self {
        Self {
            start: range.start,
            end: range.end,
        }
    }
}

impl From<pandacss_compiler::SplitCssFile> for SplitCssFile {
    fn from(file: pandacss_compiler::SplitCssFile) -> Self {
        Self {
            path: file.path,
            code: file.code,
        }
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
        layer_ranges: CompileLayerRanges {
            reset: None,
            base: None,
            tokens: None,
            recipes: None,
            utilities: None,
        },
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
