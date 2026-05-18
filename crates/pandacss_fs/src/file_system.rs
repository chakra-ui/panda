use std::io;
use std::path::{Path, PathBuf};

use oxc_resolver::FileSystem as OxcResolverFileSystem;

/// Filesystem abstraction over the Panda Rust pipeline.
///
/// Inherits read primitives from [`oxc_resolver::FileSystem`] (`read`, `read_to_string`,
/// `metadata`, `symlink_metadata`, `read_link`, `canonicalize`) so the resolver can use any
/// `FileSystem` impl. Adds the write side plus `read_dir`, `exists`, and `glob`.
///
/// **Not object-safe** because `oxc_resolver::FileSystem::new() -> Self` is an associated
/// function returning `Self`. Consumer crates take `F: FileSystem` generic parameters rather
/// than `Arc<dyn FileSystem>`. This matches rolldown's pattern.
pub trait FileSystem: Send + Sync + OxcResolverFileSystem {
    /// Write `content` to `path`, creating the file or truncating an existing one.
    ///
    /// # Errors
    /// See [`std::fs::write`].
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()>;

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

    /// Find files matching `opts.include` under `opts.cwd`, skipping any path whose
    /// relative form matches a pattern in `opts.exclude`. Default impl walks via
    /// [`Self::read_dir`] + `fast-glob` matchers; OS impl overrides with `walkdir`
    /// for native-fast traversal.
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
