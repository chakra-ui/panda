use crate::common::{create_config, create_project};
use pandacss_encoder::AtomValue;
use pandacss_literal::Literal;
use pandacss_project::{ParseTransforms, TransformOptions};
use serde_json::json;

#[test]
fn unchanged_successful_read_clears_attempt_diagnostics() {
    let mut project = create_project(json!({}));
    let source = "import { css } from '@panda/css'; css({ color: 'red' })";
    project.parse_file("file.ts", source);
    let atoms = project.atoms().clone();
    project.record_read_failure(
        "file.ts",
        &std::io::Error::from(std::io::ErrorKind::NotFound),
    );
    assert!(!project.file_diagnostics().is_empty());
    assert!(project.parse_file("file.ts", source).diagnostics.is_empty());
    assert!(project.file_diagnostics().is_empty());
    assert!(
        project
            .get_file("file.ts")
            .unwrap()
            .diagnostics()
            .is_empty()
    );
    assert_eq!(project.atoms(), &atoms);
}

fn recipe_library() -> pandacss_project::BuildInfo {
    let mut library =
        create_project(json!({"theme":{"recipes":{"button":{"base":{"color":"red"}}}}}));
    library.parse_file(
        "button.ts",
        "import { button } from '@panda/recipes'; button({})",
    );
    library.parse_file("special.ts", "import { viewTransition, positionTry, keyframes } from '@panda/css'; viewTransition({old:{opacity:0}}); positionTry({top:'anchor(bottom)'}); keyframes({to:{opacity:0}})");
    library.build_info("^2".into())
}

#[test]
fn clear_removes_hydrated_recipes() {
    let info = recipe_library();
    assert!(!info.recipes.base.is_empty());
    let mut project = create_project(json!({}));
    assert!(project.hydrate("library", &info, None));
    project.clear();
    assert!(project.is_empty());
    assert!(
        project
            .stylesheet_snapshots(&create_config(json!({})))
            .encoded_recipes
            .base
            .is_empty()
    );
}

#[test]
fn rejected_hydration_preserves_last_good_state() {
    let info = recipe_library();
    assert!(!info.view_transitions.is_empty());
    assert!(!info.position_try.is_empty());
    assert!(!info.keyframes.is_empty());
    for section in 0..3 {
        let mut project = create_project(json!({}));
        assert!(project.hydrate("library", &info, None));
        let before = serde_json::to_value(project.build_info("^2".into())).unwrap();
        let mut corrupt = info.clone();
        corrupt.recipes.base.clear();
        match section {
            0 => corrupt.view_transitions[0].cls = u32::MAX,
            1 => corrupt.position_try[0].ident = u32::MAX,
            _ => corrupt.keyframes[0].name = u32::MAX,
        }
        assert!(!project.hydrate("library", &corrupt, None));
        assert_eq!(
            serde_json::to_value(project.build_info("^2".into())).unwrap(),
            before
        );
        let mut fresh = create_project(json!({}));
        assert!(!fresh.hydrate("library", &corrupt, None));
        assert!(fresh.is_empty());
    }
}

#[test]
fn config_boolean_utilities_invoke_transforms() {
    let config = create_config(
        json!({"utilities":{"flag":{"transform":{"kind":"js-callback","id":"utilities.flag.transform"}}},"globalCss":{"html":{"flag":true},"body":{"flag":false}}}),
    );
    let mut project =
        pandacss_project::Project::new(pandacss_project::System::new(config.clone()).unwrap());
    let mut calls = Vec::new();
    let mut callback = |_: &str, _: &AtomValue, raw: &AtomValue| {
        calls.push(raw.clone());
        Ok(Some(Literal::Object(vec![(
            "display".into(),
            Literal::String("flex".into()),
        )])))
    };
    let snapshot = project.stylesheet_snapshots_with_utility_transform(&config, &mut callback);
    assert_eq!(snapshot.utility_styles.len(), 2);
    assert!(calls.contains(&AtomValue::Bool(true)));
    assert!(calls.contains(&AtomValue::Bool(false)));
}

