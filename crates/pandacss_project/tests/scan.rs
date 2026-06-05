use std::path::PathBuf;

use crate::common::create_project;
use pandacss_fs::{GlobOptions, MemoryFileSystem};
use serde_json::json;

fn glob_opts(include: &[&str], exclude: &[&str]) -> GlobOptions {
    GlobOptions {
        include: include
            .iter()
            .map(|pattern| (*pattern).to_string())
            .collect(),
        exclude: exclude
            .iter()
            .map(|pattern| (*pattern).to_string())
            .collect(),
        cwd: PathBuf::from("/proj"),
        absolute: true,
    }
}

#[test]
fn scan_globs_reads_and_parses_via_memory_fs() {
    let mut project = create_project(json!({}));
    let fs = MemoryFileSystem::from_entries([
        (
            "/proj/a.tsx",
            "import { css } from '@panda/css'; css({ color: 'red' })",
        ),
        (
            "/proj/nested/b.tsx",
            "import { css } from '@panda/css'; css({ color: 'blue' })",
        ),
    ]);

    let count =
        pandacss_project::scan_files(&fs, &glob_opts(&["**/*.tsx"], &[]), |path, source| {
            project.parse_file(path, source);
        })
        .expect("glob succeeds");

    assert_eq!(count, 2);
    assert_eq!(project.summary().files_processed, 2);
    assert!(!project.atoms().is_empty());
}

#[test]
fn scan_honors_the_default_dts_exclude() {
    let mut project = create_project(json!({}));
    let fs = MemoryFileSystem::from_entries([
        (
            "/proj/a.tsx",
            "import { css } from '@panda/css'; css({ color: 'red' })",
        ),
        ("/proj/types.d.ts", "export const x: number"),
    ]);

    // Empty exclude → the engine default-excludes `**/*.d.ts` (matches v1).
    let count =
        pandacss_project::scan_files(&fs, &glob_opts(&["**/*.{ts,tsx}"], &[]), |path, source| {
            project.parse_file(path, source);
        })
        .expect("glob succeeds");

    assert_eq!(count, 1);
    assert_eq!(project.summary().files_processed, 1);
}
