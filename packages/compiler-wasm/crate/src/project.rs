//! WASM `WasmProject` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration over a `WasmFileSystem` handle. Atoms +
//! recipes accumulate across `parseFile` calls. Cross-file folding shares
//! the same in-memory FS so `import { x } from './tokens'` resolves
//! through whatever the JS host has populated.

use lru::LruCache;
use pandacss_encoder::{Atom as CoreAtom, AtomValue};
use pandacss_extractor::CrossFileResolver;
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use pandacss_fs::{
    FileSystem, GlobOptions, MemoryFileSystem, OxcResolverFileSystem, PathSystem, PosixPathSystem,
};
use serde::{Deserialize, Serialize as _, de::DeserializeOwned};
use std::collections::{BTreeSet, HashMap};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::cache::{
    MAX_TRANSFORM_CACHE_KEY_BYTES, PatternTransformCacheKey, TransformCache,
    UtilityTransformCacheKey,
};
use crate::fs::WasmFileSystem;
use crate::matcher::from_core_token_dictionary;
use pandacss_codegen::{Artifact, ArtifactId, ConfigDependency, DependencySet, GenerateOptions};
use pandacss_config::{
    CallbackRef, JsxSpecifier, UserConfig, UtilityConfig, UtilityValues, ValidationMode,
    validate_config_value, validation_mode_from_value,
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

    /// Register a JS-backed utility transform callback. The JS package wraps
    /// the user callback so Rust only has to pass the raw value.
    #[wasm_bindgen(js_name = registerUtilityTransform)]
    pub fn register_utility_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed pattern transform callback. The wrapper package
    /// installs callbacks referenced by the serialized config snapshot.
    #[wasm_bindgen(js_name = registerPatternTransform)]
    pub fn register_pattern_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.pattern_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_pattern();
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed `parser:before` source transform with a Rust-side
    /// filter. The filter is evaluated before calling into JS.
    #[wasm_bindgen(js_name = registerSourceTransform)]
    pub fn register_source_transform(
        &mut self,
        id: String,
        filter: JsValue,
        callback: js_sys::Function,
    ) -> Result<(), JsValue> {
        let filter = if filter.is_null() || filter.is_undefined() {
            pandacss_project::HookFilter::default()
        } else {
            let value: serde_json::Value =
                serde_wasm_bindgen::from_value(filter).map_err(|err| {
                    JsValue::from_str(&format!("invalid parser:before filter: {err}"))
                })?;
            pandacss_project::HookFilter::from_json(&value).map_err(|err| {
                JsValue::from_str(&format!(
                    "Invalid parser:before filter for callback `{id}`: {err}"
                ))
            })?
        };
        self.callbacks
            .source_transforms
            .push((id, SourceTransformCallback { filter, callback }));
        self.inner.bump_parse_epoch();
        Ok(())
    }

    /// Read a source file from the in-memory filesystem and parse it.
    ///
    /// # Errors
    /// Returns a JS error if serializing the per-call report fails.
    #[wasm_bindgen(js_name = parseFile)]
    pub fn parse_file(&mut self, path: &str) -> Result<JsValue, JsValue> {
        let source = self
            .fs
            .read_to_string(Path::new(path))
            .map_err(|err| JsValue::from_str(&format!("failed to read `{path}`: {err}")))?;
        self.parse_file_source(path, &source)
    }

    /// Extract + encode provided source text. Replaces any prior contribution
    /// from `path`.
    ///
    /// # Errors
    /// Returns a JS error if serializing the per-call report fails.
    #[wasm_bindgen(js_name = parseFileSource)]
    pub fn parse_file_source(&mut self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let report = self.parse_inner(path, source);
        let _span = tracing::trace_span!("boundary_encode", method = "parse_file_report").entered();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        parse_file_report(path, report)
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Source paths matching the config's `include`/`exclude` (overridable via
    /// `options`) from the in-memory filesystem. For discovery and the host's
    /// watch list.
    ///
    /// # Errors
    /// Returns a JS error when `options` is malformed or the scan fails.
    pub fn scan(&self, options: JsValue) -> Result<JsValue, JsValue> {
        let paths = self.scan_paths(options)?;
        let strings: Vec<String> = paths
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect();
        serde_wasm_bindgen::to_value(&strings).map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Real on-disk path (symlinks followed) from the in-memory filesystem, so two
    /// paths to the same file compare equal. Returns the input when unresolved.
    #[must_use]
    pub fn realpath(&self, path: String) -> String {
        let path = PathBuf::from(path);
        self.fs
            .canonicalize(&path)
            .unwrap_or(path)
            .to_string_lossy()
            .into_owned()
    }

    /// Whether `path` is a source file the project extracts from — its
    /// `cwd`-relative form matches the configured `include`/`exclude` globs.
    #[wasm_bindgen(js_name = isSourceFile)]
    #[must_use]
    pub fn is_source_file(&self, path: &str) -> bool {
        let opts = GlobOptions {
            include: self.user_config.include.clone(),
            exclude: self.user_config.exclude.clone(),
            cwd: PathBuf::from(&self.user_config.cwd),
            absolute: true,
        };
        pandacss_fs::matches_globs(std::path::Path::new(path), &opts)
    }

    /// Read + parse source paths returned from `scan()`. Returns one report per
    /// successfully parsed path.
    ///
    /// # Errors
    /// Returns a JS error when `paths` is malformed or serializing the report fails.
    #[wasm_bindgen(js_name = parseFiles)]
    pub fn parse_files(&mut self, paths: JsValue) -> Result<JsValue, JsValue> {
        let paths: Vec<String> = serde_wasm_bindgen::from_value(paths)
            .map_err(|err| JsValue::from_str(&format!("invalid source paths: {err}")))?;
        let mut reports = Vec::with_capacity(paths.len());
        for path in paths {
            let path = PathBuf::from(path);
            let Ok(source) = self.fs.read_to_string(&path) else {
                continue;
            };
            let path = path.to_string_lossy();
            let report = self.parse_inner(&path, &source);
            reports.push(parse_file_report(&path, report));
        }
        let _span = tracing::trace_span!("boundary_encode", method = "parse_files").entered();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        reports
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    fn scan_paths(&self, options: JsValue) -> Result<Vec<PathBuf>, JsValue> {
        let opts = glob_options(&self.user_config, options)?;
        self.fs
            .glob(&opts)
            .map_err(|err| JsValue::from_str(&format!("scan failed: {err}")))
    }

    fn write_relative_files<'a>(
        &self,
        root: &str,
        files: impl IntoIterator<Item = (&'a str, &'a str)>,
        label: &str,
    ) -> Result<Vec<String>, JsValue> {
        let mut written = Vec::new();
        for (path, code) in files {
            if self.paths.is_absolute(path) {
                return Err(JsValue::from_str(&format!(
                    "{label} output path must be relative: {path}"
                )));
            }
            let target = self.paths.join(&[root, path]);
            self.write_target_file(&target, code)?;
            written.push(target);
        }
        Ok(written)
    }

    fn write_artifacts_to_root(
        &self,
        root: &str,
        artifacts: &[CodegenArtifactSerde],
    ) -> Result<Vec<String>, JsValue> {
        let mut written = Vec::new();
        for artifact in artifacts {
            written.extend(
                self.write_relative_files(
                    root,
                    artifact
                        .files
                        .iter()
                        .map(|file| (file.path.as_str(), file.code.as_str())),
                    "artifact",
                )?,
            );
        }
        Ok(written)
    }

    fn write_target_file(&self, target: &str, code: &str) -> Result<(), JsValue> {
        let parent = self.paths.dirname(target);
        if !parent.is_empty() {
            self.fs
                .create_dir_all(Path::new(&parent))
                .map_err(|err| JsValue::from_str(&err.to_string()))?;
        }
        self.fs
            .write_if_changed(Path::new(target), code.as_bytes())
            .map(|_| ())
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Shared parse path used by `parse_file` and `parseFiles` — wires the
    /// registered transform callbacks (if any) and returns the core report.
    fn parse_inner(&mut self, path: &str, source: &str) -> pandacss_project::ParseFileReport {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
            return self.inner.parse_file(path, source);
        }
        let WasmCompiler {
            inner, callbacks, ..
        } = self;
        let pattern_cache = &mut callbacks.transform_cache.pattern;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut transform = |name: &str, styles: &Literal| {
            apply_pattern_transform(
                name,
                styles,
                &callbacks.pattern_transform_refs,
                &callbacks.pattern_transforms,
                pattern_cache,
            )
        };
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
            )
        };
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms)
        };
        inner.parse_file_with(
            path,
            source,
            pandacss_project::ParseTransforms {
                source: has_source_transforms.then_some(
                    &mut source_transform as &mut pandacss_project::SourceTransformFn<'_>,
                ),
                pattern: has_pattern_transforms
                    .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
                utility: has_utility_transforms.then_some(
                    &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                ),
            },
        )
    }

    /// Stateless single-file extraction — raw `{ calls, jsx, diagnostics }`,
    /// using the project's configured matchers + token dictionary. Unlike
    /// `parseFile`, it registers nothing; it's the read-only peek companion.
    ///
    /// # Errors
    /// Returns a JS error string when serializing the result fails.
    #[wasm_bindgen(js_name = extractFileSource)]
    pub fn extract_file_source(&self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let result = self.inner.extract(path, source);
        let _span =
            tracing::trace_span!("boundary_encode", method = "extract_file_source").entered();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Re-read `path` from the in-memory filesystem and re-parse it only if
    /// already known. Returns `true` when the file was present and got
    /// re-parsed.
    #[wasm_bindgen(js_name = refreshFile)]
    pub fn refresh_file(&mut self, path: &str) -> Result<bool, JsValue> {
        let source = self
            .fs
            .read_to_string(Path::new(path))
            .map_err(|err| JsValue::from_str(&format!("failed to read `{path}`: {err}")))?;
        Ok(self.refresh_file_source(path, &source))
    }

    /// Re-parse provided source text only if `path` is already known.
    #[wasm_bindgen(js_name = refreshFileSource)]
    #[must_use]
    pub fn refresh_file_source(&mut self, path: &str, source: &str) -> bool {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
            return self.inner.refresh_file(path, source);
        }

        let WasmCompiler {
            inner, callbacks, ..
        } = self;
        let pattern_cache = &mut callbacks.transform_cache.pattern;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut transform = |name: &str, styles: &Literal| {
            apply_pattern_transform(
                name,
                styles,
                &callbacks.pattern_transform_refs,
                &callbacks.pattern_transforms,
                pattern_cache,
            )
        };
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
            )
        };
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms)
        };
        inner.refresh_file_with(
            path,
            source,
            pandacss_project::ParseTransforms {
                source: has_source_transforms.then_some(
                    &mut source_transform as &mut pandacss_project::SourceTransformFn<'_>,
                ),
                pattern: has_pattern_transforms
                    .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
                utility: has_utility_transforms.then_some(
                    &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                ),
            },
        )
    }

    /// Drop a file's contribution. Returns `true` if the path was known.
    #[wasm_bindgen(js_name = removeFile)]
    #[must_use]
    pub fn remove_file(&mut self, path: &str) -> bool {
        self.inner.remove_file(path)
    }

    /// Drop every path's state. Keeps the config-derived extractor,
    /// token dictionary, and cross-file resolver intact.
    pub fn clear(&mut self) {
        self.inner.clear();
        self.callbacks.transform_cache.clear();
    }

    /// Return the serialized config snapshot this project was constructed
    /// with.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn config(&self) -> Result<JsValue, JsValue> {
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        self.config
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Tooling introspection snapshot (read once, index on the host).
    ///
    /// # Errors
    /// Returns a JS error if the snapshot fails to serialize.
    pub fn spec(&self) -> Result<JsValue, JsValue> {
        let types = self.inner.type_data(&self.user_config);
        let property_order = pandacss_stylesheet::order_properties(
            types.utilities.properties.keys().map(String::as_str),
        );
        let spec = pandacss_config::Spec {
            types,
            property_order,
            jsx_factory: Some(self.user_config.jsx_factory().to_owned()),
            import_map: self.user_config.import_map.clone(),
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        spec.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Stateless source inspection for tooling (reporting, lint, IDE). Returns
    /// classified Panda usage sites plus file-local extraction diagnostics.
    ///
    /// # Errors
    /// Returns a JS error if serialization fails.
    #[wasm_bindgen(js_name = inspectFileSource)]
    pub fn inspect_file_source(&self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let result = self.inner.inspect_file_source(path, source);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Resolve selector and CSS metadata for one utility value.
    ///
    /// # Errors
    /// Returns a JS error if the input or result cannot be serialized.
    #[wasm_bindgen(js_name = resolveUtilityValue)]
    pub fn resolve_utility_value(&self, input: JsValue) -> Result<JsValue, JsValue> {
        let input: ResolveUtilityValueInputSerde = serde_wasm_bindgen::from_value(input)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let Some(value) = json_value_to_literal(&input.value) else {
            return Err(JsValue::from_str(
                "resolveUtilityValue() requires a JSON-serializable value",
            ));
        };

        let Some(resolved) = self.inner.resolve_utility_value(&input.prop, &value) else {
            return Ok(JsValue::NULL);
        };

        let result = serde_json::json!({
            "utility": resolved.utility,
            "className": resolved.class_name,
            "cssValue": resolved.css_value.to_json(),
            "important": resolved.important,
            "source": utility_value_source_to_json(resolved.source),
        });

        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Source globs + their static base dirs (for the host watcher).
    ///
    /// # Errors
    /// Returns a JS error if serialization fails.
    pub fn sources(&self) -> Result<JsValue, JsValue> {
        let entries: Vec<SourceEntrySerde> = self
            .user_config
            .include
            .iter()
            .map(|pattern| SourceEntrySerde {
                base: resolve_base(&self.user_config.cwd, pattern),
                pattern: pattern.clone(),
            })
            .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Generate artifacts and write them under `outdir` via the in-memory fs.
    /// Returns the written paths.
    ///
    /// # Errors
    /// Returns a JS error if a file fails to write or results fail to serialize.
    #[wasm_bindgen(js_name = writeArtifacts)]
    pub fn write_artifacts(&self, options: JsValue) -> Result<JsValue, JsValue> {
        let options = write_artifacts_options_from_js(options)?;
        let artifacts = if let Some(artifacts) = options.artifacts {
            artifacts
        } else {
            self.inner
                .generate_artifacts(
                    &self.user_config,
                    generate_options(
                        &self.user_config,
                        &GenerateArtifactOptionsSerde {
                            force_import_extension: options.force_import_extension,
                        },
                    ),
                )
                .into_iter()
                .map(to_codegen_artifact)
                .collect()
        };
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let base = self.paths.resolve(&cwd, &options.outdir);
        let written = self.write_artifacts_to_root(&base, &artifacts)?;
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        written
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = resolvePath)]
    #[must_use]
    pub fn resolve_path(&self, path: &str, cwd: Option<String>) -> String {
        self.paths
            .resolve(&cwd.unwrap_or_else(|| self.user_config.cwd.clone()), path)
    }

    #[wasm_bindgen(js_name = joinPath)]
    pub fn join_path(&self, parts: JsValue) -> Result<String, JsValue> {
        let parts: Vec<String> = serde_wasm_bindgen::from_value(parts)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let parts = parts.iter().map(String::as_str).collect::<Vec<_>>();
        Ok(self.paths.join(&parts))
    }

    #[wasm_bindgen]
    #[must_use]
    pub fn dirname(&self, path: &str) -> String {
        self.paths.dirname(path)
    }

    /// The resolved cascade-layer names (config overrides merged over defaults).
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn layers(&self) -> Result<JsValue, JsValue> {
        let layers = &self.user_config.layers;
        let names = LayerNamesSerde {
            reset: &layers.reset,
            base: &layers.base,
            tokens: &layers.tokens,
            recipes: &layers.recipes,
            utilities: &layers.utilities,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        names
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Whether `css` declares Panda's cascade layers (`@layer reset, base, …;`),
    /// marking it as the stylesheet root to inject the compiled CSS into.
    #[wasm_bindgen(js_name = hasLayerDeclaration)]
    #[must_use]
    pub fn has_layer_declaration(&self, css: &str) -> bool {
        let names = self.user_config.layers.ordered().map(|(_, name)| name);
        pandacss_stylesheet::has_layer_declaration(css, &names)
    }

    /// Rust-built token dictionary projected into the small JS interop shape.
    #[wasm_bindgen(js_name = token_dictionary)]
    pub fn token_dictionary(&self) -> Result<JsValue, JsValue> {
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        match self.inner.config().token_dictionary() {
            Some(dictionary) => from_core_token_dictionary(dictionary.as_ref())
                .serialize(&serializer)
                .map_err(|err| JsValue::from_str(&err.to_string())),
            None => Ok(JsValue::UNDEFINED),
        }
    }

    /// Returns `true` when the project has no files and no accumulated output.
    #[wasm_bindgen(js_name = isEmpty)]
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }

    /// Serialize the project's encoded atoms + recipes into a portable build info
    /// (the `panda buildinfo` producer). `configFingerprint` is engine-owned; the
    /// caller supplies only the published `panda` peer range.
    ///
    /// # Errors
    /// Returns a JS error if serializing the build info fails.
    #[wasm_bindgen(js_name = serializeBuildInfo)]
    pub fn serialize_build_info(&self, panda: String) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("boundary_encode", method = "serialize_build_info").entered();
        let info = self.inner.build_info(panda);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        info.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Hydrate an external build info into this project (additive), optionally
    /// restricted to imported modules (tree-shaking). Returns `false` on a
    /// schema-version mismatch.
    ///
    /// # Errors
    /// Returns a JS error if `build_info` isn't a valid build-info document.
    #[wasm_bindgen(js_name = applyBuildInfo)]
    pub fn apply_build_info(
        &mut self,
        name: &str,
        build_info: JsValue,
        only: JsValue,
    ) -> Result<bool, JsValue> {
        let info: pandacss_project::BuildInfo = serde_wasm_bindgen::from_value(build_info)
            .map_err(|err| JsValue::from_str(&err.to_string()))?;

        // `only` is optional — wasm_bindgen passes `undefined`/`null` when omitted.
        let only: Option<Vec<String>> = if only.is_undefined() || only.is_null() {
            None
        } else {
            serde_wasm_bindgen::from_value(only)
                .map_err(|err| JsValue::from_str(&err.to_string()))?
        };

        Ok(self.inner.hydrate(name, &info, only.as_deref()))
    }

    /// The build-info wire-format version this binding reads/writes.
    #[wasm_bindgen(js_name = buildInfoSchemaVersion)]
    #[must_use]
    pub fn build_info_schema_version(&self) -> u32 {
        pandacss_project::SCHEMA_VERSION
    }

    /// Engine-owned fingerprint of the resolved config's output-affecting fields,
    /// stamped into build info as `configFingerprint`.
    #[wasm_bindgen(js_name = configFingerprint)]
    #[must_use]
    pub fn config_fingerprint(&self) -> String {
        self.inner.config_fingerprint().to_string()
    }

    /// Deduplicated atoms across every currently-known file, sorted by
    /// `(prop, conditions, value)` for stable iteration.
    ///
    /// # Errors
    /// Returns a JS error if serializing the atom array fails.
    pub fn atoms(&mut self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "atoms").entered();
        let atoms = collect_sorted_atoms(self.inner.atoms());
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        atoms
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Every `cva()` recipe entry in `(file, span_start)` order.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn recipes(&self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "recipes").entered();
        let entries: Vec<RecipeEntrySerde> = self
            .inner
            .recipes()
            .map(|(file, span_start, recipe)| RecipeEntrySerde {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Every `sva()` slot-recipe entry.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = slotRecipes)]
    pub fn slot_recipes(&self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "slot_recipes").entered();
        let entries: Vec<RecipeEntrySerde> = self
            .inner
            .slot_recipes()
            .map(|(file, span_start, recipe)| RecipeEntrySerde {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Encoded config recipe styles, separate from atomic utility atoms.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = encodedRecipes)]
    pub fn encoded_recipes(&mut self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("boundary_encode", method = "encoded_recipes").entered();
        let snapshot = serde_json::to_value(self.inner.encoded_recipes().snapshot())
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
        let json =
            serde_json::to_string(&snapshot).map_err(|err| JsValue::from_str(&err.to_string()))?;
        js_sys::JSON::parse(&json)
    }

    /// Aggregate counts.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn summary(&self) -> Result<JsValue, JsValue> {
        let s = self.inner.summary();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        s.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Config validation diagnostics from construction.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn diagnostics(&self) -> Result<JsValue, JsValue> {
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        self.inner
            .diagnostics()
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// `(path, hex source_hash)` for every known file, sorted by path.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = fileManifest)]
    pub fn file_manifest(&self) -> Result<JsValue, JsValue> {
        let entries: Vec<CompileFileManifestSerde> = self
            .inner
            .file_manifest()
            .into_iter()
            .map(|(path, hash)| CompileFileManifestSerde {
                path: path.as_ref().to_owned(),
                hash: format!("{hash:016x}"),
            })
            .collect();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        entries
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Per-file view; returns `null` when `path` isn't known.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = getFile)]
    pub fn get_file(&self, path: &str) -> Result<JsValue, JsValue> {
        let Some(file) = self.inner.get_file(path) else {
            return Ok(JsValue::NULL);
        };
        let view = ParsedFileViewSerde {
            path: file.path().to_owned(),
            atoms: collect_sorted_atoms(file.atoms()),
            diagnostics: file.diagnostics().to_vec(),
            recipes: file
                .recipes()
                .map(|(span_start, recipe)| RecipeEntrySerde {
                    file: file.path().to_owned(),
                    span_start,
                    recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
                })
                .collect(),
            slot_recipes: file
                .slot_recipes()
                .map(|(span_start, recipe)| RecipeEntrySerde {
                    file: file.path().to_owned(),
                    span_start,
                    recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
                })
                .collect(),
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        view.serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// `staticCss.patterns` expansion as raw atoms, without compiling.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = staticPatternAtoms)]
    pub fn static_pattern_atoms(&mut self) -> Result<JsValue, JsValue> {
        let (atoms, diagnostics) = self.collect_static_pattern_atoms();
        let result = StaticPatternResultSerde {
            atoms: slice_to_atom_serde(&atoms),
            diagnostics,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Compile to CSS. Mirrors the NAPI `Project.compile()`.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn compile(&mut self, options: Option<JsValue>) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_project_compile").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let options = compile_options_from_js(options)?;
        let output = build_compile_output(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            options.emit_layer_declaration.unwrap_or(true),
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeCss)]
    pub fn write_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_write_css").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let options = write_css_options_from_js(options)?;
        let output = build_compile_output(
            &mut self.inner,
            &self.user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            options.emit_layer_declaration.unwrap_or(true),
        );
        let target = self.paths.resolve(
            &options.cwd.unwrap_or_else(|| self.user_config.cwd.clone()),
            &options.outfile,
        );
        self.write_target_file(&target, &output.css)?;

        let result = WriteCssResultSerde {
            path: target,
            css: output.css,
            source_map: output.source_map,
            manifest: output.manifest,
            layer_ranges: output.layer_ranges,
            diagnostics: output.diagnostics,
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// CSS for the named cascade layers, concatenated in order. Sliced in Rust
    /// (byte offsets stay valid); unknown layer names are skipped.
    #[wasm_bindgen(js_name = layerCss)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "wasm-bindgen requires owned Vec<String>"
    )]
    pub fn layer_css(&mut self, layers: Vec<String>) -> String {
        let _span = tracing::trace_span!("layer_css", method = "wasm").entered();
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms();
        let token_dictionary = self.inner.config().token_dictionary();
        let output = build_stylesheet_output(
            &mut self.inner,
            &self.user_config,
            token_dictionary,
            &static_pattern_atoms,
            true,
        );
        let selected: Vec<pandacss_stylesheet::StylesheetLayer> = layers
            .iter()
            .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
            .collect();
        output.get_layer_css(&selected)
    }

    /// Split the stylesheet into per-file outputs (one per layer + per recipe,
    /// plus `recipes.css` / `styles.css` index files) for `--splitting`.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    #[wasm_bindgen(js_name = splitCss)]
    pub fn split_css(&mut self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("split_css", method = "wasm").entered();
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms();
        let files = build_split_css(&mut self.inner, &self.user_config, &static_pattern_atoms);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        files
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    #[wasm_bindgen(js_name = writeSplitCss)]
    pub fn write_split_css(&mut self, options: JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("split_css", method = "wasm_write_split_css").entered();
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms();
        let files = build_split_css(&mut self.inner, &self.user_config, &static_pattern_atoms);
        let options = write_split_css_options_from_js(options)?;
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let root = self.paths.resolve(&cwd, &options.outdir);
        let paths = self.write_relative_files(
            &root,
            files
                .iter()
                .map(|file| (file.path.as_str(), file.code.as_str())),
            "split css",
        )?;
        let result = WriteFilesResultSerde { root, paths, files };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Generate every codegen artifact from the resolved project state.
    ///
    /// # Errors
    /// Returns a JS error if options are invalid or serializing fails.
    #[wasm_bindgen(js_name = generateArtifacts)]
    pub fn generate_artifacts(&self, options: &JsValue) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("codegen", method = "wasm_generate_artifacts").entered();
        let options = generate_options(
            &self.user_config,
            &generate_artifact_options_from_js(options)?,
        );
        serialize_codegen_artifacts(self.inner.generate_artifacts(&self.user_config, options))
    }

    /// Generate one codegen artifact by id.
    ///
    /// # Errors
    /// Returns a JS error if the id/options are invalid or serializing fails.
    #[wasm_bindgen(js_name = generateArtifact)]
    pub fn generate_artifact(&self, id: &str, options: &JsValue) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("codegen", method = "wasm_generate_artifact", id).entered();
        let id = id
            .parse::<ArtifactId>()
            .map_err(|()| JsValue::from_str(&format!("unknown codegen artifact `{id}`")))?;
        let options = generate_options(
            &self.user_config,
            &generate_artifact_options_from_js(options)?,
        );
        let artifact = self.inner.generate_artifact(&self.user_config, id, options);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        artifact
            .map(to_codegen_artifact)
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Generate artifacts affected by the provided config dependency names.
    ///
    /// # Errors
    /// Returns a JS error if dependencies/options are invalid or serializing fails.
    #[wasm_bindgen(js_name = generateAffectedArtifacts)]
    pub fn generate_affected_artifacts(
        &self,
        dependencies: JsValue,
        options: &JsValue,
    ) -> Result<JsValue, JsValue> {
        let _span =
            tracing::trace_span!("codegen", method = "wasm_generate_affected_artifacts").entered();
        let dependencies: Vec<String> = serde_wasm_bindgen::from_value(dependencies)
            .map_err(|err| JsValue::from_str(&format!("invalid dependencies: {err}")))?;
        let changed = dependency_set_from_strings(dependencies)?;
        let options = generate_options(
            &self.user_config,
            &generate_artifact_options_from_js(options)?,
        );
        serialize_codegen_artifacts(self.inner.generate_affected_artifacts(
            &self.user_config,
            changed,
            options,
        ))
    }

    fn collect_static_pattern_atoms(
        &mut self,
    ) -> (Vec<CoreAtom>, Vec<pandacss_extractor::Diagnostic>) {
        let WasmCompiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        if callbacks.has_pattern_transforms() {
            let pattern_cache = &mut callbacks.transform_cache.pattern;
            let mut transform = |name: &str, styles: &Literal| {
                apply_pattern_transform(
                    name,
                    styles,
                    &callbacks.pattern_transform_refs,
                    &callbacks.pattern_transforms,
                    pattern_cache,
                )
            };
            inner.static_pattern_atoms(
                user_config,
                Some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
            )
        } else {
            inner.static_pattern_atoms(user_config, None)
        }
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileOutputSerde {
    css: String,
    source_map: Option<String>,
    manifest: CompileManifestSerde,
    layer_ranges: CompileLayerRangesSerde,
    diagnostics: Vec<pandacss_shared::Diagnostic>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WriteCssResultSerde {
    path: String,
    css: String,
    source_map: Option<String>,
    manifest: CompileManifestSerde,
    layer_ranges: CompileLayerRangesSerde,
    diagnostics: Vec<pandacss_shared::Diagnostic>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WriteFilesResultSerde {
    root: String,
    paths: Vec<String>,
    files: Vec<SplitCssFileSerde>,
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompileOptionsSerde {
    emit_layer_declaration: Option<bool>,
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateArtifactOptionsSerde {
    force_import_extension: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResolveUtilityValueInputSerde {
    prop: String,
    value: serde_json::Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteArtifactsOptionsSerde {
    outdir: String,
    cwd: Option<String>,
    force_import_extension: Option<bool>,
    artifacts: Option<Vec<CodegenArtifactSerde>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteCssOptionsSerde {
    outfile: String,
    cwd: Option<String>,
    emit_layer_declaration: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteSplitCssOptionsSerde {
    outdir: String,
    cwd: Option<String>,
}

fn parse_required_options<T>(value: JsValue, label: &str) -> Result<T, JsValue>
where
    T: DeserializeOwned,
{
    if value.is_undefined() || value.is_null() {
        return Err(JsValue::from_str(&format!("{label} options are required")));
    }
    serde_wasm_bindgen::from_value(value).map_err(|err| JsValue::from_str(&err.to_string()))
}

fn compile_options_from_js(options: Option<JsValue>) -> Result<CompileOptionsSerde, JsValue> {
    match options {
        Some(value) if !value.is_undefined() && !value.is_null() => {
            parse_required_options(value, "compile")
        }
        _ => Ok(CompileOptionsSerde::default()),
    }
}

fn write_artifacts_options_from_js(
    options: JsValue,
) -> Result<WriteArtifactsOptionsSerde, JsValue> {
    parse_required_options(options, "writeArtifacts")
}

fn write_css_options_from_js(options: JsValue) -> Result<WriteCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeCss")
}

fn write_split_css_options_from_js(options: JsValue) -> Result<WriteSplitCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeSplitCss")
}

fn generate_artifact_options_from_js(
    options: &JsValue,
) -> Result<GenerateArtifactOptionsSerde, JsValue> {
    if options.is_undefined() || options.is_null() {
        return Ok(GenerateArtifactOptionsSerde::default());
    }
    serde_wasm_bindgen::from_value(options.clone())
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileManifestSerde {
    files: Vec<CompileFileManifestSerde>,
    tokens: Vec<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileFileManifestSerde {
    path: String,
    hash: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileLayerRangesSerde {
    reset: Option<CompileLayerRangeSerde>,
    base: Option<CompileLayerRangeSerde>,
    tokens: Option<CompileLayerRangeSerde>,
    recipes: Option<CompileLayerRangeSerde>,
    utilities: Option<CompileLayerRangeSerde>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileLayerRangeSerde {
    start: u32,
    end: u32,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ParsedFileViewSerde {
    path: String,
    atoms: Vec<AtomSerde>,
    diagnostics: Vec<pandacss_shared::Diagnostic>,
    recipes: Vec<RecipeEntrySerde>,
    slot_recipes: Vec<RecipeEntrySerde>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct StaticPatternResultSerde {
    atoms: Vec<AtomSerde>,
    diagnostics: Vec<pandacss_extractor::Diagnostic>,
}

#[derive(Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CodegenArtifactSerde {
    id: String,
    files: Vec<CodegenFileSerde>,
}

#[derive(Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CodegenFileSerde {
    path: String,
    code: String,
    dependencies: Vec<String>,
}

fn serialize_codegen_artifacts(artifacts: Vec<Artifact>) -> Result<JsValue, JsValue> {
    let _span = tracing::trace_span!("boundary_encode", method = "codegen_artifacts").entered();
    let artifacts = artifacts
        .into_iter()
        .map(to_codegen_artifact)
        .collect::<Vec<_>>();
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    artifacts
        .serialize(&serializer)
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifactSerde {
    CodegenArtifactSerde {
        id: artifact.id.as_str().to_owned(),
        files: artifact
            .files
            .into_iter()
            .map(|file| CodegenFileSerde {
                path: file.path,
                code: file.code,
                dependencies: dependency_names(file.dependencies),
            })
            .collect(),
    }
}

fn dependency_names(dependencies: DependencySet) -> Vec<String> {
    dependencies
        .to_vec()
        .into_iter()
        .map(|dependency| dependency.as_str().to_owned())
        .collect()
}

fn dependency_set_from_strings(dependencies: Vec<String>) -> Result<DependencySet, JsValue> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let dependency = dependency.parse::<ConfigDependency>().map_err(|()| {
            JsValue::from_str(&format!("unknown config dependency `{dependency}`"))
        })?;
        set = set.union(DependencySet::one(dependency));
    }
    Ok(set)
}

fn generate_options(
    user_config: &UserConfig,
    options: &GenerateArtifactOptionsSerde,
) -> GenerateOptions {
    let import_extensions = options
        .force_import_extension
        .unwrap_or(user_config.force_import_extension);

    GenerateOptions {
        format: user_config.out_extension,
        import_extensions,
    }
}

fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    emit_layer_declaration: bool,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest_files: Vec<CompileFileManifestSerde> = project
        .file_manifest()
        .into_iter()
        .map(|(path, hash)| CompileFileManifestSerde {
            path: path.as_ref().to_owned(),
            hash: format!("{hash:016x}"),
        })
        .collect();
    let manifest_tokens: Vec<String> = token_dictionary.as_ref().map_or_else(Vec::new, |dict| {
        let mut paths: BTreeSet<String> = BTreeSet::new();
        for token in dict.iter() {
            paths.insert(token.path.to_string());
        }
        paths.into_iter().collect()
    });
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        emit_layer_declaration,
    );
    let diagnostics: Vec<pandacss_shared::Diagnostic> = project
        .diagnostics()
        .iter()
        .cloned()
        .chain(static_pattern_diagnostics)
        .chain(output.diagnostics)
        .collect();
    CompileOutputSerde {
        css: output.css,
        source_map: output.source_map,
        manifest: CompileManifestSerde {
            files: manifest_files,
            tokens: manifest_tokens,
        },
        layer_ranges: layer_ranges_from(&output.layer_ranges),
        diagnostics,
    }
}

/// One file in a `--splitting` output set. Host writes `path -> code`.
#[derive(serde::Serialize)]
struct SplitCssFileSerde {
    path: String,
    code: String,
}

/// Split the stylesheet into per-file outputs (layers + recipes + indexes).
fn build_split_css(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
) -> Vec<SplitCssFileSerde> {
    let token_dictionary = project.config().token_dictionary();
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: true,
    };
    pandacss_stylesheet::split_css(
        &pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
    .into_iter()
    .map(|file| SplitCssFileSerde {
        path: file.path,
        code: file.code,
    })
    .collect()
}

/// Raw stylesheet (css + layer ranges); shared by `build_compile_output` and
/// `css_for_layers`.
fn build_stylesheet_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    token_dictionary: Option<std::sync::Arc<pandacss_tokens::TokenDictionary>>,
    static_pattern_atoms: &[CoreAtom],
    emit_layer_declaration: bool,
) -> pandacss_stylesheet::StylesheetOutput {
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration,
    };
    pandacss_stylesheet::compile(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
}

fn layer_ranges_from(r: &pandacss_stylesheet::StylesheetLayerRanges) -> CompileLayerRangesSerde {
    CompileLayerRangesSerde {
        reset: r.reset.as_ref().map(to_serde_range),
        base: r.base.as_ref().map(to_serde_range),
        tokens: r.tokens.as_ref().map(to_serde_range),
        recipes: r.recipes.as_ref().map(to_serde_range),
        utilities: r.utilities.as_ref().map(to_serde_range),
    }
}

fn to_serde_range(range: &std::ops::Range<usize>) -> CompileLayerRangeSerde {
    CompileLayerRangeSerde {
        start: u32::try_from(range.start).unwrap_or(u32::MAX),
        end: u32::try_from(range.end).unwrap_or(u32::MAX),
    }
}

fn slice_to_atom_serde(atoms: &[CoreAtom]) -> Vec<AtomSerde> {
    let mut sorted: Vec<&CoreAtom> = atoms.iter().collect();
    sorted.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| {
                let a_conds: Vec<&str> = a.conditions().iter().map(AsRef::as_ref).collect();
                let b_conds: Vec<&str> = b.conditions().iter().map(AsRef::as_ref).collect();
                a_conds.cmp(&b_conds)
            })
            .then_with(|| value_sort_key(a.value()).cmp(&value_sort_key(b.value())))
    });
    sorted
        .into_iter()
        .map(|atom| AtomSerde {
            prop: atom.prop().to_string(),
            value: atom_value_to_json(atom.value()),
            conditions: atom
                .conditions()
                .iter()
                .map(std::string::ToString::to_string)
                .collect::<Vec<String>>(),
        })
        .collect()
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AtomSerde {
    prop: String,
    value: serde_json::Value,
    conditions: Vec<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RecipeEntrySerde {
    file: String,
    span_start: u32,
    recipe: serde_json::Value,
}

fn with_wasm_fs(
    project: pandacss_project::Project,
    fs: &WasmFileSystem,
) -> pandacss_project::Project {
    // Cross-file resolver always shares the WasmFileSystem so imports
    // fold through whatever the JS host populated.
    project.with_cross_file(CrossFileResolver::with_fs(fs.inner.clone()))
}

/// Serialized per-file parse report. Mirrors the native `ParseFileReport`.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ParseFileReportSerde {
    path: String,
    css_calls: u32,
    cva_calls: u32,
    sva_calls: u32,
    jsx_usages: u32,
    diagnostics: Vec<pandacss_project::Diagnostic>,
}

fn parse_file_report(
    path: &str,
    report: pandacss_project::ParseFileReport,
) -> ParseFileReportSerde {
    ParseFileReportSerde {
        path: path.to_owned(),
        css_calls: u32::try_from(report.css_calls).unwrap_or(u32::MAX),
        cva_calls: u32::try_from(report.cva_calls).unwrap_or(u32::MAX),
        sva_calls: u32::try_from(report.sva_calls).unwrap_or(u32::MAX),
        jsx_usages: u32::try_from(report.jsx_usages).unwrap_or(u32::MAX),
        diagnostics: report.diagnostics,
    }
}

/// Serialized source entry. Mirrors the native `SourceEntry`.
#[derive(serde::Serialize)]
struct SourceEntrySerde {
    base: String,
    pattern: String,
}

/// Resolve a glob's watch base dir against `cwd` (empty base → `cwd` itself).
fn resolve_base(cwd: &str, pattern: &str) -> String {
    let cwd = std::path::Path::new(cwd);
    let base = pandacss_fs::base_dir(pattern);
    if base.is_empty() {
        cwd.to_string_lossy().into_owned()
    } else {
        cwd.join(base).to_string_lossy().into_owned()
    }
}

/// Serialized resolved cascade-layer names. Mirrors the native `LayerNames`.
#[derive(serde::Serialize)]
struct LayerNamesSerde<'a> {
    reset: &'a str,
    base: &'a str,
    tokens: &'a str,
    recipes: &'a str,
    utilities: &'a str,
}

/// Glob overrides accepted by `scan`/`glob`; omitted fields fall back to the
/// config's `include`/`exclude`/`cwd`.
#[derive(Default, Deserialize)]
struct GlobOverrides {
    include: Option<Vec<String>>,
    exclude: Option<Vec<String>>,
    cwd: Option<String>,
}

fn glob_options(user_config: &UserConfig, options: JsValue) -> Result<GlobOptions, JsValue> {
    let overrides: GlobOverrides = if options.is_undefined() || options.is_null() {
        GlobOverrides::default()
    } else {
        serde_wasm_bindgen::from_value(options)
            .map_err(|err| JsValue::from_str(&format!("invalid scan options: {err}")))?
    };
    Ok(GlobOptions {
        include: overrides
            .include
            .unwrap_or_else(|| user_config.include.clone()),
        exclude: overrides
            .exclude
            .unwrap_or_else(|| user_config.exclude.clone()),
        cwd: PathBuf::from(overrides.cwd.unwrap_or_else(|| user_config.cwd.clone())),
        absolute: true,
    })
}

fn collect_sorted_atoms<S: std::hash::BuildHasher>(
    atoms: &std::collections::HashSet<pandacss_encoder::Atom, S>,
) -> Vec<AtomSerde> {
    let mut sorted: Vec<&pandacss_encoder::Atom> = atoms.iter().collect();
    sorted.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| {
                let a_conds: Vec<&str> = a.conditions().iter().map(AsRef::as_ref).collect();
                let b_conds: Vec<&str> = b.conditions().iter().map(AsRef::as_ref).collect();
                a_conds.cmp(&b_conds)
            })
            .then_with(|| value_sort_key(a.value()).cmp(&value_sort_key(b.value())))
    });
    sorted
        .into_iter()
        .map(|atom| AtomSerde {
            prop: atom.prop().to_string(),
            value: atom_value_to_json(atom.value()),
            conditions: atom
                .conditions()
                .iter()
                .map(std::string::ToString::to_string)
                .collect::<Vec<String>>(),
        })
        .collect()
}

fn utility_value_callbacks_from_options(
    options: &JsValue,
) -> Result<HashMap<String, js_sys::Function>, JsValue> {
    if options.is_undefined() || options.is_null() {
        return Ok(HashMap::new());
    }
    let config_callbacks = js_sys::Reflect::get(options, &JsValue::from_str("configCallbacks"))?;
    if config_callbacks.is_undefined() || config_callbacks.is_null() {
        return Ok(HashMap::new());
    }
    let utility_values =
        js_sys::Reflect::get(&config_callbacks, &JsValue::from_str("utilityValues"))?;
    if utility_values.is_undefined() || utility_values.is_null() {
        return Ok(HashMap::new());
    }
    let utility_values = js_sys::Object::from(utility_values);
    let entries = js_sys::Object::entries(&utility_values);
    let mut callbacks = HashMap::new();
    for entry in entries.iter() {
        let pair = js_sys::Array::from(&entry);
        let Some(id) = pair.get(0).as_string() else {
            continue;
        };
        let callback = pair
            .get(1)
            .dyn_into::<js_sys::Function>()
            .map_err(|_| JsValue::from_str(&format!("invalid utility.values callback `{id}`")))?;
        callbacks.insert(id, callback);
    }
    Ok(callbacks)
}

fn resolve_utility_values_callbacks(
    config: &mut UserConfig,
    token_dictionary: Option<&pandacss_tokens::TokenDictionary>,
    callbacks: &HashMap<String, js_sys::Function>,
) -> Result<(), JsValue> {
    if callbacks.is_empty() {
        return Ok(());
    }

    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    let token_dictionary = match token_dictionary {
        Some(dictionary) => from_core_token_dictionary(dictionary)
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))?,
        None => JsValue::UNDEFINED,
    };

    for (prop, utility) in &mut config.utilities {
        let Some(id) = utility_values_callback_id(utility).map(str::to_owned) else {
            continue;
        };
        let Some(callback) = callbacks.get(&id) else {
            continue;
        };
        let result = callback
            .call1(&JsValue::UNDEFINED, &token_dictionary)
            .map_err(|err| {
                JsValue::from_str(&format!(
                    "Utility values callback `{id}` for `{prop}` threw: {err:?}"
                ))
            })?;
        utility.values = Some(serde_wasm_bindgen::from_value(result).map_err(|err| {
            JsValue::from_str(&format!(
                "Utility values callback `{id}` for `{prop}` returned invalid values: {err}"
            ))
        })?);
    }

    Ok(())
}

fn utility_values_callback_id(utility: &UtilityConfig) -> Option<&str> {
    let UtilityValues::Map(values) = utility.values.as_ref()? else {
        return None;
    };
    let kind = values.get("kind")?.as_str()?;
    if kind != "js-callback" {
        return None;
    }
    values.get("id")?.as_str()
}

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract used by other JS callbacks"
)]
fn apply_source_transforms(
    path: &str,
    source: &str,
    callbacks: &[(String, SourceTransformCallback)],
) -> Result<Option<String>, pandacss_extractor::Diagnostic> {
    let mut current: Option<String> = None;
    for (id, entry) in callbacks {
        let input = current.as_deref().unwrap_or(source);
        if !entry.filter.admits(path, input) {
            continue;
        }

        let result = entry
            .callback
            .call2(
                &JsValue::NULL,
                &JsValue::from_str(path),
                &JsValue::from_str(input),
            )
            .map_err(|err| {
                callback_diagnostic(format!(
                    "parser:before callback `{id}` for `{path}` threw: {}",
                    js_error_message(&err)
                ))
            })?;
        if result.is_null() || result.is_undefined() {
            continue;
        }
        let Some(next) = result.as_string() else {
            return Err(callback_diagnostic(format!(
                "parser:before callback `{id}` for `{path}` must return a string or undefined"
            )));
        };
        current = Some(next);
    }

    Ok(current)
}

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract; boxing would diverge from UtilityTransformFn"
)]
fn apply_utility_transform(
    prop: &str,
    resolved: &AtomValue,
    original: &AtomValue,
    utility_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, js_sys::Function>,
    cache: &mut LruCache<UtilityTransformCacheKey, Literal>,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = utility_transform_refs.get(prop) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing utility transform callback `{id}` for `{prop}`"
        )));
    };

    // Keyed on the original alias (the resolved value is a function of it).
    let cache_key = UtilityTransformCacheKey {
        id: id.clone(),
        prop: prop.to_owned(),
        value: pandacss_project::atom_value_cache_key(original),
    };
    if let Some(cached) = cache.get(&cache_key).cloned() {
        tracing::trace!(
            cache = "utility_transform",
            action = "hit",
            target = prop,
            entries = cache.len()
        );
        return Ok(Some(cached));
    }
    tracing::trace!(
        cache = "utility_transform",
        action = "miss",
        target = prop,
        entries = cache.len()
    );

    // Positional = resolved value; second arg = original alias (`args.raw`).
    let resolved_js =
        serde_wasm_bindgen::to_value(&atom_value_to_json(resolved)).map_err(|err| {
            callback_diagnostic(format!(
                "Failed to serialize utility transform value for `{prop}`: {err}"
            ))
        })?;
    let original_js =
        serde_wasm_bindgen::to_value(&atom_value_to_json(original)).map_err(|err| {
            callback_diagnostic(format!(
                "Failed to serialize utility transform value for `{prop}`: {err}"
            ))
        })?;
    let result = callback
        .call2(&JsValue::NULL, &resolved_js, &original_js)
        .map_err(|err| {
            callback_diagnostic(format!(
                "Utility transform callback `{id}` for `{prop}` threw: {}",
                js_error_message(&err)
            ))
        })?;
    // Keep the style object whole for the emitter; non-object/empty → empty
    // object, which drops the carrier atom downstream.
    let styles = if result.is_null() || result.is_undefined() {
        Literal::Object(Vec::new())
    } else {
        let value: serde_json::Value = serde_wasm_bindgen::from_value(result).map_err(|err| {
            callback_diagnostic(format!(
                "Utility transform callback `{id}` for `{prop}` returned an invalid style object: {err}"
            ))
        })?;
        match json_value_to_literal(&value) {
            Some(object @ Literal::Object(_)) => object,
            _ => Literal::Object(Vec::new()),
        }
    };
    trace_cache_store("utility_transform", prop, cache.len(), cache.cap().get());
    cache.put(cache_key, styles.clone());
    Ok(Some(styles))
}

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract; boxing would diverge from PatternTransformFn"
)]
fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, js_sys::Function>,
    cache: &mut LruCache<PatternTransformCacheKey, Option<Literal>>,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = pattern_transform_refs.get(name) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing pattern transform callback `{id}` for `{name}`"
        )));
    };

    let cache_key =
        pandacss_project::literal_cache_key(styles, MAX_TRANSFORM_CACHE_KEY_BYTES).map(|props| {
            PatternTransformCacheKey {
                id: id.clone(),
                name: name.to_owned(),
                props,
            }
        });
    if let Some(cached) = cache_key.as_ref().and_then(|key| cache.get(key)).cloned() {
        tracing::trace!(
            cache = "pattern_transform",
            action = "hit",
            target = name,
            entries = cache.len()
        );
        return Ok(cached);
    }
    tracing::trace!(
        cache = "pattern_transform",
        action = if cache_key.is_some() {
            "miss"
        } else {
            "skip_oversized_key"
        },
        target = name,
        entries = cache.len()
    );

    let props_value = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;

    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    let props = props_value.serialize(&serializer).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let result = callback
        .call2(&JsValue::NULL, &props, &JsValue::NULL)
        .map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` threw: {}",
                js_error_message(&err)
            ))
        })?;
    let transformed = if result.is_null() || result.is_undefined() {
        None
    } else {
        let value: serde_json::Value = serde_wasm_bindgen::from_value(result).map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` returned an invalid style object: {err}"
            ))
        })?;
        json_value_to_literal(&value).map(Some).ok_or_else(|| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` returned an invalid style object"
            ))
        })?
    };
    if let Some(cache_key) = cache_key {
        trace_cache_store("pattern_transform", name, cache.len(), cache.cap().get());
        cache.put(cache_key, transformed.clone());
    }
    Ok(transformed)
}

fn trace_cache_store(cache: &'static str, target: &str, len: usize, capacity: usize) {
    tracing::trace!(
        cache,
        action = "store",
        target,
        entries = len.saturating_add(1).min(capacity),
        evicted = len == capacity
    );
}

fn get_utility_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (prop, utility) in &config.utilities {
        if let Some(id) = utility_callback_id(utility) {
            refs.insert(prop.clone(), id);
        }
    }

    refs
}

fn get_pattern_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (name, pattern) in &config.patterns {
        let Some(id) = pattern.transform.as_ref().and_then(callback_ref_id) else {
            continue;
        };
        refs.insert(name.clone(), id.clone());
        refs.insert(capitalize(name), id.clone());
        if let Some(jsx_name) = &pattern.jsx_name {
            refs.insert(jsx_name.clone(), id.clone());
        }
        for specifier in &pattern.jsx {
            if let JsxSpecifier::String(jsx_name) = specifier {
                refs.insert(jsx_name.clone(), id.clone());
            }
        }
    }
    refs
}

fn utility_callback_id(utility: &UtilityConfig) -> Option<String> {
    utility.transform.as_ref().and_then(callback_ref_id)
}

fn callback_ref_id(value: &CallbackRef) -> Option<String> {
    (value.kind == "js-callback")
        .then(|| value.id.clone())
        .flatten()
}

fn json_value_to_literal(value: &serde_json::Value) -> Option<Literal> {
    match value {
        serde_json::Value::String(value) => Some(Literal::String(value.clone())),
        serde_json::Value::Number(value) => value.as_f64().map(Literal::Number),
        serde_json::Value::Bool(value) => Some(Literal::Bool(*value)),
        serde_json::Value::Null => Some(Literal::Null),
        serde_json::Value::Array(items) => items
            .iter()
            .map(json_value_to_literal)
            .collect::<Option<Vec<_>>>()
            .map(Literal::Array),
        serde_json::Value::Object(entries) => {
            let mut out = Vec::with_capacity(entries.len());
            for (key, value) in entries {
                out.push((key.clone(), json_value_to_literal(value)?));
            }
            Some(Literal::Object(out))
        }
    }
}

fn callback_diagnostic(message: String) -> pandacss_extractor::Diagnostic {
    pandacss_extractor::Diagnostic {
        code: diagnostic_codes::TRANSFORM_CALLBACK_FAILED.to_owned(),
        message,
        severity: DiagnosticSeverity::Warning,
        file: None,
        category: None,
        span: None,
        location: None,
        labels: None,
        help: None,
    }
}

fn format_deserialize_error(
    error: &serde_json::Error,
    diagnostics: &[pandacss_shared::Diagnostic],
) -> String {
    if diagnostics.is_empty() {
        format!("invalid config: {error}")
    } else {
        format!(
            "invalid config: {error}\n{}",
            format_config_diagnostics(diagnostics)
        )
    }
}

fn format_config_diagnostics(diagnostics: &[pandacss_shared::Diagnostic]) -> String {
    let mut message = String::from("Invalid config:");
    for diagnostic in diagnostics {
        message.push_str("\n- [");
        message.push_str(&diagnostic.code);
        message.push_str("] ");
        message.push_str(&diagnostic.message);
    }
    message
}

fn js_error_message(value: &JsValue) -> String {
    if let Some(error) = value.dyn_ref::<js_sys::Error>() {
        return error.message().into();
    }
    value.as_string().unwrap_or_else(|| format!("{value:?}"))
}

fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_uppercase().chain(chars).collect()
}

fn atom_value_to_json(v: &pandacss_encoder::AtomValue) -> serde_json::Value {
    match v {
        // Resolved CSS string at the boundary; token path is build-info-only.
        pandacss_encoder::AtomValue::String(s)
        | pandacss_encoder::AtomValue::Token { value: s, .. } => {
            serde_json::Value::String(s.to_string())
        }
        pandacss_encoder::AtomValue::Number(s) => parse_number_string(s),
        pandacss_encoder::AtomValue::Bool(b) => serde_json::Value::Bool(*b),
        pandacss_encoder::AtomValue::Null => serde_json::Value::Null,
    }
}

fn utility_value_source_to_json(source: pandacss_project::UtilityValueSource) -> serde_json::Value {
    match source {
        pandacss_project::UtilityValueSource::ValueMap { key, aliases } => {
            serde_json::json!({ "type": "value-map", "key": key, "aliases": aliases })
        }
        pandacss_project::UtilityValueSource::Literal { aliases } => {
            serde_json::json!({ "type": "literal", "aliases": aliases })
        }
        pandacss_project::UtilityValueSource::TokenReference => {
            serde_json::json!({ "type": "token-reference" })
        }
        pandacss_project::UtilityValueSource::Arbitrary => {
            serde_json::json!({ "type": "arbitrary" })
        }
    }
}

fn parse_number_string(s: &str) -> serde_json::Value {
    if let Ok(n) = s.parse::<i64>() {
        return serde_json::Value::from(n);
    }
    if let Ok(f) = s.parse::<f64>()
        && let Some(num) = serde_json::Number::from_f64(f)
    {
        return serde_json::Value::Number(num);
    }
    serde_json::Value::String(s.to_string())
}

fn value_sort_key(v: &pandacss_encoder::AtomValue) -> String {
    match v {
        pandacss_encoder::AtomValue::String(s)
        | pandacss_encoder::AtomValue::Token { value: s, .. } => format!("s:{s}"),
        pandacss_encoder::AtomValue::Number(s) => format!("n:{s}"),
        pandacss_encoder::AtomValue::Bool(b) => format!("b:{b}"),
        pandacss_encoder::AtomValue::Null => "z:".to_owned(),
    }
}
