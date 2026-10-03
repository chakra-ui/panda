use std::fmt;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use oxc_resolver::{FileMetadata, FileSystem as OxcResolverFileSystem, FileSystemOs, ResolveError};
use rustc_hash::FxHashSet;
use walkdir::WalkDir;

use crate::FileSystem;
use crate::glob::{GlobOptions, SourceMatcher};

/// Native filesystem impl. Reads delegate to `oxc_resolver::FileSystemOs`, writes
/// call `std::fs` directly, and `glob` overrides the default walker with `walkdir`,
/// entering each real directory once however many symlinks lead to it.
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

        let matcher = SourceMatcher::new(opts, Path::to_path_buf);
        let mut walk = Walk {
            matcher: &matcher,
            absolute: opts.absolute,
            visited: FxHashSet::default(),
            links: Vec::new(),
            results: Vec::new(),
        };

        // Per root: plain directories first, so a file is reported under its real
        // spelling; then each symlinked directory whose target wasn't visited.
        for root in matcher.walk_roots() {
            let Ok(real) = std::fs::canonicalize(&root) else {
                continue;
            };
            walk.visited.clear();
            walk.tree(&root, &real)?;
            while !walk.links.is_empty() {
                let mut links = std::mem::take(&mut walk.links);
                links.sort();
                for (link, real) in links {
                    walk.tree(&link, &real)?;
                }
            }
        }

        let mut results = walk.results;
        results.sort();
        Ok(results)
    }
}

struct Walk<'a> {
    matcher: &'a SourceMatcher,
    absolute: bool,
    visited: FxHashSet<PathBuf>,
    links: Vec<(PathBuf, PathBuf)>,
    results: Vec<PathBuf>,
}

impl Walk<'_> {
    /// Walks `start` without following symlinks; `real` is its canonical path.
    fn tree(&mut self, start: &Path, real: &Path) -> io::Result<()> {
        if !self.visited.insert(real.to_path_buf()) {
            return Ok(());
        }
        let matcher = self.matcher;
        let visited = &mut self.visited;
        // `filter_entry` prunes a directory before descending into it.
        let walker = WalkDir::new(start).into_iter().filter_entry(|entry| {
            if entry.depth() == 0 || matcher.is_excluded(&matcher.candidate(entry.path())) {
                return entry.depth() == 0;
            }
            if !entry.file_type().is_dir() {
                return true;
            }
            matcher.may_include_under(entry.path())
                && entry
                    .path()
                    .strip_prefix(start)
                    .is_ok_and(|rest| visited.insert(real.join(rest)))
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

            let path = entry.path();
            let is_file = if entry.path_is_symlink() && entry.depth() > 0 {
                let Ok(target) = std::fs::metadata(path) else {
                    continue;
                };
                if target.is_dir() {
                    if matcher.may_include_under(path)
                        && let Ok(real) = std::fs::canonicalize(path)
                    {
                        self.links.push((path.to_path_buf(), real));
                    }
                    continue;
                }
                target.is_file()
            } else {
                entry.file_type().is_file()
            };

            if is_file && matcher.is_included(&matcher.candidate(path)) {
                self.results.push(if self.absolute {
                    path.to_path_buf()
                } else {
                    matcher.relative_path(path)
                });
            }
        }
        Ok(())
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
