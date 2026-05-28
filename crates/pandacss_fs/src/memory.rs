use std::io;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

use oxc_resolver::{FileMetadata, FileSystem as OxcResolverFileSystem, ResolveError};
use rustc_hash::{FxHashMap, FxHashSet};

use crate::FileSystem;

/// In-memory filesystem. Backed by a `FxHashMap<PathBuf, Vec<u8>>` for content and a
/// `FxHashSet<PathBuf>` for directories. Mutations go through `&self` via `RwLock`
/// so the FS can be shared via `Arc<MemoryFileSystem>` without coordinating mutable
/// borrows — important for the wasm playground where React effects push files into
/// a shared handle.
#[derive(Default, Clone, Debug)]
pub struct MemoryFileSystem {
    inner: Arc<RwLock<MemoryState>>,
}

#[derive(Default, Debug)]
struct MemoryState {
    files: FxHashMap<PathBuf, Vec<u8>>,
    dirs: FxHashSet<PathBuf>,
}

impl MemoryFileSystem {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Bulk-load from `(path, content)` pairs.
    ///
    /// Named distinct from `FromIterator::from_iter` because `MemoryFileSystem`
    /// itself isn't a collection — we don't want callers to expect
    /// `iter.collect::<MemoryFileSystem>()` to work.
    ///
    /// # Panics
    /// Panics if the internal lock is poisoned (only possible if another
    /// thread panicked while holding it).
    pub fn from_entries<I, P, C>(entries: I) -> Self
    where
        I: IntoIterator<Item = (P, C)>,
        P: Into<PathBuf>,
        C: Into<Vec<u8>>,
    {
        let fs = Self::new();
        for (path, content) in entries {
            fs.add_file(path.into(), content.into());
        }
        fs
    }

    /// Add or replace a file. Auto-registers every ancestor as a directory.
    ///
    /// # Panics
    /// Panics if the internal lock is poisoned.
    pub fn add_file(&self, path: PathBuf, content: Vec<u8>) {
        let mut state = self.inner.write().expect("memory FS poisoned");
        Self::register_ancestors(&mut state.dirs, &path);
        state.files.insert(path, content);
    }

    /// Snapshot of all `(path, content)` entries. Test helper; allocates.
    ///
    /// # Panics
    /// Panics if the internal lock is poisoned.
    #[must_use]
    pub fn snapshot(&self) -> Vec<(PathBuf, Vec<u8>)> {
        let state = self.inner.read().expect("memory FS poisoned");
        state
            .files
            .iter()
            .map(|(p, c)| (p.clone(), c.clone()))
            .collect()
    }

    /// Number of files stored.
    ///
    /// # Panics
    /// Panics if the internal lock is poisoned.
    #[must_use]
    pub fn len(&self) -> usize {
        self.inner.read().expect("memory FS poisoned").files.len()
    }

    /// # Panics
    /// Panics if the internal lock is poisoned.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner
            .read()
            .expect("memory FS poisoned")
            .files
            .is_empty()
    }

    fn register_ancestors(dirs: &mut FxHashSet<PathBuf>, path: &Path) {
        for ancestor in path.ancestors().skip(1) {
            if ancestor.as_os_str().is_empty() {
                break;
            }
            dirs.insert(ancestor.to_path_buf());
        }
    }
}

impl FileSystem for MemoryFileSystem {
    fn write(&self, path: &Path, content: &[u8]) -> io::Result<()> {
        self.add_file(path.to_path_buf(), content.to_vec());
        Ok(())
    }

    fn create_dir_all(&self, path: &Path) -> io::Result<()> {
        let mut state = self.inner.write().expect("memory FS poisoned");
        Self::register_ancestors(&mut state.dirs, path);
        state.dirs.insert(path.to_path_buf());
        Ok(())
    }

    fn remove_file(&self, path: &Path) -> io::Result<()> {
        let mut state = self.inner.write().expect("memory FS poisoned");
        if state.files.remove(path).is_none() {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                format!("file not found: {}", path.display()),
            ));
        }
        Ok(())
    }

    fn remove_dir_all(&self, path: &Path) -> io::Result<()> {
        let mut state = self.inner.write().expect("memory FS poisoned");
        let prefix = path.to_path_buf();
        state.files.retain(|p, _| !p.starts_with(&prefix));
        state
            .dirs
            .retain(|p| p != &prefix && !p.starts_with(&prefix));
        Ok(())
    }

    fn exists(&self, path: &Path) -> bool {
        let state = self.inner.read().expect("memory FS poisoned");
        state.files.contains_key(path) || state.dirs.contains(path)
    }

    fn read_dir(&self, path: &Path) -> io::Result<Vec<PathBuf>> {
        let state = self.inner.read().expect("memory FS poisoned");
        // Empty path and "/" act as implicit roots; otherwise require an
        // explicit dir entry.
        if !state.dirs.contains(path) && path.as_os_str() != "/" && path.as_os_str() != "" {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                format!("directory not found: {}", path.display()),
            ));
        }
        // This memory FS is intentionally optimized for simple fixtures and
        // wasm-backed virtual filesystems. Directory listing scans the current
        // path set instead of maintaining a children index; production OS
        // traversal uses `OsFileSystem`.
        let mut entries: Vec<PathBuf> = Vec::new();
        for p in state.files.keys() {
            if p.parent() == Some(path) {
                entries.push(p.clone());
            }
        }
        for d in &state.dirs {
            if d.parent() == Some(path) {
                entries.push(d.clone());
            }
        }
        entries.sort();
        entries.dedup();
        Ok(entries)
    }
}

impl OxcResolverFileSystem for MemoryFileSystem {
    fn new() -> Self {
        Self::default()
    }

    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        let state = self.inner.read().expect("memory FS poisoned");
        state.files.get(path).cloned().ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::NotFound,
                format!("file not found: {}", path.display()),
            )
        })
    }

    fn read_to_string(&self, path: &Path) -> io::Result<String> {
        let bytes = self.read(path)?;
        String::from_utf8(bytes)
            .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err.to_string()))
    }

    fn metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        let state = self.inner.read().expect("memory FS poisoned");
        let is_file = state.files.contains_key(path);
        let is_dir = state.dirs.contains(path);
        if !is_file && !is_dir {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                format!("path not found: {}", path.display()),
            ));
        }
        Ok(FileMetadata::new(is_file, is_dir, false))
    }

    fn symlink_metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        // No symlinks in MemoryFileSystem; treat as identical to metadata.
        self.metadata(path)
    }

    fn read_link(&self, _path: &Path) -> Result<PathBuf, ResolveError> {
        Err(ResolveError::from(io::Error::new(
            io::ErrorKind::NotFound,
            "MemoryFileSystem does not model symlinks",
        )))
    }

    fn canonicalize(&self, path: &Path) -> io::Result<PathBuf> {
        self.metadata(path)?;
        Ok(path.to_path_buf())
    }
}
