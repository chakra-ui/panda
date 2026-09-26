//! WASM `WasmProject` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration over a `WasmFileSystem` handle. Atoms +
//! recipes accumulate across `parseFile` calls. Cross-file folding shares
//! the same in-memory FS so `import { x } from './tokens'` resolves
//! through whatever the JS host has populated.

mod build_info;
mod codegen;
mod config;
mod css;
mod design_system;
mod files;
mod interop;
mod introspect;
mod recipes;
mod serde_types;
mod transforms;

use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use pandacss_compiler::{LoadSystemError, LoadedSystem, TransformCache};
use pandacss_config::UserConfig;
use pandacss_fs::{MemoryFileSystem, PosixPathSystem};

use self::interop::with_wasm_fs;
use self::transforms::{resolve_utility_values_callbacks, utility_value_callbacks_from_options};

/// JS-facing project handle. Constructed once per session with a
/// [`WasmFileSystem`] (whose contents the cross-file resolver reads),
/// plus a resolved Panda config snapshot.
///
/// ```js
/// const fs = new WasmFileSystem()
/// fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444';")
/// fs.addFile('/proj/main.tsx', "import { brand } from './tokens'\ncss({ color: brand })")
/// const compiler = WasmCompiler.fromConfig(fs, config)
/// project.parseFile('/proj/main.tsx', fs.readFile('/proj/main.tsx'))
/// const atoms = project.atoms()
/// ```
#[wasm_bindgen]
pub struct WasmCompiler {
    inner: pandacss_project::Project,
    config: serde_json::Value,
    user_config: UserConfig,
    callbacks: CallbackHost,
    /// In-memory filesystem engine, shared with the cross-file resolver and the
    /// JS-facing `WasmFileSystem` handle. Used by `glob`/`scan` to discover +
    /// read the source files the host staged via `addFile`.
    fs: MemoryFileSystem,
    paths: PosixPathSystem,
}

struct CallbackHost {
    utility_transform_refs: HashMap<String, String>,
    pattern_transform_refs: HashMap<String, String>,
    utility_transforms: HashMap<String, js_sys::Function>,
    pattern_transforms: HashMap<String, js_sys::Function>,
    source_transforms: Vec<(String, SourceTransformCallback)>,
    transform_cache: TransformCache,
}

struct SourceTransformCallback {
    filter: pandacss_compiler::HookFilter,
    callback: js_sys::Function,
}

impl CallbackHost {
    fn from_config(config: &UserConfig) -> Self {
        Self {
            utility_transform_refs: pandacss_compiler::utility_transform_refs(config),
            pattern_transform_refs: pandacss_compiler::pattern_transform_refs(config),
            utility_transforms: HashMap::new(),
            pattern_transforms: HashMap::new(),
            source_transforms: Vec::new(),
            transform_cache: TransformCache::default(),
        }
    }

    fn has_source_transforms(&self) -> bool {
        !self.source_transforms.is_empty()
    }

    fn has_pattern_transforms(&self) -> bool {
        !self.pattern_transforms.is_empty()
    }

    fn has_utility_transforms(&self) -> bool {
        !self.utility_transforms.is_empty()
    }
}

#[wasm_bindgen]
impl WasmCompiler {
    /// Construct a compiler from the resolved, JSON-safe Panda config snapshot.
    ///
    /// # Errors
    /// Returns a JS error when `config` doesn't deserialize into JSON.
    #[wasm_bindgen(js_name = fromConfig)]
    pub fn from_config(
        fs: &WasmFileSystem,
        config: JsValue,
        options: &JsValue,
    ) -> Result<WasmCompiler, JsValue> {
        let utility_values_callbacks = utility_value_callbacks_from_options(options)?;

        let config_value: serde_json::Value = serde_wasm_bindgen::from_value(config)
            .map_err(|err| JsValue::from_str(&format!("invalid config: {err}")))?;
        let LoadedSystem {
            system,
            user_config,
            snapshot: config_snapshot,
        } = pandacss_compiler::load_system(config_value, |config, token_dictionary| {
            resolve_utility_values_callbacks(config, token_dictionary, &utility_values_callbacks)
        })
        .map_err(|err| match err {
            LoadSystemError::Host(err) => err,
            err => JsValue::from_str(&err.message().unwrap_or_default()),
        })?;
        let callbacks = CallbackHost::from_config(&user_config);
        let project = pandacss_project::Project::new(system);

        Ok(Self {
            inner: with_wasm_fs(project, fs),
            config: config_snapshot,
            user_config,
            callbacks,
            fs: fs.inner.clone(),
            paths: PosixPathSystem,
        })
    }
}
