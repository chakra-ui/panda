//! NAPI `Project` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration. Holds a per-file atom registry, drops a
//! file's contribution on `removeFile` / `refreshFile`, runs the encoder over
//! every extracted style so callers see `Atom[]` directly (not raw
//! `ExtractedCall` records — for that, use `Extractor`).

use napi_derive::napi;
use std::collections::HashMap;

use crate::convert::{convert_diagnostic, to_atoms, to_core_matchers};
use crate::{Diagnostic, Matchers, TokenDictionary};
use napi::bindgen_prelude::{Env, FnArgs, FunctionRef};
use pandacss_extractor::{DiagnosticSeverity, Literal};

/// Per-call telemetry from `parseFile`. Mirrors `pandacss_project::FileReport`.
#[napi(object)]
pub struct FileReport {
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
    pub token_dictionary: Option<TokenDictionary>,
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
    utility_transform_cache: HashMap<UtilityTransformCacheKey, Vec<crate::Atom>>,
}

#[napi]
impl Project {
    /// Construct a project bound to a matchers config. Cross-file folding
    /// is enabled by default.
    #[napi(constructor)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned constructor arguments"
    )]
    pub fn new(matchers: Matchers, options: Option<ProjectOptions>) -> Self {
        let opts = options.unwrap_or(ProjectOptions {
            token_dictionary: None,
            cross_file: None,
        });
        let project = pandacss_project::Project::from_matchers(to_core_matchers(matchers));
        Self {
            inner: apply_project_options(project, opts),
            utility_transform_refs: HashMap::new(),
            pattern_transform_refs: HashMap::new(),
            utility_transforms: HashMap::new(),
            pattern_transforms: HashMap::new(),
            utility_transform_cache: HashMap::new(),
        }
    }

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
        let opts = options.unwrap_or(ProjectOptions {
            token_dictionary: None,
            cross_file: None,
        });
        let utility_transform_refs = get_utility_transform_refs(&config);
        let pattern_transform_refs = get_pattern_transform_refs(&config);
        let config = serde_json::from_value(config)
            .map_err(|err| napi::Error::from_reason(format!("invalid config: {err}")))?;
        let project = pandacss_project::Project::from_serialized_config(config);
        Ok(Self {
            inner: apply_project_options(project, opts),
            utility_transform_refs,
            pattern_transform_refs,
            utility_transforms: HashMap::new(),
            pattern_transforms: HashMap::new(),
            utility_transform_cache: HashMap::new(),
        })
    }

    /// Return the serialized config snapshot this project was constructed
    /// with, or `null` for legacy matcher-based construction.
    #[napi]
    #[must_use]
    pub fn config(&self) -> serde_json::Value {
        self.inner
            .serialized_config()
            .and_then(|config| serde_json::to_value(config).ok())
            .unwrap_or(serde_json::Value::Null)
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
        self.utility_transforms.insert(id, callback);
        self.utility_transform_cache.clear();
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
        self.pattern_transforms.insert(id, callback);
    }

    /// Extract + encode a single file. Re-parsing a path replaces its prior
    /// contribution (atoms, recipes, diagnostics) — safe for watch mode.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file(&mut self, env: Env, path: String, source: String) -> FileReport {
        let report = if self.pattern_transforms.is_empty() {
            self.inner.parse_file(&path, &source)
        } else {
            let pattern_transform_refs = &self.pattern_transform_refs;
            let pattern_transforms = &self.pattern_transforms;
            let mut transform = |name: &str, styles: &Literal| {
                apply_pattern_transform(
                    name,
                    styles,
                    pattern_transform_refs,
                    pattern_transforms,
                    &env,
                )
            };
            self.inner
                .parse_file_with_pattern_transforms(&path, &source, &mut transform)
        };
        FileReport {
            css_calls: u32::try_from(report.css_calls).unwrap_or(u32::MAX),
            cva_calls: u32::try_from(report.cva_calls).unwrap_or(u32::MAX),
            sva_calls: u32::try_from(report.sva_calls).unwrap_or(u32::MAX),
            jsx_usages: u32::try_from(report.jsx_usages).unwrap_or(u32::MAX),
            diagnostics: report
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

    /// Drop every path's state. Keeps the matchers / token dictionary /
    /// cross-file resolver intact.
    #[napi]
    pub fn clear(&mut self) {
        self.inner.clear();
        self.utility_transform_cache.clear();
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
        let atoms = to_atoms(self.inner.atoms());
        if self.utility_transforms.is_empty() {
            return Ok(atoms);
        }
        apply_utility_transforms(
            atoms,
            &self.utility_transform_refs,
            &self.utility_transforms,
            &mut self.utility_transform_cache,
            &env,
        )
    }

    /// Every `cva()` recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn recipes(&self) -> Vec<RecipeEntry> {
        self.inner
            .recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect()
    }

    /// Every `sva()` slot recipe entry, in `(file, span_start)` order.
    #[napi]
    #[must_use]
    pub fn slot_recipes(&self) -> Vec<RecipeEntry> {
        self.inner
            .slot_recipes()
            .map(|(file, span_start, recipe)| RecipeEntry {
                file: file.to_owned(),
                span_start,
                recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
            })
            .collect()
    }

    /// Encoded config recipe styles, separate from atomic utility atoms.
    #[napi(js_name = encodedRecipes)]
    #[must_use]
    pub fn encoded_recipes(&self) -> serde_json::Value {
        serde_json::to_value(self.inner.encoded_recipes().snapshot())
            .unwrap_or(serde_json::Value::Null)
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
    cache: &mut HashMap<UtilityTransformCacheKey, Vec<crate::Atom>>,
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
        if let Some(cached) = cache.get(&cache_key) {
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
        cache.insert(cache_key, transformed);
    }

    Ok(out)
}

fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<
        String,
        FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>,
    >,
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

    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow pattern transform callback `{id}` for `{name}`: {err}"
        ))
    })?;
    let props = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;
    let result = transform
        .call(FnArgs::from((props, pattern_transform_args())))
        .map_err(|err| {
            callback_diagnostic(format!(
                "Pattern transform callback `{id}` for `{name}` threw: {err}"
            ))
        })?;
    if result.is_null() {
        return Ok(None);
    }
    json_value_to_literal(&result).map(Some).ok_or_else(|| {
        callback_diagnostic(format!(
            "Pattern transform callback `{id}` for `{name}` returned an invalid style object"
        ))
    })
}

fn get_utility_transform_refs(config: &serde_json::Value) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    let Some(utilities) = config
        .get("utilities")
        .and_then(serde_json::Value::as_object)
    else {
        return refs;
    };

    for (prop, utility) in utilities {
        let Some(transform) = utility
            .get("transform")
            .and_then(serde_json::Value::as_object)
        else {
            continue;
        };
        let is_callback = transform
            .get("kind")
            .and_then(serde_json::Value::as_str)
            .is_some_and(|kind| kind == "js-callback");
        let Some(id) = transform.get("id").and_then(serde_json::Value::as_str) else {
            continue;
        };
        if is_callback {
            refs.insert(prop.clone(), id.to_owned());
        }
    }

    refs
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

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct UtilityTransformCacheKey {
    id: String,
    prop: String,
    value: String,
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
