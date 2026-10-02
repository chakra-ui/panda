//! Single-path classifier used by `isSourceFile` (watch routing). No tree walk.

use std::path::{Path, PathBuf};

use pandacss_fs::{GlobOptions, matches_globs};

fn opts(cwd: &str, include: &[&str], exclude: &[&str]) -> GlobOptions {
    GlobOptions {
        include: include.iter().map(|s| (*s).to_string()).collect(),
        exclude: exclude.iter().map(|s| (*s).to_string()).collect(),
        cwd: PathBuf::from(cwd),
        absolute: true,
    }
}

#[test]
fn matches_plain_include() {
    let o = opts("/proj", &["src/**/*.tsx"], &[]);
    assert!(matches_globs(Path::new("/proj/src/App.tsx"), &o));
    assert!(!matches_globs(Path::new("/proj/src/App.ts"), &o));
}

#[test]
fn dot_slash_prefixed_include_matches() {
    // The A2 regression: `./src/**` must classify the same as `src/**`.
    let o = opts("/proj", &["./src/**/*.tsx"], &[]);
    assert!(matches_globs(Path::new("/proj/src/App.tsx"), &o));
    assert!(matches_globs(Path::new("/proj/src/nested/Modal.tsx"), &o));
}

#[test]
fn dot_slash_with_braces_matches() {
    let o = opts("/proj", &["./src/**/*.{js,jsx,ts,tsx}"], &[]);
    assert!(matches_globs(Path::new("/proj/src/App.tsx"), &o));
    assert!(matches_globs(Path::new("/proj/src/util.ts"), &o));
}

#[test]
fn dot_slash_exclude_still_wins() {
    let o = opts("/proj", &["./src/**/*.ts"], &["./**/*.test.ts"]);
    assert!(matches_globs(Path::new("/proj/src/a.ts"), &o));
    assert!(!matches_globs(Path::new("/proj/src/a.test.ts"), &o));
}

#[test]
fn cwd_relative_include_never_matches_outside_cwd() {
    let o = opts("/proj", &["./src/**/*.tsx"], &[]);
    assert!(!matches_globs(Path::new("/elsewhere/src/App.tsx"), &o));
}

#[test]
fn parent_dir_pattern_is_left_intact() {
    // `../` is not stripped, so it never classifies an in-cwd file as a source.
    let o = opts("/proj", &["../sibling/**/*.tsx"], &[]);
    assert!(!matches_globs(Path::new("/proj/src/App.tsx"), &o));
}

#[test]
fn default_excludes_d_ts() {
    let o = opts("/proj", &["./src/**/*.ts"], &[]);
    assert!(!matches_globs(Path::new("/proj/src/types.d.ts"), &o));
}

#[test]
fn monorepo_parent_dir_include_matches_sibling_package_file() {
    let o = opts(
        "/repo/apps/demo",
        &["src/**/*.tsx", "../../packages/ui/src/**/*.tsx"],
        &[],
    );
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
    assert!(matches_globs(Path::new("/repo/apps/demo/src/App.tsx"), &o));
}

#[test]
fn monorepo_parent_dir_include_does_not_claim_other_packages() {
    let o = opts("/repo/apps/demo", &["../../packages/ui/src/**/*.tsx"], &[]);
    assert!(!matches_globs(
        Path::new("/repo/packages/other/src/Card.tsx"),
        &o
    ));
    assert!(!matches_globs(Path::new("/repo/packages/ui/Card.tsx"), &o));
}

#[test]
fn monorepo_absolute_include_matches_file_outside_cwd() {
    let o = opts("/repo/apps/demo", &["/repo/packages/ui/src/**/*.tsx"], &[]);
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
    assert!(!matches_globs(
        Path::new("/repo/packages/ui/src/Card.ts"),
        &o
    ));
}

#[test]
fn absolute_include_inside_cwd_matches() {
    let o = opts("/proj", &["/proj/src/**/*.tsx"], &[]);
    assert!(matches_globs(Path::new("/proj/src/App.tsx"), &o));
}

