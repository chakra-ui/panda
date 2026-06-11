use pandacss_config::{CodegenFormat, JsxFramework, UserConfig};
use serde_json::json;

#[test]
fn codegen_format_defaults_and_overrides() {
    let default_config: UserConfig = serde_json::from_value(json!({})).expect("default config");
    let ts_config: UserConfig = serde_json::from_value(json!({
        "codegenFormat": "ts"
    }))
    .expect("ts codegen config");
    let js_config: UserConfig = serde_json::from_value(json!({
        "codegenFormat": "js"
    }))
    .expect("js codegen config");
    let mjs_config: UserConfig = serde_json::from_value(json!({
        "codegenFormat": "mjs"
    }))
    .expect("mjs codegen config");

    // `js` + `.d.ts` is the default: extensionless directory imports
    // (`styled-system/css`) resolve under tsc and every bundler without
    // per-bundler configuration; `mjs`/`ts` remain explicit opt-ins.
    assert_eq!(default_config.codegen_format, CodegenFormat::Js);
    assert_eq!(default_config.codegen_format.runtime_extension(), "js");
    assert_eq!(
        default_config.codegen_format.declaration_extension(),
        Some("d.ts")
    );

    assert_eq!(ts_config.codegen_format, CodegenFormat::Ts);
    assert!(ts_config.codegen_format.is_source_ts());
    assert_eq!(ts_config.codegen_format.runtime_extension(), "ts");
    assert_eq!(ts_config.codegen_format.declaration_extension(), None);

    assert_eq!(js_config.codegen_format, CodegenFormat::Js);
    assert!(js_config.codegen_format.is_split());
    assert_eq!(js_config.codegen_format.runtime_extension(), "js");
    assert_eq!(
        js_config.codegen_format.declaration_extension(),
        Some("d.ts")
    );

    assert_eq!(mjs_config.codegen_format, CodegenFormat::Mjs);
    assert!(mjs_config.codegen_format.is_split());
    assert_eq!(mjs_config.codegen_format.runtime_extension(), "mjs");
    assert_eq!(
        mjs_config.codegen_format.declaration_extension(),
        Some("d.mts")
    );

    let serialized = serde_json::to_value(&ts_config).expect("serialized config");
    assert_eq!(serialized.get("codegenFormat"), Some(&json!("ts")));
}

#[test]
fn codegen_import_extensions_defaults_and_overrides() {
    let default_config: UserConfig = serde_json::from_value(json!({})).expect("default config");
    let configured: UserConfig = serde_json::from_value(json!({
        "codegenImportExtensions": true
    }))
    .expect("codegen import extensions config");

    assert!(!default_config.codegen_import_extensions);
    assert!(configured.codegen_import_extensions);

    let serialized = serde_json::to_value(&configured).expect("serialized config");
    assert_eq!(
        serialized.get("codegenImportExtensions"),
        Some(&json!(true))
    );
}

#[test]
fn shorthands_default_to_enabled_and_can_be_disabled() {
    let default_config: UserConfig = serde_json::from_value(json!({})).expect("default config");
    let configured: UserConfig = serde_json::from_value(json!({
        "shorthands": false
    }))
    .expect("shorthands config");

    assert!(default_config.shorthands);
    assert!(!configured.shorthands);

    let serialized = serde_json::to_value(&configured).expect("serialized config");
    assert_eq!(serialized.get("shorthands"), Some(&json!(false)));
}

#[test]
fn optimize_defaults_and_overrides() {
    let default_config: UserConfig = serde_json::from_value(json!({})).expect("default config");
    let configured: UserConfig = serde_json::from_value(json!({
        "optimize": {
            "removeUnusedTokens": true,
            "removeUnusedKeyframes": true
        }
    }))
    .expect("optimize config");
    let partial: UserConfig = serde_json::from_value(json!({
        "optimize": {
            "removeUnusedTokens": true
        }
    }))
    .expect("partial optimize config");
    let legacy_boolean: UserConfig = serde_json::from_value(json!({
        "optimize": true
    }))
    .expect("legacy optimize config");

    assert!(!default_config.optimize.remove_unused_tokens);
    assert!(!default_config.optimize.remove_unused_keyframes);
    assert!(!default_config.optimize.smart_compound_variants);
    assert!(configured.optimize.remove_unused_tokens);
    assert!(configured.optimize.remove_unused_keyframes);
    assert!(partial.optimize.remove_unused_tokens);
    assert!(!partial.optimize.remove_unused_keyframes);
    assert!(!legacy_boolean.optimize.remove_unused_tokens);
    assert!(!legacy_boolean.optimize.remove_unused_keyframes);
    assert!(!legacy_boolean.optimize.smart_compound_variants);

    let smart: UserConfig = serde_json::from_value(json!({
        "optimize": { "smartCompoundVariants": true }
    }))
    .expect("smart compound config");
    assert!(smart.optimize.smart_compound_variants);

    let serialized = serde_json::to_value(&configured).expect("serialized config");
    assert_eq!(
        serialized.get("optimize"),
        Some(&json!({
            "removeUnusedTokens": true,
            "removeUnusedKeyframes": true,
            "smartCompoundVariants": false
        }))
    );
}

#[test]
fn jsx_framework_preserves_known_and_custom_values() {
    let react_config: UserConfig = serde_json::from_value(json!({
        "jsxFramework": "react"
    }))
    .expect("known jsx framework config");
    let custom_config: UserConfig = serde_json::from_value(json!({
        "jsxFramework": "custom-jsx"
    }))
    .expect("custom jsx framework config");

    assert_eq!(react_config.jsx_framework, Some(JsxFramework::React));
    assert!(
        react_config
            .jsx_framework
            .as_ref()
            .is_some_and(JsxFramework::is_known)
    );
    assert_eq!(
        custom_config.jsx_framework,
        Some(JsxFramework::Custom("custom-jsx".into()))
    );
    assert!(
        custom_config
            .jsx_framework
            .as_ref()
            .is_some_and(|framework| !framework.is_known())
    );

    let serialized = serde_json::to_value(&custom_config).expect("serialized config");
    assert_eq!(serialized.get("jsxFramework"), Some(&json!("custom-jsx")));
}
