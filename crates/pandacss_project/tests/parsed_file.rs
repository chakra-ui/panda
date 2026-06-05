//! Read-only `ParsedFile` view behavior.

use crate::common::create_project;
use indoc::indoc;
use pandacss_project::DiagnosticSeverity;
use serde_json::json;

#[test]
fn get_file_returns_none_for_unknown_path() {
    let project = create_project(json!({}));
    assert!(project.get_file("never-parsed.tsx").is_none());
}

#[test]
fn parsed_file_exposes_path_metadata() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "src/ui/button.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    let view = project
        .get_file("src/ui/button.tsx")
        .expect("button.tsx parsed");
    assert_eq!(view.path(), "src/ui/button.tsx");
    assert_eq!(view.basename(), "button.tsx");
    assert_eq!(view.extension(), "tsx");
    assert_eq!(view.directory(), "src/ui");
}

#[test]
fn parsed_file_extension_empty_when_filename_has_none() {
    let mut project = create_project(json!({}));
    project.parse_file("Makefile", "import { css } from '@panda/css';");
    let view = project.get_file("Makefile").expect("file parsed");
    assert_eq!(view.basename(), "Makefile");
    assert_eq!(view.extension(), "");
    assert_eq!(view.directory(), "");
}

#[test]
fn parsed_file_surfaces_diagnostics_per_file() {
    let mut project = create_project(json!({}));
    let report = project.parse_file("broken.tsx", "import { css } from");
    assert!(
        !report.diagnostics.is_empty(),
        "ParseFileReport carries the list"
    );
    assert_eq!(report.diagnostics[0].severity, DiagnosticSeverity::Error);

    let view = project.get_file("broken.tsx").expect("file recorded");
    assert_eq!(
        view.diagnostics().len(),
        report.diagnostics.len(),
        "ParsedFile mirrors the ParseFileReport list"
    );
    assert_eq!(view.diagnostics()[0].severity, DiagnosticSeverity::Error);
}

#[test]
fn parsed_file_diagnostics_empty_for_clean_files() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "clean.tsx",
        "import { css } from '@panda/css';\ncss({ color: 'red' });",
    );
    let view = project.get_file("clean.tsx").expect("file parsed");
    assert!(view.diagnostics().is_empty());
}

#[test]
fn get_file_exposes_atoms_and_per_file_recipes() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css, cva } from '@panda/css';
            css({ color: 'red' });
            const button = cva({ base: { padding: '4px' } });
        "},
    );
    project.parse_file(
        "card.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ margin: '8px' });
        "},
    );
    let view = project.get_file("button.tsx").expect("button.tsx parsed");
    assert_eq!(view.path(), "button.tsx");
    assert!(view.atoms().iter().all(|a| a.prop() != "margin"));
    let recipes: Vec<_> = view.recipes().map(|(_, r)| r.clone()).collect();
    assert_eq!(recipes.len(), 1);
    assert!(view.slot_recipes().next().is_none());
}
