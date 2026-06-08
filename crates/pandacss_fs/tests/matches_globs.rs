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
fn path_outside_cwd_never_matches() {
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
