//! Watch-session cascade: changing a folded module marks its importers affected.

use std::path::{Path, PathBuf};

use crate::common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::{FileSystem as _, MemoryFileSystem};
use pandacss_project::Project;
use serde_json::json;

fn watch_project(files: &[(&str, &str)]) -> (MemoryFileSystem, Project) {
    let fs = MemoryFileSystem::new();
    for (name, contents) in files {
        write(&fs, name, contents);
    }
    let project = create_project(json!({})).with_cross_file(CrossFileResolver::with_fs(fs.clone()));
    (fs, project)
}

fn read(fs: &MemoryFileSystem, path: &str) -> Option<String> {
    fs.snapshot()
        .into_iter()
        .find(|(candidate, _)| candidate == Path::new(path))
        .map(|(_, bytes)| String::from_utf8(bytes).expect("utf8 fixture"))
}

fn write(fs: &MemoryFileSystem, name: &str, contents: &str) {
    fs.add_file(
        PathBuf::from(format!("/proj/{name}")),
        contents.as_bytes().to_vec(),
    );
}

/// Host-style drain. Uses the replacing parse so snapshots show only the current fold.
fn refresh_affected(project: &mut Project, fs: &MemoryFileSystem) -> Vec<String> {
    let mut refreshed = Vec::new();
    loop {
        let affected = project.take_affected_files();
        if affected.is_empty() {
            return refreshed;
        }
        for path in affected {
            if let Some(source) = read(fs, &path) {
                project.parse_file(&path, &source);
            }
            refreshed.push(path);
        }
    }
}

fn app_source() -> &'static str {
    indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ color: brand });
    "}
}

fn barrel_app_source() -> &'static str {
    indoc! {r"
        import { brand } from './barrel';
        import { css } from '@panda/css';
        css({ color: brand });
    "}
}

#[test]
fn cold_build_affects_nothing() {
    let (_fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());
    project.parse_file("/proj/tokens.ts", "export const brand = 'red';\n");

    assert_eq!(
        project.importers_of("/proj/tokens.ts"),
        vec!["/proj/App.tsx"]
    );
    assert!(project.take_affected_files().is_empty());
}

#[test]
fn editing_a_token_file_affects_its_importer() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());
    project.parse_file("/proj/tokens.ts", "export const brand = 'red';\n");

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.refresh_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn editing_a_reexported_token_affects_the_importer() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", barrel_app_source()),
        ("barrel.ts", "export { brand } from './tokens';\n"),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", barrel_app_source());

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn editing_a_token_file_that_is_not_a_project_file_still_affects_importers() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    assert!(!project.refresh_file("/proj/tokens.ts", "export const brand = 'blue';\n"));

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn removing_a_token_file_drops_the_folded_atom() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());
    project.parse_file("/proj/tokens.ts", "export const brand = 'red';\n");

    fs.remove_file(Path::new("/proj/tokens.ts")).unwrap();
    assert!(project.remove_file("/proj/tokens.ts"));

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @"[]");
}

#[test]
fn unrelated_importer_is_left_alone() {
    let other = indoc! {r"
        import { brand } from './other';
        import { css } from '@panda/css';
        css({ color: brand, padding: '4px' });
    "};
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("Other.tsx", other),
        ("tokens.ts", "export const brand = 'red';\n"),
        ("other.ts", "export const brand = 'navy';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());
    project.parse_file("/proj/Other.tsx", other);

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: navy
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn two_importers_are_both_affected() {
    let second = indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        css({ background: brand });
    "};
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("Card.tsx", second),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());
    project.parse_file("/proj/Card.tsx", second);

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");

    assert_eq!(
        refresh_affected(&mut project, &fs),
        vec!["/proj/App.tsx", "/proj/Card.tsx"]
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: background
      value: blue
      conditions: []
    - prop: color
      value: blue
      conditions: []
    ");
}

#[test]
fn refreshing_an_importer_clears_it_from_the_affected_set() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");
    project.refresh_file("/proj/App.tsx", app_source());

    assert!(project.take_affected_files().is_empty());
}

#[test]
fn removing_an_importer_does_not_report_it_affected() {
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app_source()),
        ("tokens.ts", "export const brand = 'red';\n"),
    ]);
    project.parse_file("/proj/App.tsx", app_source());

    write(&fs, "tokens.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/tokens.ts", "export const brand = 'blue';\n");
    project.remove_file("/proj/App.tsx");

    assert!(project.take_affected_files().is_empty());
    assert!(project.importers_of("/proj/tokens.ts").is_empty());
}

#[test]
fn reexport_cycle_does_not_loop() {
    let app = indoc! {r"
        import { brand } from './a';
        import { css } from '@panda/css';
        css({ color: brand });
    "};
    let (fs, mut project) = watch_project(&[
        ("App.tsx", app),
        ("a.ts", "import { brand } from './b';\nexport { brand };\n"),
        ("b.ts", "import { brand } from './a';\nexport { brand };\n"),
    ]);
    project.parse_file("/proj/App.tsx", app);

    write(&fs, "a.ts", "export const brand = 'blue';\n");
    project.parse_file("/proj/a.ts", "export const brand = 'blue';\n");

    assert_eq!(refresh_affected(&mut project, &fs), vec!["/proj/App.tsx"]);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: blue
      conditions: []
    ");
}
