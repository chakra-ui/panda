//! Project state across read failures, hydration, and clears, plus utility
//! transforms and multi-argument `css()` rewrites.

use crate::common::{create_config, create_project};
use indoc::indoc;
use pandacss_encoder::AtomValue;
use pandacss_literal::Literal;
use pandacss_project::{BuildInfo, ParseTransforms, Project, TransformOptions, TransformOutput};
use serde_json::json;

#[test]
fn rereading_an_unchanged_file_clears_a_previous_read_failure() {
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

/// Build info with a `button` recipe plus a view transition, position-try and keyframes.
fn library_build_info() -> BuildInfo {
    let mut library = create_project(json!({
        "theme": { "recipes": { "button": { "base": { "color": "red" } } } }
    }));
    library.parse_file(
        "button.ts",
        "import { button } from '@panda/recipes'; button({})",
    );
    library.parse_file(
        "special.ts",
        indoc! {r"
            import { viewTransition, positionTry, keyframes } from '@panda/css';
            viewTransition({ old: { opacity: 0 } });
            positionTry({ top: 'anchor(bottom)' });
            keyframes({ to: { opacity: 0 } });
        "},
    );
    library.build_info("^2".into())
}

#[test]
fn clear_removes_hydrated_recipes() {
    let info = library_build_info();
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

/// Hydrates the library, then re-hydrates a corrupted copy: the corrupt copy
/// must be rejected without touching the good state, and rejected on a fresh
/// project too.
fn assert_corrupt_hydration_keeps_last_good_state(corrupt: impl FnOnce(&mut BuildInfo)) {
    let info = library_build_info();
    let mut project = create_project(json!({}));
    assert!(project.hydrate("library", &info, None));
    let before = serde_json::to_value(project.build_info("^2".into())).unwrap();

    let mut corrupted = info.clone();
    corrupted.recipes.base.clear();
    corrupt(&mut corrupted);

    assert!(!project.hydrate("library", &corrupted, None));
    assert_eq!(
        serde_json::to_value(project.build_info("^2".into())).unwrap(),
        before
    );
    let mut fresh = create_project(json!({}));
    assert!(!fresh.hydrate("library", &corrupted, None));
    assert!(fresh.is_empty());
}

#[test]
fn a_corrupt_view_transition_is_rejected_and_keeps_the_last_good_state() {
    assert_corrupt_hydration_keeps_last_good_state(|info| {
        info.view_transitions[0].cls = u32::MAX;
    });
}

#[test]
fn a_corrupt_position_try_is_rejected_and_keeps_the_last_good_state() {
    assert_corrupt_hydration_keeps_last_good_state(|info| {
        info.position_try[0].ident = u32::MAX;
    });
}

#[test]
fn corrupt_keyframes_are_rejected_and_keep_the_last_good_state() {
    assert_corrupt_hydration_keeps_last_good_state(|info| {
        info.keyframes[0].name = u32::MAX;
    });
}

#[test]
fn global_css_boolean_utility_values_run_the_utility_transform() {
    let config = create_config(json!({
        "utilities": {
            "flag": { "transform": { "kind": "js-callback", "id": "utilities.flag.transform" } }
        },
        "globalCss": {
            "html": { "flag": true },
            "body": { "flag": false }
        }
    }));
    let mut project = Project::new(pandacss_project::System::new(config.clone()).unwrap());
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
fn refreshing_after_a_parse_epoch_bump_uses_the_new_utility_transform() {
    let config = create_config(json!({
        "utilities": {
            "size": { "transform": { "kind": "js-callback", "id": "utilities.size.transform" } }
        },
        "theme": { "recipes": { "button": { "base": { "size": "4px" } } } }
    }));
    let mut project = Project::new(pandacss_project::System::new(config.clone()).unwrap());
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

fn transform_css(source: &str) -> TransformOutput {
    let project = create_project(json!({
        "utilities": {
            "color": { "className": "c" },
            "padding": { "className": "p" },
            "width": { "className": "w" }
        }
    }));
    project.transform_source("file.ts", source, &TransformOptions::default())
}

#[test]
fn dynamic_prop_in_the_last_css_argument_stays_in_a_runtime_call() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: 'red' }, { width: props.width, padding: '4px' });",
    );
    assert!(output.changed, "{}", output.code);
    assert!(output.code.contains("css({ width: props.width })"));
    assert!(output.code.contains("__pcx"));
}

#[test]
fn dynamic_prop_in_the_first_css_argument_stays_in_a_runtime_call() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ width: props.width }, { color: 'red' });",
    );
    assert!(output.changed, "{}", output.code);
    assert!(output.code.contains("css({ width: props.width })"));
    assert!(output.code.contains("__pcx"));
}

#[test]
fn identical_ternary_arms_still_evaluate_a_member_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: state.ready ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("state.ready"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn identical_ternary_arms_still_evaluate_a_call_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: readReady() ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("readReady()"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn identical_ternary_arms_still_evaluate_an_undeclared_identifier_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: missing ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("missing"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn identical_ternary_arms_still_evaluate_a_negated_test() {
    let output = transform_css(
        "import { css } from '@panda/css'; export const cls = css({ color: !state.ready ? 'red' : 'red', padding: other.ready ? '4px' : '4px' });",
    );
    assert!(output.changed);
    assert!(output.code.contains("!state.ready"), "{}", output.code);
    assert!(output.code.contains("other.ready"), "{}", output.code);
}

#[test]
fn conditional_first_css_argument_lowers_with_the_static_second_argument() {
    let output = transform_css(
        "import { css } from '@panda/css'; const cls = css({color: state.ready ? 'red' : 'blue'}, {padding: '4px'});",
    );
    assert!(output.changed);
    assert_eq!(
        output.code.trim(),
        "const cls = (state.ready ? \"c_red\" : \"c_blue\") + \" \" + \"p_4px\";"
    );
}
