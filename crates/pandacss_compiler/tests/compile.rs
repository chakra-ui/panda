use indoc::indoc;
use pandacss_compiler::{
    CssOutputOptions, compile_css, compile_keyframes, compile_layers, compile_split_css,
};
use pandacss_literal::Literal;
use pandacss_project::Project;
use pandacss_system::System;
use serde_json::json;

fn project_with_source() -> (pandacss_config::UserConfig, Project) {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "outdir": "styled-system",
        "importMap": { "css": ["@panda/css"] }
    }))
    .expect("valid serialized config");
    let system = System::new(config.clone()).expect("valid project config");
    let mut project = Project::new(system);
    project.parse_file(
        "/src/app.tsx",
        indoc! {r"
            import { css } from '@panda/css'
            css({ color: 'red', padding: '4px' })
        "},
    );
    (config, project)
}

#[test]
fn compile_expands_static_patterns_before_emitting_css() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "outdir": "styled-system",
        "utilities": {
            "alignItems": { "className": "ai" }
        },
        "patterns": {
            "stack": {
                "properties": { "align": { "type": "enum", "value": ["center"] } }
            }
        },
        "staticCss": {
            "patterns": { "stack": [{ "properties": { "align": ["center"] } }] }
        }
    }))
    .expect("valid serialized config");
    let system = System::new(config.clone()).expect("valid project config");
    let mut project = Project::new(system);
    let mut transform = |_name: &str, styles: &Literal| {
        let Literal::Object(entries) = styles else {
            return Ok(Some(styles.clone()));
        };
        Ok(Some(Literal::Object(
            entries
                .iter()
                .map(|(key, value)| {
                    (
                        if key == "align" {
                            "alignItems".to_owned()
                        } else {
                            key.clone()
                        },
                        value.clone(),
                    )
                })
                .collect(),
        )))
    };

    let output = compile_css(
        &mut project,
        &config,
        Some(&mut transform),
        None,
        &CssOutputOptions::default(),
    );

    assert!(output.css.contains(".ai_center"));
    assert!(output.css.contains("align-items: center"));
    assert!(output.diagnostics.is_empty());
}

#[test]
fn shared_compile_entrypoints_use_the_same_project_state() {
    let (config, mut project) = project_with_source();

    let full = compile_css(
        &mut project,
        &config,
        None,
        None,
        &CssOutputOptions::default(),
    );
    assert!(full.css.contains("color: red"));
    assert_eq!(full.manifest.files.len(), 1);

    let utilities = compile_layers(
        &mut project,
        &config,
        None,
        None,
        &CssOutputOptions {
            layers: Some(vec!["utilities".to_owned()]),
            ..Default::default()
        },
    );
    assert!(utilities.css.contains("color: red"));
    assert!(!utilities.css.contains("@layer reset"));

    let split = compile_split_css(
        &mut project,
        &config,
        None,
        None,
        &CssOutputOptions::default(),
    );
    assert!(
        split
            .files
            .iter()
            .any(|file| file.code.contains("color: red"))
    );
    assert!(split.diagnostics.is_empty());
}

#[test]
fn compile_reports_manifest_ranges_and_project_diagnostics() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "importMap": { "css": ["@panda/css"] },
        "conditions": { "hover": "&:hover" }
    }))
    .expect("valid serialized config");
    let system = System::new(config.clone()).expect("valid project config");
    let mut project = Project::new(system);
    project.parse_file(
        "/src/app.tsx",
        "import { css } from '@panda/css'; css({ color: 'red', _hovr: { color: 'blue' } })",
    );

    let output = compile_css(
        &mut project,
        &config,
        None,
        None,
        &CssOutputOptions::default(),
    );

    assert_eq!(output.manifest.files.len(), 1);
    assert_eq!(output.manifest.files[0].hash.len(), 16);
    let utilities = output.layer_ranges.utilities.expect("utilities range");
    assert!(utilities.start < utilities.end);
    assert!(
        output
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == "unknown_condition")
    );
}

#[test]
fn compile_keyframes_uses_the_shared_prepared_stylesheet() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "theme": {
            "keyframes": {
                "spin": { "to": { "transform": "rotate(360deg)" } }
            }
        }
    }))
    .expect("valid serialized config");
    let system = System::new(config.clone()).expect("valid project config");
    let mut project = Project::new(system);

    let output = compile_keyframes(
        &mut project,
        &config,
        None,
        None,
        &CssOutputOptions::default(),
    );

    assert!(output.css.contains("@keyframes spin"));
    assert!(output.diagnostics.is_empty());
}
