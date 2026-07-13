use std::fmt;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use oxc_resolver::{FileMetadata, FileSystem as OxcResolverFileSystem, FileSystemOs, ResolveError};
use walkdir::WalkDir;

use crate::FileSystem;
use crate::glob::{GlobOptions, effective_excludes, matches_any, relative_to};

/// Native filesystem impl. Reads delegate to `oxc_resolver::FileSystemOs`, writes
/// call `std::fs` directly, and `glob` overrides the default walker with `walkdir`.
#[derive(Clone)]
pub struct OsFileSystem(Arc<FileSystemOs>);

impl Default for OsFileSystem {
    fn default() -> Self {
        Self(Arc::new(FileSystemOs::new()))
    }
}

impl fmt::Debug for OsFileSystem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("OsFileSystem").finish()
    }
}

impl FileSystem for OsFileSystem {
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()> {
        std::fs::write(path, content)
    }

    fn create_dir_all(&self, path: &Path) -> io::Result<()> {
        std::fs::create_dir_all(path)
    }

    fn remove_file(&self, path: &Path) -> io::Result<()> {
        std::fs::remove_file(path)
    }

    fn remove_dir_all(&self, path: &Path) -> io::Result<()> {
        std::fs::remove_dir_all(path)
    }

    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn read_dir(&self, path: &Path) -> io::Result<Vec<PathBuf>> {
        let mut entries = Vec::new();
        for entry in std::fs::read_dir(path)? {
            entries.push(entry?.path());
        }
        Ok(entries)
    }

    fn glob(&self, opts: &GlobOptions) -> io::Result<Vec<PathBuf>>
    where
        Self: Sized,
    {
        if opts.include.is_empty() {
            return Ok(Vec::new());
        }

        let excludes = effective_excludes(opts);

        let mut results: Vec<PathBuf> = Vec::new();

        // Disjoint hoisted base dirs, so no path is visited twice.
        for root in crate::glob::walk_roots(opts) {
            // `filter_entry` prunes a directory before descending into it.
            let walker = WalkDir::new(&root)
                .follow_links(true)
                .into_iter()
                .filter_entry(|entry| {
                    let rel = relative_to(entry.path(), &opts.cwd);
                    let rel_str = rel.to_string_lossy();
                    if rel_str.is_empty() {
                        return true; // root
                    }
                    let rel_bytes = rel_str.as_bytes();
                    !matches_any(&excludes, rel_bytes)
                });

            for entry in walker {
                // Tolerate permission/missing-dir errors mid-walk; fail on anything else.
                let entry = match entry {
                    Ok(e) => e,
                    Err(err)
                        if err.io_error().is_some_and(|e| {
                            matches!(
                                e.kind(),
                                io::ErrorKind::PermissionDenied | io::ErrorKind::NotFound
                            )
                        }) =>
                    {
                        continue;
                    }
                    Err(err) => return Err(io::Error::other(err)),
                };

                if !entry.file_type().is_file() {
                    continue;
                }

                let rel = relative_to(entry.path(), &opts.cwd);
                let rel_str = rel.to_string_lossy();
                let rel_bytes = rel_str.as_bytes();

                if matches_any(&opts.include, rel_bytes) {
                    if opts.absolute {
                        results.push(entry.path().to_path_buf());
                    } else {
                        results.push(rel.to_path_buf());
                    }
                }
            }
        }

        results.sort();
        Ok(results)
    }
}

impl OxcResolverFileSystem for OsFileSystem {
    fn new() -> Self {
        Self::default()
    }

    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        self.0.read(path)
    }

    fn read_to_string(&self, path: &Path) -> io::Result<String> {
        self.0.read_to_string(path)
    }

    fn metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.0.metadata(path)
    }

    fn symlink_metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        self.0.symlink_metadata(path)
    }

    fn read_link(&self, path: &Path) -> Result<PathBuf, ResolveError> {
        self.0.read_link(path)
    }

    fn canonicalize(&self, path: &Path) -> io::Result<PathBuf> {
        self.0.canonicalize(path)
    }
}
