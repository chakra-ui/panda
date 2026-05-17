//! WASM `WasmProject` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration over a `WasmFileSystem` handle. Atoms +
//! recipes accumulate across `parseFile` calls. Cross-file folding shares
//! the same in-memory FS so `import { x } from './tokens'` resolves
//! through whatever the JS host has populated.

use pandacss_extractor::CrossFileResolver;
use pandacss_extractor::{DiagnosticSeverity, Literal};
use serde::Serialize as _;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use crate::matcher::{MatchersInput, to_core_matchers, to_core_token_dictionary};

/// JS-facing project handle. Constructed once per session with a
/// [`WasmFileSystem`] (whose contents the cross-file resolver reads),
/// plus matchers.
///
/// ```js
/// const fs = new WasmFileSystem()
/// fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444';")
/// fs.addFile('/proj/main.tsx', "import { brand } from './tokens'\ncss({ color: brand })")
/// const project = new WasmProject(fs, matchers)
/// project.parseFile('/proj/main.tsx', fs.readFile('/proj/main.tsx'))
/// const atoms = project.atoms()
/// ```
#[wasm_bindgen]
pub struct WasmProject {
    inner: pandacss_project::Project,
    pattern_transform_refs: HashMap<String, String>,
    pattern_transforms: HashMap<String, js_sys::Function>,
}

