use super::WasmCompiler;

use pandacss_encoder::AtomValue;
use pandacss_extractor::Literal;
use pandacss_fs::{FileSystem, GlobOptions, OxcResolverFileSystem, PathSystem};
use serde::Serialize as _;
use std::path::{Path, PathBuf};
use wasm_bindgen::prelude::*;

use super::serde_types::{CompileFileManifestSerde, ParsedFileViewSerde, RecipeEntrySerde};
use super::support::{collect_sorted_atoms, glob_options, parse_file_report};
use super::transforms::{
    apply_pattern_transform, apply_source_transforms, apply_utility_transform,
};

#[wasm_bindgen]
impl WasmCompiler {
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

    /// Returns `true` when the project has no files and no accumulated output.
    #[wasm_bindgen(js_name = isEmpty)]
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
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
}
