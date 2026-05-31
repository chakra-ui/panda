use std::path::PathBuf;

use pandacss_fs::{GlobOptions, walk_roots};

fn roots(cwd: &str, include: &[&str]) -> Vec<PathBuf> {
    walk_roots(&GlobOptions {
        include: include.iter().map(|s| (*s).to_string()).collect(),
        cwd: PathBuf::from(cwd),
        ..Default::default()
    })
}

#[test]
fn hoists_base_dir_into_root() {
    assert_eq!(
        roots("/proj", &["src/**/*.tsx"]),
        [PathBuf::from("/proj/src")]
    );
}

#[test]
fn empty_base_collapses_to_cwd() {
    assert_eq!(roots("/proj", &["**/*.tsx"]), [PathBuf::from("/proj")]);
}

#[test]
fn nested_roots_drop_under_their_ancestor() {
    assert_eq!(
        roots("/proj", &["**/*.tsx", "src/**/*.ts"]),
        [PathBuf::from("/proj")]
    );
}

#[test]
fn disjoint_roots_are_all_kept() {
    assert_eq!(
        roots("/proj", &["src/**/*.tsx", "lib/**/*.ts"]),
        [PathBuf::from("/proj/lib"), PathBuf::from("/proj/src")]
    );
}

#[test]
fn similar_prefixes_are_not_treated_as_nested() {
    // `proj` is not an ancestor of `project` — matching is component-wise.
    assert_eq!(
        roots("/", &["proj/**/*.ts", "project/**/*.ts"]),
        [PathBuf::from("/proj"), PathBuf::from("/project")]
    );
}
