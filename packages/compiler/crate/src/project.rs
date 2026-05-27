//! NAPI `Project` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration. Holds a per-file atom registry, drops a
//! file's contribution on `removeFile` / `refreshFile`, runs the encoder over
//! every extracted style so callers see `Atom[]` directly (not raw
//! `ExtractedCall` records — for that, use `Extractor`).

use napi_derive::napi;
use std::collections::HashMap;

use crate::Diagnostic;
use crate::cache::{PatternTransformCacheKey, TransformCache, UtilityTransformCacheKey};
use crate::convert::{convert_diagnostic, to_atoms, to_call, to_jsx};
use crate::extract::ExtractResult;
use napi::bindgen_prelude::{Env, FnArgs, FunctionRef};
use pandacss_config::{CallbackRef, JsxSpecifier, PatternConfig, UserConfig, UtilityConfig};
use pandacss_encoder::{Atom as CoreAtom, AtomValue};
use pandacss_extractor::{DiagnosticSeverity, Literal};
use pandacss_project::{EncodedRecipesSnapshot, RecipeStyleEntry, RecipeStyleGroupSnapshot};
use serde::Deserialize;
use smallvec::SmallVec;

use crate::compile::{CompileManifest, CompileOutput};

/// Per-call telemetry from `parseFile`. Mirrors `pandacss_project::ParseFileReport`.
#[napi(object)]
pub struct ParseFileReport {
    pub css_calls: u32,
    pub cva_calls: u32,
    pub sva_calls: u32,
    pub jsx_usages: u32,
    pub diagnostics: Vec<Diagnostic>,
}

/// Aggregate counts across the project. Cheap; doesn't recompute anything.
#[napi(object)]
pub struct ProjectSummary {
    pub files_processed: u32,
    pub atom_count: u32,
    pub recipe_count: u32,
    pub slot_recipe_count: u32,
}

/// Optional project-construction inputs.
#[napi(object)]
pub struct ProjectOptions {
    /// When `true` (default), construct a `CrossFileResolver` over the
    /// native filesystem. Set to `false` to disable cross-file folding.
    pub cross_file: Option<bool>,
}

/// One `(file, span_start, value)` entry for the recipe and slot-recipe
/// iterators. `value` is the serialized recipe shape (matches
/// `pandacss_recipes::Recipe` / `SlotRecipe`).
#[napi(object)]
pub struct RecipeEntry {
    pub file: String,
    pub span_start: u32,
    pub recipe: serde_json::Value,
}

#[napi]
pub struct Project {
    inner: pandacss_project::Project,
    config: serde_json::Value,
    callbacks: CallbackHost,
}

