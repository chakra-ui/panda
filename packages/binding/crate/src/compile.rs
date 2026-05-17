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
    let file_count = input
        .as_ref()
        .and_then(|input| input.files.as_ref())
        .map_or(0, Vec::len);
    CompileOutput {
        css: String::new(),
        source_map: None,
        manifest: CompileManifest {
            hashes: Vec::new(),
            tokens: Vec::new(),
        },
        diagnostics: vec![Diagnostic {
            message: format!(
                "compile is a placeholder; received {file_count} file(s) but no CSS was produced",
            ),
            severity: DiagnosticSeverity::Warning,
            span: None,
            location: None,
        }],
    }
}