#[wasm_bindgen]
impl WasmProject {
    /// Cross-file folding is always enabled and shares the passed FS.
    ///
    /// # Errors
    /// Returns a JS error when `matchers` doesn't deserialize into the
    /// expected `MatchersInput` shape.
    #[wasm_bindgen(constructor)]
    pub fn new(
        fs: &WasmFileSystem,
        matchers: JsValue,
        options: JsValue,
    ) -> Result<WasmProject, JsValue> {
        let mut input: MatchersInput = serde_wasm_bindgen::from_value(matchers)
            .map_err(|err| JsValue::from_str(&format!("invalid matchers: {err}")))?;

        if !options.is_undefined() && !options.is_null() {
            serde_wasm_bindgen::from_value::<ProjectOptionsInput>(options)
                .map_err(|err| JsValue::from_str(&format!("invalid options: {err}")))?;
        }

        let token_dictionary = input.token_dictionary.take().map(to_core_token_dictionary);
        let core_matchers = to_core_matchers(input);

        let mut extractor_config = pandacss_extractor::ExtractorConfig::new(core_matchers);
        extractor_config.token_dictionary = token_dictionary.map(std::sync::Arc::new);
        let project = pandacss_project::Project::from_extractor_config(extractor_config);

        Ok(Self {
            inner: with_wasm_fs(project, fs),
            pattern_transform_refs: HashMap::new(),
            pattern_transforms: HashMap::new(),
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
        let pattern_transform_refs = get_pattern_transform_refs(&config_value);
        let config = serde_json::from_value(config_value)
            .map_err(|err| JsValue::from_str(&format!("invalid config: {err}")))?;
        let project = pandacss_project::Project::from_config(config)
            .map_err(|err| JsValue::from_str(&format!("invalid config: {err}")))?;

        Ok(Self {
            inner: with_wasm_fs(project, fs),
            pattern_transform_refs,
            pattern_transforms: HashMap::new(),
        })
    }

    /// Register a JS-backed pattern transform callback. The wrapper package
    /// installs callbacks referenced by the serialized config snapshot.
    #[wasm_bindgen(js_name = registerPatternTransform)]
    pub fn register_pattern_transform(&mut self, id: String, callback: js_sys::Function) {
        self.pattern_transforms.insert(id, callback);
    }

    /// Extract + encode a single file. Replaces any prior contribution
    /// from `path`.
    ///
    /// # Errors
    /// Returns a JS error if serializing the per-call report fails.
    #[wasm_bindgen(js_name = parseFile)]
    pub fn parse_file(&mut self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let report = if self.pattern_transforms.is_empty() {
            self.inner.parse_file(path, source)
        } else {
            let pattern_transform_refs = &self.pattern_transform_refs;
            let pattern_transforms = &self.pattern_transforms;
            let mut transform = |name: &str, styles: &Literal| {
                apply_pattern_transform(name, styles, pattern_transform_refs, pattern_transforms)
            };
            self.inner
                .parse_file_with_pattern_transforms(path, source, &mut transform)
        };
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        report
            .serialize(&serializer)
            .map_err(|err| JsValue::from_str(&err.to_string()))
    }

    /// Re-parse `path` *only if* already known. Returns `true` when the
    /// file was present and got re-parsed.
    #[wasm_bindgen(js_name = refreshFile)]
    #[must_use]
    pub fn refresh_file(&mut self, path: &str, source: &str) -> bool {
        self.inner.refresh_file(path, source)
    }

    /// Drop a file's contribution. Returns `true` if the path was known.
    #[wasm_bindgen(js_name = removeFile)]
    #[must_use]
    pub fn remove_file(&mut self, path: &str) -> bool {
        self.inner.remove_file(path)
    }

    /// Drop every path's state. Keeps the matchers / token dictionary /
    /// cross-file resolver intact.
    pub fn clear(&mut self) {
        self.inner.clear();
    }

    /// Return the serialized config snapshot this project was constructed
    /// with, or `null` for matcher-based construction.
    ///
    /// # Errors
    /// Returns a JS error if serializing fails.
    pub fn config(&self) -> Result<JsValue, JsValue> {
        let value = self
            .inner
            .serialized_config()
            .and_then(|config| serde_json::to_value(config).ok())
            .unwrap_or(serde_json::Value::Null);
        let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
        value
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
    pub fn atoms(&self) -> Result<JsValue, JsValue> {
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
    pub fn encoded_recipes(&self) -> Result<JsValue, JsValue> {
        let json = serde_json::to_string(&self.inner.encoded_recipes().snapshot())
            .map_err(|err| JsValue::from_str(&err.to_string()))?;
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
struct ProjectOptionsInput {}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AtomSerde {
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

fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, js_sys::Function>,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = pattern_transform_refs.get(name) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing pattern transform callback `{id}` for `{name}`"
        )));
    };

    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    let props = styles.serialize(&serializer).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let result = callback
        .call2(&JsValue::NULL, &props, &JsValue::NULL)
        .map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` threw: {err:?}"
            ))
        })?;
    if result.is_null() || result.is_undefined() {
        return Ok(None);
    }

    let value: serde_json::Value = serde_wasm_bindgen::from_value(result).map_err(|err| {
        callback_diagnostic(format!(
            "Pattern transform callback `{id}` for `{name}` returned an invalid style object: {err}"
        ))
    })?;
    json_value_to_literal(&value).map(Some).ok_or_else(|| {
        callback_diagnostic(format!(
            "Pattern transform callback `{id}` for `{name}` returned an invalid style object"
        ))
    })
}

fn get_pattern_transform_refs(config: &serde_json::Value) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    collect_pattern_transform_refs(config.get("patterns"), &mut refs);
    refs
}

fn collect_pattern_transform_refs(
    value: Option<&serde_json::Value>,
    refs: &mut HashMap<String, String>,
) {
    let Some(patterns) = value.and_then(serde_json::Value::as_object) else {
        return;
    };

    collect_pattern_transform_ref_map(patterns, refs);
}

fn collect_pattern_transform_ref_map(
    patterns: &serde_json::Map<String, serde_json::Value>,
    refs: &mut HashMap<String, String>,
) {
    for (name, pattern) in patterns {
        let Some(pattern) = pattern.as_object() else {
            continue;
        };
        let Some(id) = pattern
            .get("transform")
            .and_then(callback_ref_id)
            .map(str::to_owned)
        else {
            continue;
        };
        refs.insert(name.clone(), id.clone());
        refs.insert(capitalize(name), id.clone());
        if let Some(jsx_name) = pattern.get("jsxName").and_then(serde_json::Value::as_str) {
            refs.insert(jsx_name.to_owned(), id.clone());
        }
        if let Some(items) = pattern.get("jsx").and_then(serde_json::Value::as_array) {
            for jsx_name in items.iter().filter_map(serde_json::Value::as_str) {
                refs.insert(jsx_name.to_owned(), id.clone());
            }
        }
    }
}

fn callback_ref_id(value: &serde_json::Value) -> Option<&str> {
    let value = value.as_object()?;
    let kind = value.get("kind").and_then(serde_json::Value::as_str)?;
    if kind != "js-callback" {
        return None;
    }
    value.get("id").and_then(serde_json::Value::as_str)
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
        message,
        severity: DiagnosticSeverity::Warning,
        span: None,
        location: None,
    }
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
