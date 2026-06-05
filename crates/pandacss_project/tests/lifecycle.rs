//! Stateful project behavior: file replacement, removal, refresh, and
//! aggregate atom cache invariants.

use crate::common::{create_config, create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use serde_json::json;

#[test]
fn empty_project_is_empty() {
    let project = create_project(json!({}));
    assert!(project.is_empty());
}

#[test]
fn atoms_dedup_across_files() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', padding: '4px' });
        "},
    );
    project.parse_file(
        "b.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', margin: '8px' });
        "},
    );
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 2
    atomCount: 3
    recipeCount: 0
    slotRecipeCount: 0
    ");
}

#[test]
fn re_adding_file_replaces_atoms_no_ghosts_left() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', padding: '4px' });
        "},
    );
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'blue' });
        "},
    );
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 1
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn re_adding_file_replaces_recipes_no_ghost_keys() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            const button = cva({ base: { color: 'red' } });
        "},
    );
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 1
    recipeCount: 1
    slotRecipeCount: 0
    ");
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'blue' });
        "},
    );
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 1
    recipeCount: 0
    slotRecipeCount: 0
    ");
}

#[test]
fn remove_file_drops_atoms_and_recipes_for_that_path_only() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "a.tsx",
        indoc! {r"
            import { css, cva } from '@panda/css';
            css({ color: 'red' });
            cva({ base: { padding: '4px' } });
        "},
    );
    project.parse_file(
        "b.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ margin: '8px' });
        "},
    );
    assert!(project.remove_file("a.tsx"));
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 1
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: margin
      value: 8px
      conditions: []
    ");
}

#[test]
fn remove_file_on_unknown_path_is_a_noop() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "a.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    assert!(!project.remove_file("never-added.tsx"));
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 1
    recipeCount: 0
    slotRecipeCount: 0
    ");
}

#[test]
fn refresh_file_returns_false_on_unknown_path_and_doesnt_register() {
    let mut project = create_project(json!({}));
    let added = project.refresh_file(
        "vendor.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    assert!(!added);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 0
    atomCount: 0
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert!(project.get_file("vendor.tsx").is_none());
}

#[test]
fn refresh_file_accumulates_known_files_content() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    let refreshed = project.refresh_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'blue' });",
    );
    assert!(refreshed);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 2
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn remove_file_drops_accumulated_refresh_content() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    assert!(project.refresh_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'blue' });",
    ));

    assert!(project.remove_file("button.tsx"));
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 0
    atomCount: 0
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
}

#[test]
fn identical_source_parse_is_a_noop() {
    let mut project = create_project(json!({}));
    let source = "import { css } from '@panda/css';\ncss({ color: 'red' });";
    let first = project.parse_file("button.tsx", source);
    let second = project.parse_file("button.tsx", source);

    assert_eq!(first, second);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 1
    recipeCount: 0
    slotRecipeCount: 0
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn stylesheet_snapshots_update_after_project_changes() {
    let config = create_config(json!({}));
    let system = pandacss_project::System::new(config.clone()).unwrap();
    let mut project = pandacss_project::Project::new(system);

    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    {
        let snapshots = project.stylesheet_snapshots(&config);
        assert_eq!(snapshots.atoms.len(), 1);
        assert_eq!(snapshots.atoms[0].prop(), "color");
    }

    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css';\ncss({ padding: '4px' });",
    );
    let snapshots = project.stylesheet_snapshots(&config);
    assert_eq!(snapshots.atoms.len(), 1);
    assert_eq!(snapshots.atoms[0].prop(), "padding");
}

#[test]
fn stylesheet_snapshots_include_implicit_uppercase_jsx_styles() {
    let config = create_config(json!({
        "jsxFramework": "react"
    }));
    let system = pandacss_project::System::new(config.clone()).unwrap();
    let mut project = pandacss_project::Project::new(system);

    project.parse_file("card.tsx", "const el = <Card color='red' padding='4px' />;");

    let snapshots = project.stylesheet_snapshots(&config);
    let props = snapshots
        .atoms
        .iter()
        .map(pandacss_encoder::Atom::prop)
        .collect::<Vec<_>>();

    assert_yaml_snapshot!(props, @r"
    - color
    - padding
    ");
}