#[test]
fn refresh_after_epoch_change_replaces_utility_styles() {
    let config = create_config(
        json!({"utilities":{"size":{"transform":{"kind":"js-callback","id":"utilities.size.transform"}}},"theme":{"recipes":{"button":{"base":{"size":"4px"}}}}}),
    );
    let mut project =
        pandacss_project::Project::new(pandacss_project::System::new(config.clone()).unwrap());
    let source = "import { css } from '@panda/css'; import { button } from '@panda/recipes'; css({ size: '4px' }); button({})";
    let styles = |property: &str| {
        Some(Literal::Object(vec![(
            property.into(),
            Literal::String("4px".into()),
        )]))
    };
    let mut old = |_: &str, _: &AtomValue, _: &AtomValue| Ok(styles("width"));
    project.parse_file_with(
        "file.ts",
        source,
        ParseTransforms {
            utility: Some(&mut old),
            ..Default::default()
        },
    );
    project.parse_file_with(
        "other.ts",
        source,
        ParseTransforms {
            utility: Some(&mut old),
            ..Default::default()
        },
    );
    project.bump_parse_epoch();
    let mut new = |_: &str, _: &AtomValue, _: &AtomValue| Ok(styles("height"));
    project.refresh_file_with(
        "file.ts",
        source,
        ParseTransforms {
            utility: Some(&mut new),
            ..Default::default()
        },
    );
    project.refresh_file_with(
        "other.ts",
        source,
        ParseTransforms {
            utility: Some(&mut new),
            ..Default::default()
        },
    );
    let snapshot = project.stylesheet_snapshots(&config);
    let recipes = serde_json::to_string(&snapshot.encoded_recipes).unwrap();
    assert!(recipes.contains("height"), "{recipes}");
    assert!(!recipes.contains("width"), "{recipes}");
    assert_eq!(snapshot.utility_styles.len(), 1);
    assert!(
        snapshot
            .utility_styles
            .values()
            .all(|style| *style == styles("height").unwrap())
    );
}

#[test]
fn multiargument_css_preserves_dynamic_arguments() {
    let project = create_project(
        json!({"utilities":{"color":{"className":"c"},"padding":{"className":"p"},"width":{"className":"w"}}}),
    );
    for args in [
        "{ color: 'red' }, { width: props.width, padding: '4px' }",
        "{ width: props.width }, { color: 'red' }",
    ] {
        let source = format!("import {{ css }} from '@panda/css'; export const cls = css({args});");
        let output = project.transform_source("file.ts", &source, &TransformOptions::default());
        assert!(output.changed, "{}", output.code);
        assert!(output.code.contains("css({ width: props.width })"));
        assert!(output.code.contains("__pcx"));
    }
}

#[test]
fn equal_conditional_arms_preserve_test_evaluation() {
    let project = create_project(
        json!({"utilities":{"color":{"className":"c"},"padding":{"className":"p"}}}),
    );
    for test in ["state.ready", "readReady()", "missing", "!state.ready"] {
        let source = format!(
            "import {{ css }} from '@panda/css'; export const cls = css({{ color: {test} ? 'red' : 'red', padding: other.ready ? '4px' : '4px' }});"
        );
        let output = project.transform_source("file.ts", &source, &TransformOptions::default());
        assert!(output.changed);
        assert!(output.code.contains(test), "{}", output.code);
        assert!(output.code.contains("other.ready"), "{}", output.code);
    }
}

#[test]
fn multiargument_conditionals_lower_all_arguments() {
    let project = create_project(
        json!({"utilities":{"color":{"className":"c"},"padding":{"className":"p"}}}),
    );
    let source = "import { css } from '@panda/css'; const cls = css({color: state.ready ? 'red' : 'blue'}, {padding: '4px'});";
    let output = project.transform_source("file.ts", source, &TransformOptions::default());
    assert!(output.changed);
    assert_eq!(
        output.code.trim(),
        "const cls = (state.ready ? \"c_red\" : \"c_blue\") + \" \" + \"p_4px\";"
    );
}
