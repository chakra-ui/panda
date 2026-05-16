#![cfg(feature = "memory")]

use std::path::{Path, PathBuf};

use oxc_resolver::FileSystem as OxcResolverFileSystem;
use pandacss_fs::{FileSystem, MemoryFileSystem};

#[test]
fn add_and_read_file() {
    let fs = MemoryFileSystem::new();
    fs.add_file(PathBuf::from("/src/Button.tsx"), b"hello".to_vec());

    assert_eq!(
        fs.read_to_string(Path::new("/src/Button.tsx")).unwrap(),
        "hello"
    );
    assert!(fs.exists(Path::new("/src/Button.tsx")));
}

#[test]
fn ancestors_register_as_dirs() {
    let fs = MemoryFileSystem::new();
    fs.add_file(PathBuf::from("/a/b/c.txt"), b"x".to_vec());

    assert!(fs.exists(Path::new("/a")));
    assert!(fs.exists(Path::new("/a/b")));
    assert!(fs.metadata(Path::new("/a/b")).unwrap().is_dir());
    assert!(fs.metadata(Path::new("/a/b/c.txt")).unwrap().is_file());
}

#[test]
fn read_dir_lists_entries() {
    let fs = MemoryFileSystem::from_entries([
        ("/src/a.ts", "x"),
        ("/src/b.ts", "y"),
        ("/src/nested/c.ts", "z"),
    ]);

    let mut entries = fs.read_dir(Path::new("/src")).unwrap();
    entries.sort();
    assert_eq!(
        entries,
        vec![
            PathBuf::from("/src/a.ts"),
            PathBuf::from("/src/b.ts"),
            PathBuf::from("/src/nested"),
        ]
    );
}

#[test]
fn write_via_trait_round_trips() {
    let fs = MemoryFileSystem::new();
    fs.write(Path::new("/x.ts"), b"const x = 1").unwrap();
    assert_eq!(fs.read_to_string(Path::new("/x.ts")).unwrap(), "const x = 1");
}

#[test]
fn remove_file_drops_entry() {
    let fs = MemoryFileSystem::from_entries([("/a.ts", "x")]);
    fs.remove_file(Path::new("/a.ts")).unwrap();
    assert!(!fs.exists(Path::new("/a.ts")));
    assert!(fs.read(Path::new("/a.ts")).is_err());
}

#[test]
fn remove_dir_all_drops_subtree() {
    let fs = MemoryFileSystem::from_entries([
        ("/a/b/x.ts", "x"),
        ("/a/b/y.ts", "y"),
        ("/a/c.ts", "z"),
    ]);
    fs.remove_dir_all(Path::new("/a/b")).unwrap();
    assert!(!fs.exists(Path::new("/a/b/x.ts")));
    assert!(!fs.exists(Path::new("/a/b")));
    assert!(fs.exists(Path::new("/a/c.ts")));
}

#[test]
fn metadata_distinguishes_files_and_dirs() {
    let fs = MemoryFileSystem::from_entries([("/src/x.ts", "x")]);
    assert!(fs.metadata(Path::new("/src/x.ts")).unwrap().is_file());
    assert!(fs.metadata(Path::new("/src")).unwrap().is_dir());
    assert!(fs.metadata(Path::new("/missing")).is_err());
}

#[test]
fn read_missing_file_errors() {
    let fs = MemoryFileSystem::new();
    let err = fs.read_to_string(Path::new("/nope")).unwrap_err();
    assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
}

#[test]
fn snapshot_returns_all_files() {
    let fs = MemoryFileSystem::from_entries([("/a.ts", "x"), ("/b.ts", "y")]);
    let mut snap = fs.snapshot();
    snap.sort();
    assert_eq!(snap.len(), 2);
}

#[test]
fn clone_shares_state() {
    let fs = MemoryFileSystem::new();
    let fs2 = fs.clone();
    fs.add_file(PathBuf::from("/x.ts"), b"x".to_vec());
    // Both handles see the same data
    assert!(fs2.exists(Path::new("/x.ts")));
}
