use std::io;
use std::path::{Path, PathBuf};

use oxc_resolver::FileSystem as OxcResolverFileSystem;

/// Filesystem abstraction over the Panda Rust pipeline. Inherits read primitives
/// (`read`, `read_to_string`, `metadata`, `symlink_metadata`, `read_link`,
/// `canonicalize`) from [`oxc_resolver::FileSystem`] and adds writes, `read_dir`,
/// `exists`, and `glob`.
///
/// Not object-safe: `oxc_resolver::FileSystem::new() -> Self` returns `Self`, so
/// consumers take a generic `F: FileSystem` rather than `Arc<dyn FileSystem>`.
pub trait FileSystem: Send + Sync + OxcResolverFileSystem {
    /// Writes `content` to `path`, creating or truncating it.
    ///
    /// # Errors
    /// See [`std::fs::write`].
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()>;

    /// Writes `content` only when it differs from the on-disk bytes. Returns
    /// whether it wrote.
    ///
    /// # Errors
    /// Propagates any read error except `NotFound`, plus any write error.
    fn write_if_changed(&self, path: &Path, content: &[u8]) -> io::Result<bool> {
        match self.read(path) {
            Ok(existing) if existing == content => Ok(false),
            Ok(_) => {
                self.write(path, content)?;
                Ok(true)
            }
            Err(err) if err.kind() == io::ErrorKind::NotFound => {
                self.write(path, content)?;
                Ok(true)
            }
            Err(err) => Err(err),
        }
    }

    /// Recursively create directories. No-op on existing paths.
    ///
    /// # Errors
    /// See [`std::fs::create_dir_all`].
    fn create_dir_all(&self, path: &Path) -> io::Result<()>;

    /// Remove a single file.
    ///
    /// # Errors
    /// See [`std::fs::remove_file`].
    fn remove_file(&self, path: &Path) -> io::Result<()>;

    /// Recursively remove a directory and all contents.
    ///
    /// # Errors
    /// See [`std::fs::remove_dir_all`].
    fn remove_dir_all(&self, path: &Path) -> io::Result<()>;

    /// `true` when `path` exists (as a file or directory).
    fn exists(&self, path: &Path) -> bool;

    /// List immediate entries of `path`. Returns absolute paths into the same FS.
    /// Order is impl-defined; callers should sort for determinism.
    ///
    /// # Errors
    /// See [`std::fs::read_dir`].
    fn read_dir(&self, path: &Path) -> io::Result<Vec<PathBuf>>;

    /// Files matching `opts.include` under `opts.cwd`, minus `opts.exclude`.
    /// Default impl walks via [`Self::read_dir`] + `fast-glob`; `OsFileSystem`
    /// overrides with `walkdir` for native-fast traversal.
    ///
    /// # Errors
    /// Propagates any error from `read_dir` or `metadata`.
    fn glob(&self, opts: &crate::glob::GlobOptions) -> io::Result<Vec<PathBuf>>
    where
        Self: Sized,
    {
        crate::glob::default_walk(self, opts)
    }
}
