//! Serialized configuration types for the Panda Rust engine.

use serde::{Deserialize, Serialize};

/// Minimal config placeholder used by the no-op native binding.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerializedConfig {
    /// Current working directory passed from the TypeScript boundary.
    #[serde(default)]
    pub cwd: String,
}
