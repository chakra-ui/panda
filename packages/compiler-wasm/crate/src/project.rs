//! WASM `WasmProject` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration over a `WasmFileSystem` handle. Atoms +
//! recipes accumulate across `parseFile` calls. Cross-file folding shares
//! the same in-memory FS so `import { x } from './tokens'` resolves
//! through whatever the JS host has populated.

use pandacss_encoder::{Atom as CoreAtom, AtomValue};
use pandacss_extractor::CrossFileResolver;
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use serde::Serialize as _;
use std::collections::{BTreeSet, HashMap};
use std::sync::Arc;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::cache::{PatternTransformCacheKey, TransformCache, UtilityTransformCacheKey};
use crate::fs::WasmFileSystem;
use crate::matcher::from_core_token_dictionary;
use pandacss_config::{
    CallbackRef, JsxSpecifier, UserConfig, UtilityConfig, UtilityValues, ValidationMode,
    validate_config_value, validation_mode_from_value,
};
use smallvec::SmallVec;

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
    callbacks: CallbackHost,
}

struct CallbackHost {
    utility_transform_refs: HashMap<String, String>,
    pattern_transform_refs: HashMap<String, String>,
    utility_transforms: HashMap<String, js_sys::Function>,
    pattern_transforms: HashMap<String, js_sys::Function>,
    transform_cache: TransformCache,
}

