//! WASM `WasmProject` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration over a `WasmFileSystem` handle. Atoms +
//! recipes accumulate across `parseFile` calls. Cross-file folding shares
//! the same in-memory FS so `import { x } from './tokens'` resolves
//! through whatever the JS host has populated.

use pandacss_encoder::{Atom as CoreAtom, AtomValue};
use pandacss_extractor::{CrossFileResolver, ExtractorConfig};
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use serde::Serialize as _;
use std::collections::HashMap;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::cache::{PatternTransformCacheKey, TransformCache, UtilityTransformCacheKey};
use crate::fs::WasmFileSystem;
use crate::matcher::{MatchersInput, to_core_matchers, to_core_token_dictionary};
use pandacss_config::{
    CallbackRef, JsxSpecifier, UserConfig, UtilityConfig, ValidationMode, validate_config_value,
    validation_mode_from_value,
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
/// const project = WasmProject.fromConfig(fs, config)
/// project.parseFile('/proj/main.tsx', fs.readFile('/proj/main.tsx'))
/// const atoms = project.atoms()
/// ```
#[wasm_bindgen]
pub struct WasmProject {
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
    fn empty() -> Self {
        Self {
            utility_transform_refs: HashMap::new(),
            pattern_transform_refs: HashMap::new(),
            utility_transforms: HashMap::new(),
            pattern_transforms: HashMap::new(),
            transform_cache: TransformCache::default(),
        }
    }

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
impl WasmProject {
    /// Construct from explicit matchers. This mirrors `WasmExtractor` but keeps
    /// project-level file state.
    #[wasm_bindgen(constructor)]
    pub fn new(
        fs: &WasmFileSystem,
        matchers: JsValue,
        options: JsValue,
    ) -> Result<WasmProject, JsValue> {
        let mut input: MatchersInput = serde_wasm_bindgen::from_value(matchers)
            .map_err(|err| JsValue::from_str(&format!("invalid matchers: {err}")))?;
        let opts = if options.is_undefined() || options.is_null() {
            ProjectOptionsInput::default()
        } else {
            serde_wasm_bindgen::from_value::<ProjectOptionsInput>(options)
                .map_err(|err| JsValue::from_str(&format!("invalid options: {err}")))?
        };

        let token_dictionary = input.token_dictionary.take().map(to_core_token_dictionary);
        let core_matchers = to_core_matchers(input);
        let mut extractor_config = ExtractorConfig::new(core_matchers);
        extractor_config.token_dictionary = token_dictionary.map(std::sync::Arc::new);
        extractor_config.cross_file = Some(CrossFileResolver::with_fs(fs.inner.clone()));

        let (config_snapshot, callbacks) = if let Some(config_value) = opts.config {
            let config_snapshot = config_value.clone();
            let raw_diagnostics = validate_config_value(&config_snapshot);
            if validation_mode_from_value(&config_snapshot) == ValidationMode::Error
                && !raw_diagnostics.is_empty()
            {
                return Err(JsValue::from_str(&format_config_diagnostics(
                    &raw_diagnostics,
                )));
            }
            let config: UserConfig = serde_json::from_value(config_value).map_err(|err| {
                JsValue::from_str(&format_deserialize_error(err, &raw_diagnostics))
            })?;
            (config_snapshot, CallbackHost::from_config(&config))
        } else {
            (serde_json::Value::Null, CallbackHost::empty())
        };

        Ok(Self {
            inner: pandacss_project::Project::from_extractor_config(extractor_config),
            config: config_snapshot,
            callbacks,
        })
    }

    /// Construct a project from the resolved, JSON-safe Panda config snapshot.
    ///
    /// # Errors
    /// Returns a JS error when `config` doesn't deserialize into JSON.
    #[wasm_bindgen(js_name = fromConfig)]
    pub fn from_config(
        fs: &WasmFileSystem,
        config: JsValue,
        options: JsValue,
    ) -> Result<WasmProject, JsValue> {
        if !options.is_undefined() && !options.is_null() {
            serde_wasm_bindgen::from_value::<ProjectOptionsInput>(options)
                .map_err(|err| JsValue::from_str(&format!("invalid options: {err}")))?;
        }

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
        let config: UserConfig = serde_json::from_value(config_value)
            .map_err(|err| JsValue::from_str(&format_deserialize_error(err, &raw_diagnostics)))?;
        let callbacks = CallbackHost::from_config(&config);
        let project =
            pandacss_project::Project::from_config_and_diagnostics(config, raw_diagnostics)
                .map_err(|err| JsValue::from_str(&format!("invalid config: {err}")))?;

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
            let WasmProject {
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
            inner.parse_file_with_transforms(
                path,
                source,
                has_pattern_transforms
                    .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
                has_utility_transforms.then_some(
                    &mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>,
                ),
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
    pub fn extract(&self, source: &str, path: &str) -> Result<JsValue, JsValue> {
        let result = self.inner.extract(source, path);
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

        let WasmProject {
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
        inner.refresh_file_with_transforms(
            path,
            source,
            has_pattern_transforms
                .then_some(&mut transform as &mut pandacss_project::PatternTransformFn<'_>),
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
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
}

#[derive(Default, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct ProjectOptionsInput {
    config: Option<serde_json::Value>,
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
    error: serde_json::Error,
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
    if let Ok(f) = s.parse::<f64>() {
        if let Some(num) = serde_json::Number::from_f64(f) {
            return serde_json::Value::Number(num);
        }
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
