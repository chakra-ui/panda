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

#[test]
fn mdx_styles_emit_and_refresh_without_emitting_code_examples() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "outdir": "styled-system",
        "jsxFramework": "react",
        "importMap": { "css": ["@panda/css"], "jsx": ["@panda/jsx"] },
        "utilities": {
            "color": { "className": "color" },
            "gap": { "className": "gap" }
        },
        "patterns": { "box": { "jsx": ["Box"] } }
    }))
    .expect("valid config");
    let system = System::new(config.clone()).expect("valid system");
    let mut project = Project::new(system);
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';

        # Badge

        ```jsx
        <Box color="orange" />
        ```

        <Box gap="2" color="red">
          <span className={css({ color: 'blue' })}>solid</span>
        </Box>
    "#};
    let options = CssOutputOptions {
        layers: Some(vec!["utilities".to_owned()]),
        ..Default::default()
    };
    project.parse_file("/src/badge.mdx", source);
    let output = compile_layers(&mut project, &config, None, None, &options);
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    insta::assert_snapshot!(output.css, @"
    @layer utilities {
      .gap_2 {
        gap: 2px;
      }
      .color_blue {
        color: blue;
      }
      .color_red {
        color: red;
      }
    }
    ");
    project.parse_file("/src/badge.mdx", &source.replace("'blue'", "'teal'"));
    let output = compile_layers(&mut project, &config, None, None, &options);
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    insta::assert_snapshot!(output.css, @"
    @layer utilities {
      .gap_2 {
        gap: 2px;
      }
      .color_red {
        color: red;
      }
      .color_teal {
        color: teal;
      }
    }
    ");
}

fn static_css_project(
    static_css: &serde_json::Value,
    source: &str,
) -> (pandacss_config::UserConfig, Project) {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "outdir": "styled-system",
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "breakpoints": { "md": "768px" } },
        "conditions": { "hover": "&:hover" },
        "utilities": {
            "example": {
                "className": "example",
                "values": ["a", "b", "c"],
                "transform": { "kind": "js-callback", "id": "example" }
            },
            "shorthandUtil": {
                "className": "shu",
                "shorthand": "sh",
                "transform": { "kind": "js-callback", "id": "shorthandUtil" }
            },
            "plain": { "className": "plain" }
        },
        "patterns": {
            "badge": {
                "properties": { "tone": { "type": "enum", "value": ["b"] } }
            }
        },
        "staticCss": static_css
    }))
    .expect("valid serialized config");
    let system = System::new(config.clone()).expect("valid project config");
    let mut project = Project::new(system);
    project.parse_file("/src/app.tsx", source);
    (config, project)
}

fn example_styles(original: &pandacss_project::AtomValue) -> Option<Literal> {
    let value = match original {
        pandacss_project::AtomValue::String(value) | pandacss_project::AtomValue::Number(value) => {
            value.to_string()
        }
        _ => return None,
    };
    if value == "c" {
        return Some(Literal::Object(Vec::new()));
    }
    Some(Literal::Object(vec![
        ("--example-value".to_owned(), Literal::String(value.clone())),
        ("color".to_owned(), Literal::String(format!("c-{value}"))),
    ]))
}

fn static_utilities_css(
    static_css: &serde_json::Value,
    source: &str,
) -> (String, Vec<pandacss_shared::Diagnostic>) {
    let (config, mut project) = static_css_project(static_css, source);
    let mut pattern_transform = |_name: &str, styles: &Literal| {
        let Literal::Object(entries) = styles else {
            return Ok(Some(styles.clone()));
        };
        Ok(Some(Literal::Object(
            entries
                .iter()
                .map(|(key, value)| {
                    (
                        if key == "tone" {
                            "example".to_owned()
                        } else {
                            key.clone()
                        },
                        value.clone(),
                    )
                })
                .collect(),
        )))
    };
    let mut utility_transform =
        |_prop: &str,
         _resolved: &pandacss_project::AtomValue,
         original: &pandacss_project::AtomValue| Ok(example_styles(original));
    let output = compile_layers(
        &mut project,
        &config,
        Some(&mut pattern_transform),
        Some(&mut utility_transform),
        &CssOutputOptions {
            layers: Some(vec!["utilities".to_owned()]),
            ..Default::default()
        },
    );
    (output.css, output.diagnostics)
}