impl CallbackHost {
    fn from_config(config: &UserConfig) -> Self {
        Self {
            utility_transform_refs: get_utility_transform_refs(config),
            pattern_transform_refs: get_pattern_transform_refs(config),
            utility_transforms: HashMap::new(),
            pattern_transforms: HashMap::new(),
            transform_cache: TransformCache::default(),
        }
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
            callbacks,
        })
    }

    /// Register a JS-backed utility transform callback. The JS package wraps
    /// the user callback so Rust only has to pass the raw value.
    #[wasm_bindgen(js_name = registerUtilityTransform)]
    pub fn register_utility_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
    }

    /// Register a JS-backed pattern transform callback. The wrapper package
    /// installs callbacks referenced by the serialized config snapshot.
    #[wasm_bindgen(js_name = registerPatternTransform)]
    pub fn register_pattern_transform(&mut self, id: String, callback: js_sys::Function) {
        self.callbacks.pattern_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_pattern();
    }

    /// Extract + encode a single file. Replaces any prior contribution
    /// from `path`.
    ///
    /// # Errors
    /// Returns a JS error if serializing the per-call report fails.
    #[wasm_bindgen(js_name = parseFile)]
    pub fn parse_file(&mut self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let report = if !has_pattern_transforms && !has_utility_transforms {
            self.inner.parse_file(path, source)
        } else {
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
            let mut utility_transform = |prop: &str, value: &AtomValue| {
                apply_utility_transform(
                    prop,
                    value,
                    &callbacks.utility_transform_refs,
                    &callbacks.utility_transforms,
                    utility_cache,
                )
            };
            inner.parse_file_with(
                path,
                source,
                pandacss_project::ParseTransforms {
                    pattern: has_pattern_transforms
                        .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
                    utility: has_utility_transforms.then_some(
                        &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                    ),
                },
            )
        };
        let _span = tracing::trace_span!("boundary_encode", method = "parse_file_report").entered();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        report
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Stateless single-file extraction — raw `{ calls, jsx, diagnostics }`,
    /// using the project's configured matchers + token dictionary. Unlike
    /// `parseFile`, it registers nothing; it's the read-only peek companion.
    ///
    /// # Errors
    /// Returns a JS error string when serializing the result fails.
    pub fn extract(&self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let result = self.inner.extract(path, source);
        let _span = tracing::trace_span!("boundary_encode", method = "extract").entered();
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        result
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Re-parse `path` *only if* already known. Returns `true` when the
    /// file was present and got re-parsed.
    #[wasm_bindgen(js_name = refreshFile)]
    #[must_use]
    pub fn refresh_file(&mut self, path: &str, source: &str) -> bool {
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_pattern_transforms && !has_utility_transforms {
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
        let mut utility_transform = |prop: &str, value: &AtomValue| {
            apply_utility_transform(
                prop,
                value,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
            )
        };
        inner.refresh_file_with(
            path,
            source,
            pandacss_project::ParseTransforms {
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
    /// Returns a JS error if serializing fails, or if the configured
    /// user-config can't be reconstructed from the snapshot.
    pub fn compile(&mut self) -> Result<JsValue, JsValue> {
        let _span = tracing::trace_span!("css_compile", method = "wasm_project_compile").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms();
        let user_config: pandacss_config::UserConfig = serde_json::from_value(self.config.clone())
            .map_err(|err| JsValue::from_str(&format!("invalid config snapshot: {err}")))?;
        let output = build_compile_output(
            &mut self.inner,
            &user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
        );
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        output
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    fn collect_static_pattern_atoms(
        &mut self,
    ) -> (Vec<CoreAtom>, Vec<pandacss_extractor::Diagnostic>) {
        let WasmCompiler {
            inner,
            config,
            callbacks,
        } = self;
        let Ok(user_config) = serde_json::from_value::<pandacss_config::UserConfig>(config.clone())
        else {
            return (Vec::new(), Vec::new());
        };
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
                &user_config,
                Some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
            )
        } else {
            inner.static_pattern_atoms(&user_config, None)
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

fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
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
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        include_static: true,
        source_map: false,
    };
    let output = pandacss_stylesheet::compile(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
        },
        &options,
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

fn apply_utility_transform(
    prop: &str,
    value: &AtomValue,
    utility_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, js_sys::Function>,
    cache: &mut HashMap<UtilityTransformCacheKey, Vec<AtomSerde>>,
) -> Result<Option<Vec<CoreAtom>>, pandacss_extractor::Diagnostic> {
    let Some(id) = utility_transform_refs.get(prop) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing utility transform callback `{id}` for `{prop}`"
        )));
    };

    let value = atom_value_to_json(value);
    let cache_key = UtilityTransformCacheKey {
        id: id.clone(),
        prop: prop.to_owned(),
        value: value.to_string(),
    };
    if let Some(cached) = cache.get(&cache_key) {
        return Ok(Some(
            cached
                .iter()
                .filter_map(core_atom_from_atom_serde)
                .collect(),
        ));
    }

    let value = serde_wasm_bindgen::to_value(&value).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize utility transform value for `{prop}`: {err}"
        ))
    })?;
    let result = callback.call1(&JsValue::NULL, &value).map_err(|err| {
        callback_diagnostic(format!(
            "Utility transform callback `{id}` for `{prop}` threw: {}",
            js_error_message(&err)
        ))
    })?;
    if result.is_null() || result.is_undefined() {
        return Ok(Some(Vec::new()));
    }
    let style: serde_json::Value = serde_wasm_bindgen::from_value(result).map_err(|err| {
        callback_diagnostic(format!(
            "Utility transform callback `{id}` for `{prop}` returned an invalid style object: {err}"
        ))
    })?;
    let Some(style) = style.as_object() else {
        return Ok(Some(Vec::new()));
    };
    if style.is_empty() {
        cache.insert(cache_key, Vec::new());
        return Ok(Some(Vec::new()));
    }
    let transformed = style_object_to_atoms(style, &[]);
    let core = transformed
        .iter()
        .filter_map(core_atom_from_atom_serde)
        .collect();
    cache.insert(cache_key, transformed);
    Ok(Some(core))
}

fn style_object_to_atoms(
    style: &serde_json::Map<String, serde_json::Value>,
    base_conditions: &[String],
) -> Vec<AtomSerde> {
    let mut atoms = Vec::new();
    let mut path = Vec::new();
    walk_style(
        &serde_json::Value::Object(style.clone()),
        &mut path,
        base_conditions,
        &mut atoms,
    );
    atoms.sort_by(|a, b| {
        a.prop
            .cmp(&b.prop)
            .then_with(|| a.conditions.cmp(&b.conditions))
            .then_with(|| a.value.to_string().cmp(&b.value.to_string()))
    });
    atoms
}

