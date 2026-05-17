//! WASM `WasmProject` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration over a `WasmFileSystem` handle. Atoms +
//! recipes accumulate across `parseFile` calls. Cross-file folding shares
//! the same in-memory FS so `import { x } from './tokens'` resolves
//! through whatever the JS host has populated.

use pandacss_extractor::CrossFileResolver;
use serde::Serialize as _;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use crate::matcher::{MatchersInput, to_core_matchers, to_core_token_dictionary};

/// JS-facing project handle. Constructed once per session with a
/// [`WasmFileSystem`] (whose contents the cross-file resolver reads),
/// plus matchers + optional token dictionary.
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
}

#[wasm_bindgen]
impl WasmProject {
    /// `options` is an optional `{ tokenDictionary?: TokenDictionaryInput }`.
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

        // `options` is optional — `undefined` / `null` → defaults.
        let token_dictionary_input = if options.is_undefined() || options.is_null() {
            input.token_dictionary.take()
        } else {
            let opts: ProjectOptionsInput = serde_wasm_bindgen::from_value(options)
                .map_err(|err| JsValue::from_str(&format!("invalid options: {err}")))?;
            opts.token_dictionary
                .or_else(|| input.token_dictionary.take())
        };

        let token_dictionary = token_dictionary_input.map(to_core_token_dictionary);
        let core_matchers = to_core_matchers(input);

        let mut project = pandacss_project::Project::from_matchers(core_matchers);
        if let Some(dict) = token_dictionary {
            project = project.with_token_dictionary(dict);
        }

        Ok(Self {
            inner: with_wasm_fs(project, fs),
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
        let token_dictionary_input = if options.is_undefined() || options.is_null() {
            None
        } else {
            let opts: ProjectOptionsInput = serde_wasm_bindgen::from_value(options)
                .map_err(|err| JsValue::from_str(&format!("invalid options: {err}")))?;
            opts.token_dictionary
        };

        let config = serde_wasm_bindgen::from_value(config)
            .map_err(|err| JsValue::from_str(&format!("invalid config: {err}")))?;
        let mut project = pandacss_project::Project::from_serialized_config(config);
        if let Some(dict) = token_dictionary_input.map(to_core_token_dictionary) {
            project = project.with_token_dictionary(dict);
        }

        Ok(Self {
            inner: with_wasm_fs(project, fs),
        })
    }

    /// Extract + encode a single file. Replaces any prior contribution
    /// from `path`.
    ///
    /// # Errors
    /// Returns a JS error if serializing the per-call report fails.
    #[wasm_bindgen(js_name = parseFile)]
    pub fn parse_file(&mut self, path: &str, source: &str) -> Result<JsValue, JsValue> {
        let report = self.inner.parse_file(path, source);
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
    token_dictionary: Option<crate::matcher::TokenDictionaryInput>,
}

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
        a.prop
            .cmp(&b.prop)
            .then_with(|| {
                let a_conds: Vec<&str> = a.conditions.iter().map(AsRef::as_ref).collect();
                let b_conds: Vec<&str> = b.conditions.iter().map(AsRef::as_ref).collect();
                a_conds.cmp(&b_conds)
            })
            .then_with(|| value_sort_key(&a.value).cmp(&value_sort_key(&b.value)))
    });
    sorted
        .into_iter()
        .map(|atom| AtomSerde {
            prop: atom.prop.to_string(),
            value: atom_value_to_json(&atom.value),
            conditions: atom
                .conditions
                .iter()
                .map(std::string::ToString::to_string)
                .collect::<Vec<String>>(),
        })
        .collect()
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
