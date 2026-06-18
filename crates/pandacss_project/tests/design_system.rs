//! `Project::design_system_manifest` — produce a `panda.lib.json` value from
//! host-supplied identity + paths, stamping the engine-owned schema version, and
//! round-trip it through JSON. Pure (no fs).

use crate::common::create_project;
use pandacss_project::{DesignSystemManifest, MANIFEST_SCHEMA_VERSION, ManifestInput};
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
