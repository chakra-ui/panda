//! Orchestrator for the Panda Rust engine.

use config::SerializedConfig;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputFile {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileInput {
    #[serde(default)]
    pub files: Vec<InputFile>,
    #[serde(default)]
    pub config: SerializedConfig,
    #[serde(default)]
    pub cwd: String,
    #[serde(default)]
    pub cache_dir: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileOutput {
    pub css: String,
    #[serde(default)]
    pub source_map: Option<String>,
    pub manifest: CompileManifest,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileManifest {
    pub hashes: Vec<String>,
    pub tokens: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub message: String,
    pub severity: DiagnosticSeverity,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticSeverity {
    Info,
    Warning,
    Error,
}

// TODO(port): placeholder until the extract → encode → emit pipeline lands.
// Emits a single Warning so callers don't silently consume an empty
// stylesheet thinking compilation succeeded. Output shape is stable;
// only the body needs to grow.
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "signature stays owned for the future real impl which will consume `files`/`config`/`cache_dir`"
)]
pub fn compile(input: CompileInput) -> CompileOutput {
    let file_count = input.files.len();
    CompileOutput {
        diagnostics: vec![Diagnostic {
            message: format!(
                "engine::compile is a placeholder; received {file_count} file(s) but no CSS was produced",
            ),
            severity: DiagnosticSeverity::Warning,
        }],
        ..CompileOutput::default()
    }
}
