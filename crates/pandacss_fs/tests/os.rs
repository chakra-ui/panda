#![cfg(all(feature = "os", not(target_arch = "wasm32")))]

use std::fs;
use std::path::PathBuf;

use oxc_resolver::FileSystem as OxcResolverFileSystem;
use pandacss_fs::{FileSystem, GlobOptions, OsFileSystem};

#[test]
fn read_write_roundtrip() {
    let tmp = tempfile::tempdir().unwrap();
    let path = tmp.path().join("x.ts");
    fs::write(&path, "hello").unwrap();

    let osfs = OsFileSystem::default();
    assert_eq!(osfs.read_to_string(&path).unwrap(), "hello");

    osfs.write(&path, b"updated").unwrap();
    assert_eq!(fs::read_to_string(&path).unwrap(), "updated");
}

#[test]
fn exists_and_read_dir() {
    let tmp = tempfile::tempdir().unwrap();
    fs::write(tmp.path().join("a.ts"), "").unwrap();
    fs::write(tmp.path().join("b.ts"), "").unwrap();

    let osfs = OsFileSystem::default();
    assert!(osfs.exists(tmp.path()));

    let mut entries = osfs.read_dir(tmp.path()).unwrap();
    entries.sort();
    assert_eq!(entries.len(), 2);
}

#[test]
fn glob_against_real_fs() {
    let tmp = tempfile::tempdir().unwrap();
    fs::create_dir_all(tmp.path().join("src/nested")).unwrap();
    fs::write(tmp.path().join("src/Button.tsx"), "").unwrap();
    fs::write(tmp.path().join("src/helpers.ts"), "").unwrap();
    fs::write(tmp.path().join("src/types.d.ts"), "").unwrap();
    fs::write(tmp.path().join("src/nested/Modal.tsx"), "").unwrap();

    let osfs = OsFileSystem::default();
    let opts = GlobOptions {
        include: vec!["src/**/*.{ts,tsx}".into()],
        cwd: tmp.path().to_path_buf(),
        absolute: true,
        ..Default::default()
    };
    let mut results: Vec<PathBuf> = osfs.glob(&opts).unwrap();
    results.sort();

    // Default exclude drops .d.ts
    assert!(!results
        .iter()
        .any(|p| p.to_string_lossy().ends_with(".d.ts")));
    assert_eq!(results.len(), 3);
    assert!(results.iter().any(|p| p.ends_with("Button.tsx")));
    assert!(results.iter().any(|p| p.ends_with("helpers.ts")));
    assert!(results.iter().any(|p| p.ends_with("Modal.tsx")));
}

#[test]
fn create_dir_all_and_remove_dir_all() {
    let tmp = tempfile::tempdir().unwrap();
    let nested = tmp.path().join("a/b/c");

    let osfs = OsFileSystem::default();
    osfs.create_dir_all(&nested).unwrap();
    assert!(nested.exists());

    osfs.remove_dir_all(&tmp.path().join("a")).unwrap();
    assert!(!tmp.path().join("a").exists());
}