struct CallbackHost {
    utility_transform_refs: HashMap<String, String>,
    pattern_transform_refs: HashMap<String, String>,
    utility_transforms: HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
    pattern_transforms: HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
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

#[napi]
impl Project {
    /// Construct a project from the resolved, JSON-safe Panda config snapshot.
    #[napi(factory)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned constructor arguments"
    )]
    pub fn from_config(
        config: serde_json::Value,
        options: Option<ProjectOptions>,
    ) -> napi::Result<Self> {
        crate::init_tracing();
        let opts = options.unwrap_or(ProjectOptions { cross_file: None });
        let config_snapshot = config.clone();
        let config: UserConfig = serde_json::from_value(config)
            .map_err(|err| napi::Error::from_reason(format!("invalid config: {err}")))?;
        let callbacks = CallbackHost::from_config(&config);
        let project = pandacss_project::Project::from_config(config)
            .map_err(|err| napi::Error::from_reason(format!("invalid config: {err}")))?;
        Ok(Self {
            inner: apply_project_options(project, opts),
            config: config_snapshot,
            callbacks,
        })
    }

    /// Return the serialized config snapshot this project was constructed
    /// with.
    #[napi]
    #[must_use]
    pub fn config(&self) -> serde_json::Value {
        self.config.clone()
    }

    /// Register a JS-backed utility transform callback. The config snapshot
    /// stores only callback ids; the JS layer passes the live function refs
    /// through this method after constructing the native project.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn register_utility_transform(
        &mut self,
        id: String,
        callback: FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    ) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
    }

    /// Register a JS-backed pattern transform callback. Pattern transforms
    /// run before atomic encoding and may return full system style objects,
    /// including nested conditions.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn register_pattern_transform(
        &mut self,
        id: String,
        callback: FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    ) {
        self.callbacks.pattern_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_pattern();
    }

    /// Extract + encode a single file. Re-parsing a path replaces its prior
    /// contribution (atoms, recipes, diagnostics) — safe for watch mode.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file(&mut self, env: Env, path: String, source: String) -> ParseFileReport {
        crate::init_tracing();
        let report = if !self.callbacks.has_pattern_transforms() {
            self.inner.parse_file(&path, &source)
        } else {
            let Project {
                inner, callbacks, ..
            } = self;
            let mut transform = |name: &str, styles: &Literal| {
                apply_pattern_transform(
                    name,
                    styles,
                    &callbacks.pattern_transform_refs,
                    &callbacks.pattern_transforms,
                    &mut callbacks.transform_cache,
                    &env,
                )
            };
            inner.parse_file_with_pattern_transforms(&path, &source, &mut transform)
        };
        let _span = tracing::trace_span!("boundary_encode", method = "parse_file_report").entered();
        let report = ParseFileReport {
            css_calls: u32::try_from(report.css_calls).unwrap_or(u32::MAX),
            cva_calls: u32::try_from(report.cva_calls).unwrap_or(u32::MAX),
            sva_calls: u32::try_from(report.sva_calls).unwrap_or(u32::MAX),
            jsx_usages: u32::try_from(report.jsx_usages).unwrap_or(u32::MAX),
            diagnostics: report
                .diagnostics
                .into_iter()
                .map(convert_diagnostic)
                .collect(),
        };
        crate::flush_tracing();
        report
    }

    /// Stateless single-file extraction — raw `calls` + `jsx` + diagnostics,
    /// using the project's configured matchers + token dictionary. Unlike
    /// `parseFile`, it registers nothing; it's the read-only peek companion.
    #[napi]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn extract(&self, source: String, path: String) -> ExtractResult {
        crate::init_tracing();
        let result = self.inner.extract(&source, &path);
        ExtractResult {
            calls: result.calls.into_iter().map(to_call).collect(),
            jsx: result.jsx.into_iter().map(to_jsx).collect(),
            diagnostics: result
                .diagnostics
                .into_iter()
                .map(convert_diagnostic)
                .collect(),
        }
    }

    /// Re-parse a path *only if* it is already known to the project.
    /// Returns `true` if the path was present and got re-parsed; `false`
    /// if the path is unknown (no-op). Watch-mode contract.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn refresh_file(&mut self, path: String, source: String) -> bool {
        self.inner.refresh_file(&path, &source)
    }

    /// Drop a file's contribution. Returns `true` if the path was known.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn remove_file(&mut self, path: String) -> bool {
        self.inner.remove_file(&path)
    }

    /// Drop every path's state. Keeps the config-derived extractor,
    /// token dictionary, and cross-file resolver intact.
    #[napi]
    pub fn clear(&mut self) {
        self.inner.clear();
        self.callbacks.transform_cache.clear();
    }

    /// Returns `true` when the project has no files and no accumulated output.
    #[napi(js_name = isEmpty)]
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }

    /// Deduplicated atoms across every currently-known file. Sorted by
    /// `(prop, conditions, value)` for stable iteration / snapshot tests.
    #[napi]
    #[must_use]
    pub fn atoms(&mut self, env: Env) -> napi::Result<Vec<crate::Atom>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "atoms").entered();
        let atoms = to_atoms(self.inner.atoms());
        if !self.callbacks.has_utility_transforms() {
            crate::flush_tracing();
            return Ok(atoms);
        }
        apply_utility_transforms(
            atoms,
            &self.callbacks.utility_transform_refs,
            &self.callbacks.utility_transforms,
            &mut self.callbacks.transform_cache,
            &env,
        )
        .inspect(|_| crate::flush_tracing())
    }

    /// Every `cva()` recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn recipes(&self) -> Vec<RecipeEntry> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "recipes").entered();
        let entries = self
            .inner
            .recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        crate::flush_tracing();
        entries
    }

    /// Every `sva()` slot recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn slot_recipes(&self) -> Vec<RecipeEntry> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "slot_recipes").entered();
        let entries = self
            .inner
            .slot_recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect();
        crate::flush_tracing();
        entries
    }

    /// Encoded config recipe styles, separate from atomic utility atoms.
    #[napi(js_name = encodedRecipes)]
    #[must_use]
    pub fn encoded_recipes(&mut self, env: Env) -> napi::Result<serde_json::Value> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "encoded_recipes").entered();
        let encoded = serde_json::to_value(self.inner.encoded_recipes().snapshot())
            .unwrap_or(serde_json::Value::Null);
        if !self.callbacks.has_utility_transforms() {
            crate::flush_tracing();
            return Ok(encoded);
        }
        apply_utility_transforms_to_encoded_recipes(
            encoded,
            &self.callbacks.utility_transform_refs,
            &self.callbacks.utility_transforms,
            &mut self.callbacks.transform_cache,
            &env,
        )
        .inspect(|_| crate::flush_tracing())
    }

    #[napi]
    pub fn compile(&mut self, env: Env) -> napi::Result<CompileOutput> {
        crate::init_tracing();
        let _span = tracing::trace_span!("css_compile", method = "project_compile").entered();
        let atoms = if self.callbacks.has_utility_transforms() {
            self.atoms(env)?
                .into_iter()
                .filter_map(core_atom_from_js_atom)
                .collect::<Vec<_>>()
        } else {
            self.inner.atoms().iter().cloned().collect::<Vec<_>>()
        };
        let encoded_recipes = if self.callbacks.has_utility_transforms() {
            let encoded = self.encoded_recipes(env)?;
            encoded_recipes_from_json(encoded)?
        } else {
            self.inner.encoded_recipes().snapshot()
        };
        let config: UserConfig = serde_json::from_value(self.config.clone())
            .map_err(|err| napi::Error::from_reason(format!("invalid config: {err}")))?;
        let static_encoded_recipes = self.inner.static_encoded_recipes(&config);
        let options = pandacss_stylesheet::StylesheetOptions {
            minify: config
                .extra
                .get("minify")
                .and_then(serde_json::Value::as_bool)
                .unwrap_or(false),
            optimize: true,
            include_static: true,
            source_map: false,
        };
        let output = pandacss_stylesheet::compile(
            pandacss_stylesheet::StylesheetInput {
                config: &config,
                atoms: &atoms,
                encoded_recipes: &encoded_recipes,
                static_encoded_recipes: Some(&static_encoded_recipes),
            },
            &options,
        );
        crate::flush_tracing();
        Ok(CompileOutput {
            css: output.css,
            source_map: output.source_map,
            manifest: CompileManifest {
                hashes: Vec::new(),
                tokens: Vec::new(),
            },
            diagnostics: output
                .diagnostics
                .into_iter()
                .map(|diagnostic| Diagnostic {
                    message: diagnostic.message,
                    severity: match diagnostic.severity {
                        pandacss_stylesheet::StylesheetDiagnosticSeverity::Warning => {
                            crate::DiagnosticSeverity::Warning
                        }
                        pandacss_stylesheet::StylesheetDiagnosticSeverity::Error => {
                            crate::DiagnosticSeverity::Error
                        }
                    },
                    span: None,
                    location: None,
                })
                .collect(),
        })
    }

    /// Aggregate counts.
    #[napi]
    #[must_use]
    pub fn summary(&self) -> ProjectSummary {
        let s = self.inner.summary();
        ProjectSummary {
            files_processed: u32::try_from(s.files_processed).unwrap_or(u32::MAX),
            atom_count: u32::try_from(s.atom_count).unwrap_or(u32::MAX),
            recipe_count: u32::try_from(s.recipe_count).unwrap_or(u32::MAX),
            slot_recipe_count: u32::try_from(s.slot_recipe_count).unwrap_or(u32::MAX),
        }
    }
}

