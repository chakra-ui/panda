use crate::{Diagnostic, DiagnosticSeverity};
use napi_derive::napi;

#[napi(object)]
pub struct CompileInput {
    pub files: Option<Vec<InputFile>>,
    pub config: Option<serde_json::Value>,
    pub cwd: Option<String>,
    pub cache_dir: Option<String>,
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
    pub diagnostics: Vec<Diagnostic>,
}

#[napi(object)]
pub struct CompileManifest {
    pub hashes: Vec<String>,
    pub tokens: Vec<String>,
}

#[napi]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "NAPI requires owned input on the JS-facing boundary"
)]
pub fn compile(input: Option<CompileInput>) -> CompileOutput {
    let engine_input = input.map(to_engine_input).unwrap_or_default();
    let output = pandacss_engine::compile(engine_input);
    CompileOutput {
        css: output.css,
        source_map: output.source_map,
        manifest: CompileManifest {
            hashes: output.manifest.hashes,
            tokens: output.manifest.tokens,
        },
        diagnostics: output
            .diagnostics
            .into_iter()
            .map(|d| Diagnostic {
                message: d.message,
                severity: match d.severity {
                    pandacss_engine::DiagnosticSeverity::Error => DiagnosticSeverity::Error,
                    pandacss_engine::DiagnosticSeverity::Warning => DiagnosticSeverity::Warning,
                    pandacss_engine::DiagnosticSeverity::Info => DiagnosticSeverity::Info,
                },
                span: None,
                location: None,
            })
            .collect(),
    }
}

fn to_engine_input(input: CompileInput) -> pandacss_engine::CompileInput {
    let files = input
        .files
        .unwrap_or_default()
        .into_iter()
        .map(|f| pandacss_engine::InputFile {
            path: f.path,
            content: f.content,
        })
        .collect();
    // Config is opaque on the binding boundary today. Malformed values
    // degrade to default silently — `SerializedConfig` is a placeholder
    // and we don't want a parse failure to break the round trip.
    let config = input
        .config
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    pandacss_engine::CompileInput {
        files,
        config,
        cwd: input.cwd.unwrap_or_default(),
        cache_dir: input.cache_dir,
    }
}