fn walk_style(
    value: &serde_json::Value,
    path: &mut Vec<String>,
    base_conditions: &[String],
    atoms: &mut Vec<AtomSerde>,
) {
    if let serde_json::Value::Object(entries) = value {
        for (key, child) in entries {
            path.push(key.clone());
            walk_style(child, path, base_conditions, atoms);
            path.pop();
        }
        return;
    }

    let Some(prop) = path.first() else {
        return;
    };

    atoms.push(AtomSerde {
        prop: prop.clone(),
        value: normalize_atom_value(value),
        conditions: base_conditions.to_vec(),
    });
}

fn normalize_atom_value(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::String(_)
        | serde_json::Value::Number(_)
        | serde_json::Value::Bool(_)
        | serde_json::Value::Null => value.clone(),
        serde_json::Value::Array(items) => {
            let joined = items
                .iter()
                .map(|item| match item {
                    serde_json::Value::String(value) => value.clone(),
                    other => other.to_string(),
                })
                .collect::<Vec<_>>()
                .join(",");
            serde_json::Value::String(format!("[{joined}]"))
        }
        serde_json::Value::Object(_) => serde_json::Value::String("[object Object]".to_owned()),
    }
}

fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, js_sys::Function>,
    cache: &mut HashMap<PatternTransformCacheKey, Option<Literal>>,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = pattern_transform_refs.get(name) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing pattern transform callback `{id}` for `{name}`"
        )));
    };

    let props_value = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let props_key = serde_json::to_string(&props_value).map_err(|err| {
        callback_diagnostic(format!("Failed to cache pattern props for `{name}`: {err}"))
    })?;
    let cache_key = PatternTransformCacheKey {
        id: id.clone(),
        name: name.to_owned(),
        props: props_key,
    };
    if let Some(cached) = cache.get(&cache_key) {
        return Ok(cached.clone());
    }

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
    cache.insert(cache_key, transformed.clone());
    Ok(transformed)
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
        span: None,
        location: None,
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
        pandacss_encoder::AtomValue::String(s) => serde_json::Value::String(s.to_string()),
        pandacss_encoder::AtomValue::Number(s) => parse_number_string(s),
        pandacss_encoder::AtomValue::Bool(b) => serde_json::Value::Bool(*b),
        pandacss_encoder::AtomValue::Null => serde_json::Value::Null,
    }
}

fn core_atom_from_atom_serde(atom: &AtomSerde) -> Option<CoreAtom> {
    let value = atom_value_from_json(&atom.value)?;
    let conditions: SmallVec<[Box<str>; 2]> = atom
        .conditions
        .iter()
        .cloned()
        .map(String::into_boxed_str)
        .collect();
    Some(CoreAtom::new(
        atom.prop.clone().into_boxed_str(),
        value,
        conditions,
        false,
    ))
}

fn atom_value_from_json(value: &serde_json::Value) -> Option<AtomValue> {
    match value {
        serde_json::Value::String(value) => Some(AtomValue::String(value.clone().into_boxed_str())),
        serde_json::Value::Number(value) => {
            Some(AtomValue::Number(value.to_string().into_boxed_str()))
        }
        serde_json::Value::Bool(value) => Some(AtomValue::Bool(*value)),
        serde_json::Value::Null => Some(AtomValue::Null),
        serde_json::Value::Array(_) | serde_json::Value::Object(_) => None,
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
        pandacss_encoder::AtomValue::String(s) => format!("s:{s}"),
        pandacss_encoder::AtomValue::Number(s) => format!("n:{s}"),
        pandacss_encoder::AtomValue::Bool(b) => format!("b:{b}"),
        pandacss_encoder::AtomValue::Null => "z:".to_owned(),
    }
}