fn core_atom_from_js_atom(atom: crate::Atom) -> Option<CoreAtom> {
    let value = atom_value_from_json(atom.value)?;
    let conditions: SmallVec<[Box<str>; 2]> = atom
        .conditions
        .into_iter()
        .map(String::into_boxed_str)
        .collect();
    Some(CoreAtom::new(
        atom.prop.into_boxed_str(),
        value,
        conditions,
        false,
    ))
}

fn atom_value_from_json(value: serde_json::Value) -> Option<AtomValue> {
    match value {
        serde_json::Value::String(value) => Some(AtomValue::String(value.into_boxed_str())),
        serde_json::Value::Number(value) => {
            Some(AtomValue::Number(value.to_string().into_boxed_str()))
        }
        serde_json::Value::Bool(value) => Some(AtomValue::Bool(value)),
        serde_json::Value::Null => Some(AtomValue::Null),
        serde_json::Value::Array(_) | serde_json::Value::Object(_) => None,
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct JsonEncodedRecipes {
    #[serde(default)]
    base: Vec<JsonRecipeStyleGroup>,
    #[serde(default)]
    variants: Vec<JsonRecipeStyleGroup>,
    #[serde(default)]
    atomic: Vec<JsonAtom>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct JsonRecipeStyleGroup {
    recipe: String,
    #[serde(default)]
    slot: serde_json::Value,
    class_name: String,
    #[serde(default)]
    entries: Vec<JsonRecipeStyleEntry>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct JsonRecipeStyleEntry {
    prop: String,
    value: serde_json::Value,
    #[serde(default)]
    conditions: Vec<String>,
    #[serde(default)]
    important: bool,
}

#[derive(Deserialize)]
struct JsonAtom {
    prop: String,
    value: serde_json::Value,
    #[serde(default)]
    conditions: Vec<String>,
}

fn encoded_recipes_from_json(value: serde_json::Value) -> napi::Result<EncodedRecipesSnapshot> {
    let decoded: JsonEncodedRecipes = serde_json::from_value(value)
        .map_err(|err| napi::Error::from_reason(format!("invalid encoded recipe CSS: {err}")))?;
    Ok(EncodedRecipesSnapshot {
        base: decoded
            .base
            .into_iter()
            .map(recipe_group_from_json)
            .collect::<napi::Result<_>>()?,
        variants: decoded
            .variants
            .into_iter()
            .map(recipe_group_from_json)
            .collect::<napi::Result<_>>()?,
        atomic: decoded
            .atomic
            .into_iter()
            .filter_map(|atom| {
                core_atom_from_js_atom(crate::Atom {
                    prop: atom.prop,
                    value: atom.value,
                    conditions: atom.conditions,
                })
            })
            .collect(),
    })
}

fn recipe_group_from_json(group: JsonRecipeStyleGroup) -> napi::Result<RecipeStyleGroupSnapshot> {
    Ok(RecipeStyleGroupSnapshot {
        recipe: group.recipe.into_boxed_str(),
        slot: group.slot,
        class_name: group.class_name.into_boxed_str(),
        entries: group
            .entries
            .into_iter()
            .map(recipe_entry_from_json)
            .collect::<napi::Result<_>>()?,
    })
}

fn recipe_entry_from_json(entry: JsonRecipeStyleEntry) -> napi::Result<RecipeStyleEntry> {
    let Some(value) = atom_value_from_json(entry.value) else {
        return Err(napi::Error::from_reason(format!(
            "invalid recipe CSS value for `{}`",
            entry.prop
        )));
    };
    Ok(RecipeStyleEntry {
        prop: entry.prop.into_boxed_str(),
        value,
        conditions: entry
            .conditions
            .into_iter()
            .map(String::into_boxed_str)
            .collect(),
        important: entry.important,
    })
}

fn apply_project_options(
    mut project: pandacss_project::Project,
    opts: ProjectOptions,
) -> pandacss_project::Project {
    if opts.cross_file.unwrap_or(true) {
        project = project.with_cross_file(pandacss_extractor::CrossFileResolver::new());
    }
    project
}

fn apply_utility_transforms(
    atoms: Vec<crate::Atom>,
    utility_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
    cache: &mut TransformCache,
    env: &Env,
) -> napi::Result<Vec<crate::Atom>> {
    if utility_transform_refs.is_empty() {
        return Ok(atoms);
    }

    let mut out = Vec::with_capacity(atoms.len());
    for atom in atoms {
        let Some(id) = utility_transform_refs.get(&atom.prop) else {
            out.push(atom);
            continue;
        };
        let Some(callback) = callbacks.get(id) else {
            return Err(napi::Error::from_reason(format!(
                "Missing utility transform callback `{id}` for `{}`",
                atom.prop
            )));
        };

        let cache_key = UtilityTransformCacheKey {
            id: id.clone(),
            prop: atom.prop.clone(),
            value: atom.value.to_string(),
        };
        if let Some(cached) = cache.utility.get(&cache_key) {
            out.extend(apply_conditions(cached, &atom.conditions));
            continue;
        }

        let transform = callback.borrow_back(env)?;
        let result = transform.call(FnArgs::from((
            atom.value.clone(),
            transform_args(&atom.value),
        )))?;
        let Some(style) = result.as_object() else {
            continue;
        };
        if style.is_empty() {
            continue;
        }
        let transformed = style_object_to_atoms(style, &[]);
        out.extend(apply_conditions(&transformed, &atom.conditions));
        cache.utility.insert(cache_key, transformed);
    }

    Ok(out)
}

fn apply_utility_transforms_to_encoded_recipes(
    mut encoded: serde_json::Value,
    utility_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
    cache: &mut TransformCache,
    env: &Env,
) -> napi::Result<serde_json::Value> {
    transform_recipe_groups(
        encoded.get_mut("base"),
        utility_transform_refs,
        callbacks,
        cache,
        env,
    )?;
    transform_recipe_groups(
        encoded.get_mut("variants"),
        utility_transform_refs,
        callbacks,
        cache,
        env,
    )?;
    if let Some(atomic) = encoded.get_mut("atomic") {
        let atoms = json_atoms_to_atoms(atomic);
        *atomic = atoms_to_json(apply_utility_transforms(
            atoms,
            utility_transform_refs,
            callbacks,
            cache,
            env,
        )?);
    }
    Ok(encoded)
}

fn transform_recipe_groups(
    groups: Option<&mut serde_json::Value>,
    utility_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
    cache: &mut TransformCache,
    env: &Env,
) -> napi::Result<()> {
    let Some(serde_json::Value::Array(groups)) = groups else {
        return Ok(());
    };
    for group in groups {
        let Some(entries) = group.get_mut("entries") else {
            continue;
        };
        let atoms = json_atoms_to_atoms(entries);
        *entries = atoms_to_json(apply_utility_transforms(
            atoms,
            utility_transform_refs,
            callbacks,
            cache,
            env,
        )?);
    }
    Ok(())
}

fn json_atoms_to_atoms(value: &serde_json::Value) -> Vec<crate::Atom> {
    let serde_json::Value::Array(items) = value else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let serde_json::Value::Object(entry) = item else {
                return None;
            };
            let prop = entry.get("prop")?.as_str()?.to_owned();
            let value = entry
                .get("value")
                .cloned()
                .unwrap_or(serde_json::Value::Null);
            let conditions = entry
                .get("conditions")
                .and_then(serde_json::Value::as_array)
                .map(|items| {
                    items
                        .iter()
                        .filter_map(serde_json::Value::as_str)
                        .map(str::to_owned)
                        .collect()
                })
                .unwrap_or_default();
            Some(crate::Atom {
                prop,
                value,
                conditions,
            })
        })
        .collect()
}

fn atoms_to_json(atoms: Vec<crate::Atom>) -> serde_json::Value {
    serde_json::Value::Array(
        atoms
            .into_iter()
            .map(|atom| {
                let mut entry = serde_json::Map::new();
                entry.insert("prop".to_owned(), serde_json::Value::String(atom.prop));
                entry.insert("value".to_owned(), atom.value);
                entry.insert(
                    "conditions".to_owned(),
                    serde_json::Value::Array(
                        atom.conditions
                            .into_iter()
                            .map(serde_json::Value::String)
                            .collect(),
                    ),
                );
                serde_json::Value::Object(entry)
            })
            .collect(),
    )
}

fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
    cache: &mut TransformCache,
    env: &Env,
) -> Result<Option<Literal>, pandacss_extractor::Diagnostic> {
    let Some(id) = pattern_transform_refs.get(name) else {
        return Ok(None);
    };
    let Some(callback) = callbacks.get(id) else {
        return Err(callback_diagnostic(format!(
            "Missing pattern transform callback `{id}` for `{name}`"
        )));
    };

    let props = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let props_key = serde_json::to_string(&props).map_err(|err| {
        callback_diagnostic(format!("Failed to cache pattern props for `{name}`: {err}"))
    })?;
    let cache_key = PatternTransformCacheKey {
        id: id.clone(),
        name: name.to_owned(),
        props: props_key,
    };
    if let Some(cached) = cache.pattern.get(&cache_key) {
        return Ok(cached.clone());
    }

    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow pattern transform callback `{id}` for `{name}`: {err}"
        ))
    })?;
    let result = transform
        .call(FnArgs::from((props, pattern_transform_args())))
        .map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` threw: {err}"
            ))
        })?;
    let transformed = if result.is_null() {
        None
    } else {
        json_value_to_literal(&result).map(Some).ok_or_else(|| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` returned an invalid style object"
            ))
        })?
    };
    cache.pattern.insert(cache_key, transformed.clone());
    Ok(transformed)
}

