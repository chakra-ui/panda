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
mod files;
mod introspect;
mod recipes;
mod serde_types;
mod support;
mod transforms;

use std::collections::HashMap;
use std::sync::Arc;
use wasm_bindgen::prelude::*;

use crate::cache::TransformCache;
use crate::fs::WasmFileSystem;
use pandacss_config::{
    UserConfig, ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_fs::{MemoryFileSystem, PosixPathSystem};

use self::support::{format_config_diagnostics, format_deserialize_error, with_wasm_fs};
use self::transforms::{
    get_pattern_transform_refs, get_utility_transform_refs, resolve_utility_values_callbacks,
    utility_value_callbacks_from_options,
};

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
    filter: pandacss_project::HookFilter,
    callback: js_sys::Function,
}

impl CallbackHost {
    fn from_config(config: &UserConfig) -> Self {
        Self {
            utility_transform_refs: get_utility_transform_refs(config),
            pattern_transform_refs: get_pattern_transform_refs(config),
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
        let config_snapshot = config_value.clone();
        let raw_diagnostics = validate_config_value(&config_snapshot);
        if validation_mode_from_value(&config_snapshot) == ValidationMode::Error
            && !raw_diagnostics.is_empty()
        {
            return Err(JsValue::from_str(&format_config_diagnostics(
                &raw_diagnostics,
            )));
        }
        let mut config: UserConfig = serde_json::from_value(config_value)
            .map_err(|err| JsValue::from_str(&format_deserialize_error(&err, &raw_diagnostics)))?;
        let token_dictionary = pandacss_tokens::TokenDictionary::from_config(&config)
            .map_err(|err| JsValue::from_str(&format!("invalid token config: {err}")))?
            .map(Arc::new);
        resolve_utility_values_callbacks(
            &mut config,
            token_dictionary.as_deref(),
            &utility_values_callbacks,
        )?;
        let callbacks = CallbackHost::from_config(&config);
        let user_config = config.clone();
        let config_snapshot = serde_json::to_value(&config).unwrap_or(config_snapshot);
        let system = pandacss_project::System::new(pandacss_project::SystemInput {
            config,
            diagnostics: Some(raw_diagnostics),
            token_dictionary,
        })
        .map_err(|err| JsValue::from_str(&format!("invalid config: {err}")))?;
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