#[test]
fn static_css_applies_custom_utility_transforms() {
    let (css, diagnostics) = static_utilities_css(
        &json!({ "css": [{ "properties": { "example": ["a", "b"] } }] }),
        "import { css } from '@panda/css'\ncss({ example: 'a' })\n",
    );

    assert!(diagnostics.is_empty(), "{diagnostics:?}");
    insta::assert_snapshot!(css, @r"
    @layer utilities {
      .example_a {
        --example-value: a;
        color: c-a;
      }
      .example_b {
        --example-value: b;
        color: c-b;
      }
    }
    ");
}

#[test]
fn static_css_transforms_wildcards_conditions_shorthands_and_numbers() {
    let (css, diagnostics) = static_utilities_css(
        &json!({
            "css": [
                { "properties": { "example": ["*"] }, "conditions": ["hover"], "responsive": true },
                { "properties": { "sh": ["s", 2] } },
                { "properties": { "plain": ["x"] } }
            ]
        }),
        "",
    );

    assert!(diagnostics.is_empty(), "{diagnostics:?}");
    insta::assert_snapshot!(css, @r"
    @layer utilities {
      .example_a {
        --example-value: a;
        color: c-a;
      }
      .example_b {
        --example-value: b;
        color: c-b;
      }
      .plain_x {
        plain: x;
      }
      .shu_2 {
        --example-value: 2;
        color: c-2;
      }
      .shu_s {
        --example-value: s;
        color: c-s;
      }
      .hover\:example_a:hover {
        --example-value: a;
        color: c-a;
      }
      .hover\:example_b:hover {
        --example-value: b;
        color: c-b;
      }
      @media (width >= 48rem) {
        .md\:example_a {
          --example-value: a;
          color: c-a;
        }
        .md\:example_b {
          --example-value: b;
          color: c-b;
        }
      }
    }
    ");
}

#[test]
fn static_css_patterns_apply_custom_utility_transforms() {
    let (css, diagnostics) = static_utilities_css(
        &json!({ "patterns": { "badge": [{ "properties": { "tone": ["b"] } }] } }),
        "",
    );

    assert!(diagnostics.is_empty(), "{diagnostics:?}");
    assert!(css.contains("--example-value: b;"), "{css}");
    assert!(!css.contains("example: b;"), "{css}");
}

#[test]
fn static_css_reruns_utility_transforms_when_static_css_changes() {
    let (first, mut project) = static_css_project(
        &json!({ "css": [{ "properties": { "example": ["a"] } }] }),
        "",
    );
    let (second, _) = static_css_project(
        &json!({ "css": [{ "properties": { "example": ["b"] } }] }),
        "",
    );
    let mut utility_transform =
        |_prop: &str,
         _resolved: &pandacss_project::AtomValue,
         original: &pandacss_project::AtomValue| Ok(example_styles(original));
    let options = CssOutputOptions {
        layers: Some(vec!["utilities".to_owned()]),
        ..Default::default()
    };

    let before = compile_layers(
        &mut project,
        &first,
        None,
        Some(&mut utility_transform),
        &options,
    );
    let after = compile_layers(
        &mut project,
        &second,
        None,
        Some(&mut utility_transform),
        &options,
    );

    assert!(before.css.contains("color: c-a;"), "{}", before.css);
    assert!(after.css.contains("color: c-b;"), "{}", after.css);
    assert!(!after.css.contains("example: b;"), "{}", after.css);
}

#[test]
fn static_css_reports_a_failing_utility_transform() {
    let (config, mut project) = static_css_project(
        &json!({ "css": [{ "properties": { "example": ["b"] } }] }),
        "",
    );
    let mut utility_transform =
        |_prop: &str,
         _resolved: &pandacss_project::AtomValue,
         _original: &pandacss_project::AtomValue| {
            Err(pandacss_shared::Diagnostic::error(
                "transform_callback_failed",
                "boom",
            ))
        };

    let output = compile_css(
        &mut project,
        &config,
        None,
        Some(&mut utility_transform),
        &CssOutputOptions::default(),
    );

    assert!(
        output
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.message.contains("boom")),
        "{:?}",
        output.diagnostics
    );
}