fn get_utility_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (prop, utility) in &config.utilities {
        if let Some(id) = utility_callback_id(utility) {
            refs.insert(prop.clone(), id.to_owned());
        }
    }

    refs
}

fn get_pattern_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (name, pattern) in &config.patterns {
        let Some(id) = pattern_callback_id(pattern).map(str::to_owned) else {
            continue;
        };
        refs.insert(name.clone(), id.clone());
        refs.insert(capitalize(name), id.clone());
        if let Some(jsx_name) = pattern.jsx_name.as_deref() {
            refs.insert(jsx_name.to_owned(), id.clone());
        }
        for item in &pattern.jsx {
            if let JsxSpecifier::String(jsx_name) = item {
                refs.insert(jsx_name.to_owned(), id.clone());
            }
        }
    }
    refs
}

fn utility_callback_id(utility: &UtilityConfig) -> Option<&str> {
    callback_ref_id(utility.transform.as_ref()?)
}

fn pattern_callback_id(pattern: &PatternConfig) -> Option<&str> {
    callback_ref_id(pattern.transform.as_ref()?)
}

fn callback_ref_id(value: &CallbackRef) -> Option<&str> {
    (value.kind == "js-callback")
        .then(|| value.id.as_deref())
        .flatten()
}

fn transform_args(value: &serde_json::Value) -> serde_json::Value {
    serde_json::json!({
        "raw": value,
        "token": null,
        "utils": {
            "colorMix": null
        }
    })
}

fn pattern_transform_args() -> serde_json::Value {
    serde_json::json!({
        "map": null,
        "isCssUnit": null,
        "isCssVar": null
    })
}

fn apply_conditions(atoms: &[crate::Atom], conditions: &[String]) -> Vec<crate::Atom> {
    if conditions.is_empty() {
        return atoms.to_vec();
    }
    atoms
        .iter()
        .map(|atom| {
            let mut atom = atom.clone();
            atom.conditions = conditions.to_vec();
            atom
        })
        .collect()
}

fn style_object_to_atoms(
    style: &serde_json::Map<String, serde_json::Value>,
    base_conditions: &[String],
) -> Vec<crate::Atom> {
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
    atoms: &mut Vec<crate::Atom>,
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

    atoms.push(crate::Atom {
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
