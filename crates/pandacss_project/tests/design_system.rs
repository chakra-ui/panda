//! `Project::design_system_manifest` — produce a `panda.lib.json` value from
//! host-supplied identity + paths, stamping the engine-owned schema version, and
//! round-trip it through JSON. Pure (no fs).

use crate::common::create_project;
use pandacss_project::{
    ChainPlan, DesignSystemManifest, MANIFEST_SCHEMA_VERSION, ManifestInput, resolve_chain,
};
use serde_json::{from_value, json, to_value};

fn full_input() -> ManifestInput {
    from_value(json!({
        "name": "@acme/ds",
        "version": "1.2.3",
        "panda": "^2.0.0",
        "preset": "./preset.mjs",
        "buildInfo": "./panda.buildinfo.json",
        "importMap": { "css": "@acme/ds/css", "recipes": "@acme/ds/recipes" },
        "designSystem": "@acme/foundations",
        "files": ["./dist/**/*.mjs"],
    }))
    .expect("deserialize manifest input")
}

#[test]
fn stamps_schema_version_and_carries_input_fields() {
    let project = create_project(json!({}));
    let manifest = project.design_system_manifest(full_input());

    assert_eq!(manifest.schema_version, MANIFEST_SCHEMA_VERSION);
    assert_eq!(manifest.name, "@acme/ds");
    assert_eq!(manifest.version.as_deref(), Some("1.2.3"));
    assert_eq!(manifest.panda, "^2.0.0");
    assert_eq!(manifest.design_system.as_deref(), Some("@acme/foundations"));
    assert_eq!(
        manifest.import_map.as_ref().and_then(|m| m.css.as_deref()),
        Some("@acme/ds/css")
    );
    assert_eq!(manifest.files, ["./dist/**/*.mjs"]);
}

#[test]
fn omits_optional_fields_when_absent() {
    let project = create_project(json!({}));
    let input: ManifestInput = from_value(json!({
        "name": "@acme/ds",
        "panda": "^2.0.0",
        "preset": "./preset.mjs",
        "buildInfo": "./panda.buildinfo.json",
    }))
    .expect("deserialize minimal input");

    let manifest = project.design_system_manifest(input);
    let json = to_value(&manifest).expect("serialize manifest");

    // Engine stamps the version; absent optionals don't appear on the wire.
    assert_eq!(json["schemaVersion"], MANIFEST_SCHEMA_VERSION);
    assert!(json.get("version").is_none());
    assert!(json.get("importMap").is_none());
    assert!(json.get("designSystem").is_none());
    assert!(json.get("files").is_none());
}

#[test]
fn round_trips_through_json() {
    let project = create_project(json!({}));
    let manifest = project.design_system_manifest(full_input());

    let json = serde_json::to_string(&manifest).expect("serialize manifest");
    let restored: DesignSystemManifest = serde_json::from_str(&json).expect("deserialize manifest");

    assert_eq!(manifest, restored);
}

/// A bare manifest with just a name and optional parent — chain resolution only
/// reads those two fields.
fn node(name: &str, parent: Option<&str>) -> DesignSystemManifest {
    from_value(json!({
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "name": name,
        "panda": "^2.0.0",
        "preset": "./preset.mjs",
        "buildInfo": "./panda.buildinfo.json",
        "designSystem": parent,
    }))
    .expect("deserialize node")
}

fn order(plan: ChainPlan) -> Vec<String> {
    match plan {
        ChainPlan::Ordered { order } => order,
        ChainPlan::Cycle { cycle } => panic!("expected an ordered plan, got cycle {cycle:?}"),
    }
}

#[test]
fn resolve_chain_orders_a_depth_n_stack_root_first() {
    // leaf → marketing → foundations; input in leaf-first order.
    let plan = resolve_chain(&[
        node("@acme/marketing", Some("@acme/foundations")),
        node("@acme/foundations", None),
    ]);
    assert_eq!(order(plan), ["@acme/foundations", "@acme/marketing"]);
}

#[test]
fn resolve_chain_dedupes_a_shared_parent() {
    // Two libraries sharing one ancestor — the ancestor emits once, before both.
    let plan = resolve_chain(&[
        node("@acme/a", Some("@acme/base")),
        node("@acme/b", Some("@acme/base")),
        node("@acme/base", None),
    ]);
    assert_eq!(order(plan), ["@acme/base", "@acme/a", "@acme/b"]);
}

#[test]
fn resolve_chain_treats_an_absent_parent_as_a_boundary() {
    // The parent isn't in the set (host owns parent-not-found); the node still
    // resolves as a root rather than erroring.
    let plan = resolve_chain(&[node("@acme/leaf", Some("@acme/missing"))]);
    assert_eq!(order(plan), ["@acme/leaf"]);
}

#[test]
fn resolve_chain_reports_a_cycle_path() {
    let plan = resolve_chain(&[
        node("@acme/a", Some("@acme/b")),
        node("@acme/b", Some("@acme/a")),
    ]);
    match plan {
        ChainPlan::Cycle { cycle } => assert_eq!(cycle, ["@acme/a", "@acme/b", "@acme/a"]),
        ChainPlan::Ordered { order } => panic!("expected a cycle, got order {order:?}"),
    }
}

#[test]
fn resolve_chain_handles_an_empty_set() {
    assert_eq!(order(resolve_chain(&[])), Vec::<String>::new());
}
