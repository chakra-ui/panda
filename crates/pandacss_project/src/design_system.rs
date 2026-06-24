//! `panda.lib.json` — the manifest a library publishes so a consumer adopts it
//! with one `designSystem: '@acme/ds'` field. Values only; the host owns fs +
//! module resolution. See `design-notes/design-system-manifest.md`.

use rustc_hash::FxHashMap;
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
    /// [`MANIFEST_SCHEMA_VERSION`]. A `Project` method so a later phase can fill
    /// `importMap`/parent `designSystem` from config. Pure (no fs).
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

/// Outcome of [`resolve_chain`]: the order to merge presets + hydrate build
/// info, or the cycle that makes the chain unresolvable.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum ChainPlan {
    /// Deduped, root-first order (ancestors before descendants) — preset
    /// inheritance precedence.
    Ordered { order: Vec<String> },
    /// The chain revisits a package; `cycle` is the loop path (`@a → @b → @a`).
    Cycle { cycle: Vec<String> },
}

/// Order already-read manifests by their `designSystem` parent links into a
/// root-first merge/hydrate plan, deduping shared ancestors and catching cycles.
/// A parent absent from the set is a chain boundary (the host resolves it).
#[must_use]
pub fn resolve_chain(manifests: &[DesignSystemManifest]) -> ChainPlan {
    // name → parent link, deduped by name (first wins); `present` preserves input
    // order so roots emit deterministically.
    let mut parent_of: FxHashMap<&str, Option<&str>> = FxHashMap::default();
    let mut present: Vec<&str> = Vec::new();
    for manifest in manifests {
        if parent_of
            .insert(&manifest.name, manifest.design_system.as_deref())
            .is_none()
        {
            present.push(&manifest.name);
        }
    }

    let mut state: FxHashMap<&str, Mark> = FxHashMap::default();
    let mut order: Vec<String> = Vec::new();
    for name in present {
        let mut path: Vec<&str> = Vec::new();
        if let Err(cycle) = visit(name, &parent_of, &mut state, &mut order, &mut path) {
            return ChainPlan::Cycle { cycle };
        }
    }
    ChainPlan::Ordered { order }
}

/// DFS colour: `Gray` is on the current path (a back-edge to it is a cycle),
/// `Black` is fully placed.
#[derive(PartialEq, Eq)]
enum Mark {
    Gray,
    Black,
}

/// Emit `name`'s present ancestors before `name` (post-order ⇒ root-first),
/// erroring with the loop path on a back-edge to a node on the current path.
fn visit<'a>(
    name: &'a str,
    parent_of: &FxHashMap<&'a str, Option<&'a str>>,
    state: &mut FxHashMap<&'a str, Mark>,
    order: &mut Vec<String>,
    path: &mut Vec<&'a str>,
) -> Result<(), Vec<String>> {
    match state.get(name) {
        Some(Mark::Black) => return Ok(()),
        Some(Mark::Gray) => {
            let start = path.iter().position(|&n| n == name).unwrap_or(0);
            let mut cycle: Vec<String> = path[start..].iter().map(|&n| n.to_owned()).collect();
            cycle.push(name.to_owned());
            return Err(cycle);
        }
        None => {}
    }

    state.insert(name, Mark::Gray);
    path.push(name);
    // Only order against a parent that's present in the set.
    if let Some(parent) = parent_of.get(name).copied().flatten()
        && parent_of.contains_key(parent)
    {
        visit(parent, parent_of, state, order, path)?;
    }
    path.pop();
    state.insert(name, Mark::Black);
    order.push(name.to_owned());
    Ok(())
}
