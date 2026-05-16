use std::path::{Path, PathBuf};

use pandacss_fs::{FileSystem, GlobOptions, MemoryFileSystem};
use serde::Deserialize;
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
        self.inner.add_file(PathBuf::from(path), content.into_bytes());
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

    /// Glob discovery. Mirrors `Runtime.fs.glob` from `@pandacss/types`.
    /// `opts` shape: `{ include: string[], exclude?: string[], cwd?: string, absolute?: boolean }`.
    ///
    /// # Errors
    /// Returns a JS error string when `opts` isn't a valid `GlobOptions`
    /// shape or when an I/O error bubbles up from the walker (e.g.
    /// non-existent `cwd`).
    pub fn glob(&self, opts: JsValue) -> Result<JsValue, JsValue> {
        let parsed: GlobInput = serde_wasm_bindgen::from_value(opts)
            .map_err(|err| JsValue::from_str(&format!("invalid GlobOptions: {err}")))?;
        let options = GlobOptions {
            include: parsed.include,
            exclude: parsed.exclude.unwrap_or_default(),
            cwd: parsed.cwd.map_or_else(|| PathBuf::from("/"), PathBuf::from),
            absolute: parsed.absolute.unwrap_or(true),
        };
        let paths = self
            .inner
            .glob(&options)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let strings: Vec<String> = paths
            .into_iter()
            .map(|p| p.to_string_lossy().into_owned())
            .collect();
        serde_wasm_bindgen::to_value(&strings)
            .map_err(|err| JsValue::from_str(&err.to_string()))
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

#[derive(Deserialize)]
struct GlobInput {
    include: Vec<String>,
    exclude: Option<Vec<String>>,
    cwd: Option<String>,
    absolute: Option<bool>,
}

