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
pub fn compile(_input: Option<CompileInput>) -> CompileOutput {
    let output = engine::compile(engine::CompileInput::default());
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
                    engine::DiagnosticSeverity::Error => DiagnosticSeverity::Error,
                    engine::DiagnosticSeverity::Warning => DiagnosticSeverity::Warning,
                    engine::DiagnosticSeverity::Info => DiagnosticSeverity::Info,
                },
                span: None,
                location: None,
            })
            .collect(),
    }
}