#[test]
fn cwd_relative_globstar_does_not_claim_files_outside_cwd() {
    let o = opts("/repo/apps/demo", &["**/*.tsx"], &[]);
    assert!(!matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
    assert!(!matches_globs(Path::new("/elsewhere/App.tsx"), &o));
}

#[test]
fn unnormalized_path_from_a_parent_dir_scan_matches() {
    let o = opts("/repo/apps/demo", &["../../packages/ui/src/**/*.tsx"], &[]);
    assert!(matches_globs(
        Path::new("/repo/apps/demo/../../packages/ui/src/Card.tsx"),
        &o
    ));
}

#[test]
fn dot_slash_parent_dir_include_matches() {
    let o = opts(
        "/repo/apps/demo",
        &["./../../packages/ui/src/**/*.tsx"],
        &[],
    );
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
}

#[test]
fn excludes_apply_to_files_outside_cwd() {
    let o = opts(
        "/repo/apps/demo",
        &["../../packages/ui/src/**/*.tsx"],
        &["**/*.test.tsx"],
    );
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
    assert!(!matches_globs(
        Path::new("/repo/packages/ui/src/Card.test.tsx"),
        &o
    ));
}

#[test]
fn default_d_ts_exclude_applies_outside_cwd() {
    let o = opts("/repo/apps/demo", &["../../packages/ui/src/**/*.ts"], &[]);
    assert!(!matches_globs(
        Path::new("/repo/packages/ui/src/types.d.ts"),
        &o
    ));
}

#[test]
fn absolute_exclude_applies_outside_cwd() {
    let o = opts(
        "/repo/apps/demo",
        &["../../packages/ui/src/**/*.tsx"],
        &["/repo/packages/ui/src/legacy/**"],
    );
    assert!(!matches_globs(
        Path::new("/repo/packages/ui/src/legacy/Old.tsx"),
        &o
    ));
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
}

#[test]
fn relative_path_resolves_against_cwd() {
    let o = opts("/proj", &["src/**/*.tsx"], &[]);
    assert!(matches_globs(Path::new("src/App.tsx"), &o));
    assert!(!matches_globs(Path::new("../other/src/App.tsx"), &o));
}

#[test]
fn parent_dir_in_the_middle_of_an_include_resolves() {
    let o = opts(
        "/repo/apps/demo",
        &["src/../../../packages/ui/src/*.tsx"],
        &[],
    );
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
    assert!(!matches_globs(Path::new("/repo/apps/demo/src/App.tsx"), &o));
}

#[test]
fn current_dir_segments_in_an_include_resolve() {
    let o = opts("/proj", &["./src/./components/**/*.tsx"], &[]);
    assert!(matches_globs(
        Path::new("/proj/src/components/Button.tsx"),
        &o
    ));
}

#[test]
fn parent_dir_in_an_absolute_include_resolves() {
    let o = opts(
        "/repo/apps/demo",
        &["/repo/apps/../packages/ui/src/**/*.tsx"],
        &[],
    );
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
}

#[test]
fn literal_file_include_matches() {
    let o = opts("/repo/apps/demo", &["../../packages/ui/src/Card.tsx"], &[]);
    assert!(matches_globs(
        Path::new("/repo/packages/ui/src/Card.tsx"),
        &o
    ));
    assert!(!matches_globs(
        Path::new("/repo/packages/ui/src/Other.tsx"),
        &o
    ));
}

#[cfg(windows)]
#[test]
fn windows_drive_include_with_backslashes_matches() {
    let o = opts(
        r"C:\repo\apps\demo",
        &[r"C:\repo\packages\ui\src\**\*.tsx"],
        &[],
    );
    assert!(matches_globs(
        Path::new(r"C:\repo\packages\ui\src\Card.tsx"),
        &o
    ));
    assert!(!matches_globs(
        Path::new(r"C:\repo\packages\other\Card.tsx"),
        &o
    ));
}

#[cfg(windows)]
#[test]
fn windows_parent_dir_include_matches_backslash_path() {
    let o = opts(
        r"C:\repo\apps\demo",
        &["../../packages/ui/src/**/*.tsx"],
        &[],
    );
    assert!(matches_globs(
        Path::new(r"C:\repo\packages\ui\src\Card.tsx"),
        &o
    ));
}
