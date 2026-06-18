//! `panda.lib.json` — the manifest a library publishes so a consumer adopts it
//! with one `designSystem: '@acme/ds'` field. Generation lives here (a
//! [`Project`](crate::Project) method) so the schema version has one source of
//! truth; the host owns fs + module resolution, this module only deals in
//! values. See `design-notes/design-system-manifest.md`.

use serde::{Deserialize, Serialize};

/// Bumped when the wire shape changes; a version mismatch surfaces a diagnostic
/// rather than mis-reading the manifest.
pub const MANIFEST_SCHEMA_VERSION: u32 = 1;

/// The published `panda.lib.json` record. Paths are relative to the manifest's
/// own directory (resolves the same from `node_modules`, a symlink, or Docker).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemManifest {
    pub schema_version: u32,
    pub name: String,
    /// Informational; powers the drift receipt, never enforced.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    /// Peer Panda range the consumer's Panda must satisfy.
    pub panda: String,
    pub preset: String,
    pub build_info: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub import_map: Option<ManifestImportMap>,
    /// This library's own parent design system — the chain link. Omitted at a root.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub design_system: Option<String>,
    /// Re-extract fallback globs when build info can't be hydrated (version skew).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub files: Vec<String>,
}

/// Published import specifiers per category (plural keys, the author-facing wire
/// form, not the engine's internal singular ones).
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ManifestImportMap {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub css: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recipes: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub patterns: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub jsx: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tokens: Option<String>,
}

/// Host-supplied manifest fields — everything but the engine-stamped
/// `schemaVersion`. `importMap`/`designSystem` are optional so a later phase can
/// source them from the resolved config without changing this shape.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestInput {
    pub name: String,
    #[serde(default)]
    pub version: Option<String>,
    pub panda: String,
    pub preset: String,
    pub build_info: String,
    #[serde(default)]
    pub import_map: Option<ManifestImportMap>,
    #[serde(default)]
    pub design_system: Option<String>,
    #[serde(default)]
    pub files: Vec<String>,
}

impl super::Project {
    /// Build a [`DesignSystemManifest`] from host-supplied fields, stamping
    /// [`MANIFEST_SCHEMA_VERSION`]. Pure (no fs).
    // PORT NOTE: a later phase fills `importMap`/parent `designSystem` from
    // config when the input omits them, which is why this lives on `Project`.
    #[must_use]
    #[allow(
        clippy::unused_self,
        reason = "stays a Project method so the next phase can read config-derived fields here"
    )]
    pub fn design_system_manifest(&self, input: ManifestInput) -> DesignSystemManifest {
        DesignSystemManifest {
            schema_version: MANIFEST_SCHEMA_VERSION,
            name: input.name,
            version: input.version,
            panda: input.panda,
            preset: input.preset,
            build_info: input.build_info,
            import_map: input.import_map,
            design_system: input.design_system,
            files: input.files,
        }
    }
}
