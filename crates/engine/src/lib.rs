//! Orchestrator for the Panda Rust engine.

use config::SerializedConfig;
use serde::{Deserialize, Serialize};

/// File content passed to the native engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputFile {
    pub path: String,
    pub content: String,
}

/// Compile input passed from the TypeScript boundary.
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

/// Compile output returned to the TypeScript boundary.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileOutput {
    pub css: String,
    #[serde(default)]
    pub source_map: Option<String>,
    pub manifest: CompileManifest,
    pub diagnostics: Vec<Diagnostic>,
}

/// Summary of emitted hashes and token usage.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileManifest {
    pub hashes: Vec<String>,
    pub tokens: Vec<String>,
}

/// Structured diagnostic from the native engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub message: String,
    pub severity: DiagnosticSeverity,
}

/// Diagnostic severity.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticSeverity {
    Info,
    Warning,
    Error,
}

/// Placeholder compiler entrypoint. The real pipeline (extract → encode →
/// emit → optimize) lands in subsequent slices; until then the engine
/// surfaces a single `Warning` diagnostic so callers don't silently
/// consume an empty stylesheet thinking compilation succeeded.
///
/// The input is observed (file count appears in the diagnostic) so a
/// caller wiring up the binding can verify the round-trip without
/// pretending the output is real.
// TODO(port): replace this placeholder once the extract → encode → emit
// pipeline is in place. The output shape is stable; only the body
// needs to grow.
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
