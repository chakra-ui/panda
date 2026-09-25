use pandacss_compiler::{
    has_layer_declaration, layer_names, source_entries, strip_layer_order_statements,
};
use pandacss_fs::PosixPathSystem;
use serde_json::json;

#[test]
fn source_entries_are_rebased_for_watchers() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "cwd": "/repo",
        "include": ["src/**/*.{ts,tsx}", "**/*.vue"]
    }))
    .expect("valid serialized config");

    let entries = source_entries(&config, &PosixPathSystem);

    assert_eq!(entries.len(), 2);
    assert_eq!(entries[0].base, "/repo/src");
    assert_eq!(entries[0].pattern, "**/*.{ts,tsx}");
    assert_eq!(entries[1].base, "/repo");
    assert_eq!(entries[1].pattern, "**/*.vue");
}

#[test]
fn layer_views_use_the_resolved_config_names() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "layers": { "utilities": "panda_utilities" }
    }))
    .expect("valid serialized config");
    let layers = layer_names(&config);
    let css = "@layer reset, base, tokens, recipes, panda_utilities;\n@layer panda_utilities {}";

    assert_eq!(layers.utilities, "panda_utilities");
    assert!(has_layer_declaration(&config, css));
    assert_eq!(
        strip_layer_order_statements(&config, css),
        "\n@layer panda_utilities {}"
    );
}
