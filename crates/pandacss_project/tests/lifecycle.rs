//! Stateful project behavior: file replacement, removal, refresh, and
//! aggregate atom cache invariants.

mod common;

use common::{create_project, sorted_atoms};
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
    assert_eq!(project.summary().files_processed, 2);
    assert_eq!(project.summary().atom_count, 3);
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
    assert_eq!(project.summary().files_processed, 1);
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
    assert_eq!(project.summary().recipe_count, 1);
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'blue' });
        "},
    );
    assert_eq!(project.summary().recipe_count, 0);
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
    let summary = project.summary();
    assert_eq!(summary.files_processed, 1);
    assert_eq!(summary.recipe_count, 0);
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
    assert_eq!(project.summary().files_processed, 1);
    assert_eq!(project.summary().atom_count, 1);
}

#[test]
fn refresh_file_returns_false_on_unknown_path_and_doesnt_register() {
    let mut project = create_project(json!({}));
    let added = project.refresh_file(
        "vendor.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    assert!(!added);
    assert_eq!(project.summary().files_processed, 0);
    assert!(project.get_file("vendor.tsx").is_none());
}

#[test]
fn refresh_file_replaces_known_files_content() {
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
    assert_eq!(project.summary().files_processed, 1);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}
