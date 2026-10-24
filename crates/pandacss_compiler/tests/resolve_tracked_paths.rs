//! `resolve_tracked_paths`: tracked paths skip the filesystem, and a batch
//! resolves the include roots once.

use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use oxc_resolver::{FileMetadata, FileSystem as OxcFileSystem, ResolveError};
use pandacss_compiler::{SourceGlobOverrides, resolve_tracked_paths, source_glob_options};
use pandacss_fs::{FileSystem, GlobOptions, MemoryFileSystem};
use pandacss_project::Project;
use pandacss_system::System;
use serde_json::json;

#[derive(Clone)]
struct CountingFileSystem {
    inner: MemoryFileSystem,
    probes: Arc<AtomicUsize>,
}

impl CountingFileSystem {
    fn new(inner: MemoryFileSystem) -> Self {
        Self {
            inner,
            probes: Arc::default(),
        }
    }

    fn reset(&self) {
        self.probes.store(0, Ordering::Relaxed);
    }

    fn probes(&self) -> usize {
        self.probes.load(Ordering::Relaxed)
    }

    fn record_probe(&self) {
        self.probes.fetch_add(1, Ordering::Relaxed);
    }
}

impl FileSystem for CountingFileSystem {
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()> {
        self.inner.write(path, content)
    }

    fn create_dir_all(&self, path: &Path) -> io::Result<()> {
        self.inner.create_dir_all(path)
    }

    fn remove_file(&self, path: &Path) -> io::Result<()> {
        self.inner.remove_file(path)
    }

    fn remove_dir_all(&self, path: &Path) -> io::Result<()> {
        self.inner.remove_dir_all(path)
    }

    fn exists(&self, path: &Path) -> bool {
        self.inner.exists(path)
    }

    fn read_dir(&self, path: &Path) -> io::Result<Vec<PathBuf>> {
        self.inner.read_dir(path)
    }
}

impl OxcFileSystem for CountingFileSystem {
    fn new() -> Self {
        Self::new(MemoryFileSystem::new())
    }

    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        self.record_probe();
        OxcFileSystem::read(&self.inner, path)
    }

    fn read_to_string(&self, path: &Path) -> io::Result<String> {
        self.record_probe();
        OxcFileSystem::read_to_string(&self.inner, path)
    }

    fn metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.record_probe();
        self.inner.metadata(path)
    }

    fn symlink_metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.record_probe();
        self.inner.symlink_metadata(path)
    }

    fn read_link(&self, path: &Path) -> Result<PathBuf, ResolveError> {
        self.record_probe();
        self.inner.read_link(path)
    }

    fn canonicalize(&self, path: &Path) -> io::Result<PathBuf> {
        self.record_probe();
        self.inner.canonicalize(path)
    }
}

fn setup() -> (Project, CountingFileSystem, GlobOptions) {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "cwd": "/repo",
        "include": ["src/**/*.tsx", "../packages/ui/src/**/*.tsx", "../packages/icons/src/**/*.tsx"]
    }))
    .expect("valid serialized config");
    let fs = CountingFileSystem::new(MemoryFileSystem::from_entries([
        ("/repo/src/a.tsx", "export const a = 1"),
        ("/packages/ui/src/b.tsx", "export const b = 1"),
        ("/packages/ui/src/c.tsx", "export const c = 1"),
        ("/packages/icons/src/d.tsx", "export const d = 1"),
    ]));
    let opts = source_glob_options(&config, SourceGlobOverrides::default());
    let mut project = Project::new(System::new(config).expect("valid project config"));
    project.parse_file("/repo/src/a.tsx", "export const a = 1");
    (project, fs, opts)
}

fn paths(items: &[&str]) -> Vec<String> {
    items.iter().map(|path| (*path).to_owned()).collect()
}

#[test]
fn tracked_paths_skip_the_filesystem() {
    let (project, fs, opts) = setup();

    let resolved = resolve_tracked_paths(&project, &fs, &opts, paths(&["/repo/src/a.tsx"]));

    assert_eq!(resolved, ["/repo/src/a.tsx"]);
    assert_eq!(fs.probes(), 0);
}

#[test]
fn a_batch_resolves_include_roots_once() {
    let (project, fs, opts) = setup();
    let untracked = [
        "/packages/ui/src/b.tsx",
        "/packages/ui/src/c.tsx",
        "/packages/icons/src/d.tsx",
    ];

    let mut one_by_one = Vec::new();
    let mut one_by_one_probes = 0;
    for path in untracked {
        fs.reset();
        one_by_one.extend(resolve_tracked_paths(&project, &fs, &opts, paths(&[path])));
        one_by_one_probes += fs.probes();
    }
    fs.reset();
    let batched = resolve_tracked_paths(&project, &fs, &opts, paths(&untracked));

    assert_eq!(batched, one_by_one);
    assert_eq!(batched, untracked);
    // `cwd` and the three include roots: one-by-one resolves them per path, the batch once.
    let roots = 4;
    assert_eq!(
        fs.probes(),
        one_by_one_probes - (untracked.len() - 1) * roots
    );
}
