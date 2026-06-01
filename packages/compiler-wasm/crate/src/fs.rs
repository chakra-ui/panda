use std::path::{Path, PathBuf};

use pandacss_fs::{FileSystem, MemoryFileSystem};
use wasm_bindgen::prelude::*;

/// JS-facing handle over [`MemoryFileSystem`]. Cheap to clone — shares
/// state via `Arc<RwLock>` internally — so the JS host can pass the same
/// handle into multiple `WasmExtractor` instances and edits flow through
/// to all consumers.
#[wasm_bindgen]
pub struct WasmFileSystem {
    pub(crate) inner: MemoryFileSystem,
}

#[wasm_bindgen]
impl WasmFileSystem {
    #[wasm_bindgen(constructor)]
    #[must_use]
    pub fn new() -> Self {
        Self {
            inner: MemoryFileSystem::new(),
        }
    }

    /// Write or overwrite a file. Parent dirs auto-register.
    #[wasm_bindgen(js_name = addFile)]
    pub fn add_file(&self, path: String, content: String) {
        self.inner
            .add_file(PathBuf::from(path), content.into_bytes());
    }

    /// `true` when the file existed and was removed.
    #[wasm_bindgen(js_name = removeFile)]
    #[must_use]
    pub fn remove_file(&self, path: &str) -> bool {
        self.inner.remove_file(Path::new(path)).is_ok()
    }

    /// `true` when `path` exists as file or directory.
    #[must_use]
    pub fn exists(&self, path: &str) -> bool {
        self.inner.exists(Path::new(path))
    }

    /// Read a file. Returns `undefined` when missing.
    #[wasm_bindgen(js_name = readFile)]
    #[must_use]
    pub fn read_file(&self, path: &str) -> Option<String> {
        // `read_to_string` is inherited from `oxc_resolver::FileSystem` via the
        // `pandacss_fs::FileSystem` supertrait.
        <MemoryFileSystem as pandacss_fs::OxcResolverFileSystem>::read_to_string(
            &self.inner,
            Path::new(path),
        )
        .ok()
    }

    /// Number of files stored. Convenience for diagnostics / tests.
    #[wasm_bindgen(js_name = fileCount)]
    #[must_use]
    pub fn file_count(&self) -> usize {
        self.inner.len()
    }
}

impl Default for WasmFileSystem {
    fn default() -> Self {
        Self::new()
    }
}
