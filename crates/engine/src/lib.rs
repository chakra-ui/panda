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

/// No-op compiler entrypoint used while the Rust workspace is being wired up.
#[must_use]
pub fn compile(_input: CompileInput) -> CompileOutput {
    CompileOutput::default()
}
