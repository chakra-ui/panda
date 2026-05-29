//! NAPI `Project` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration. Holds a per-file atom registry, drops a
//! file's contribution on `removeFile` / `refreshFile`, runs the encoder over
//! every extracted style so callers see `Atom[]` directly (not raw
//! `ExtractedCall` records — for that, use `Extractor`).

use napi_derive::napi;
use std::collections::HashMap;
use std::sync::Arc;

use crate::Diagnostic;
use crate::cache::{PatternTransformCacheKey, TransformCache, UtilityTransformCacheKey};
use crate::convert::{convert_diagnostic, to_atoms, to_call, to_jsx};
use crate::extract::ExtractResult;
use napi::bindgen_prelude::{Env, FnArgs, FunctionRef};
use pandacss_config::{
    CallbackRef, JsxSpecifier, PatternConfig, UserConfig, UtilityConfig, UtilityValues,
    ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_encoder::{Atom as CoreAtom, AtomValue};
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use smallvec::SmallVec;

use crate::compile::{CompileFileManifest, CompileOutput};
use crate::matcher::{TokenDictionary, from_core_token_dictionary};

/// JS `utility.values` callbacks keyed by callback id, passed from the TS layer.
type UtilityValueCallbacks =
    HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>;

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

#[napi(object)]
pub struct ParsedFileView {
    pub path: String,
    pub atoms: Vec<crate::Atom>,
    pub diagnostics: Vec<Diagnostic>,
    pub recipes: Vec<RecipeEntry>,
    pub slot_recipes: Vec<RecipeEntry>,
}

#[napi(object)]
pub struct StaticPatternResult {
    pub atoms: Vec<crate::Atom>,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi]
pub struct Compiler {
    inner: pandacss_project::Project,
    config: serde_json::Value,
    user_config: UserConfig,
    callbacks: CallbackHost,
}

struct CallbackHost {
    utility_transform_refs: HashMap<String, String>,
    pattern_transform_refs: HashMap<String, String>,
    utility_transforms:
        HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    pattern_transforms:
        HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
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
impl Compiler {
    /// Construct a compiler from the resolved, JSON-safe Panda config snapshot.
    #[napi(factory)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned constructor arguments"
    )]
    pub fn from_config(
        env: Env,
        config: serde_json::Value,
        options: Option<ProjectOptions>,
        utility_values_callbacks: Option<UtilityValueCallbacks>,
    ) -> napi::Result<Self> {
        crate::init_tracing();
        let opts = options.unwrap_or(ProjectOptions { cross_file: None });
        let config_snapshot = config.clone();
        let raw_diagnostics = validate_config_value(&config_snapshot);
        if validation_mode_from_value(&config_snapshot) == ValidationMode::Error
            && !raw_diagnostics.is_empty()
        {
            return Err(napi::Error::from_reason(format_config_diagnostics(
                &raw_diagnostics,
            )));
        }
        let mut config: UserConfig = serde_json::from_value(config).map_err(|err| {
            let reason = if raw_diagnostics.is_empty() {
                format!("invalid config: {err}")
            } else {
                format!(
                    "invalid config: {err}\n{}",
                    format_config_diagnostics(&raw_diagnostics)
                )
            };
            napi::Error::from_reason(reason)
        })?;
        let token_dictionary = pandacss_tokens::TokenDictionary::from_config(&config)
            .map_err(|err| napi::Error::from_reason(format!("invalid token config: {err}")))?
            .map(Arc::new);
        resolve_utility_values_callbacks(
            &mut config,
            token_dictionary.as_deref(),
            utility_values_callbacks.as_ref(),
            &env,
        )?;
        let callbacks = CallbackHost::from_config(&config);
        let user_config = config.clone();
        let config_snapshot =
            serde_json::to_value(&config).unwrap_or_else(|_| config_snapshot.clone());
        let system = pandacss_project::System::new(pandacss_project::SystemInput {
            config,
            diagnostics: Some(raw_diagnostics),
            token_dictionary,
        })
        .map_err(|err| napi::Error::from_reason(format!("invalid config: {err}")))?;
        let project = pandacss_project::Project::new(system);
        Ok(Self {
            inner: apply_project_options(project, &opts),
            config: config_snapshot,
            user_config,
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

    /// Rust-built token dictionary projected into the small JS interop shape.
    #[napi(js_name = token_dictionary)]
    #[must_use]
    pub fn token_dictionary(&self) -> Option<TokenDictionary> {
        self.inner
            .config()
            .token_dictionary()
            .as_deref()
            .map(from_core_token_dictionary)
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
        callback: FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>,
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
        callback: FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>,
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
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let report = if !has_pattern_transforms && !has_utility_transforms {
            self.inner.parse_file(&path, &source)
        } else {
            let Compiler {
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
                    &env,
                )
            };
            let mut utility_transform = |prop: &str, value: &AtomValue| {
                apply_utility_transform(
                    prop,
                    value,
                    &callbacks.utility_transform_refs,
                    &callbacks.utility_transforms,
                    utility_cache,
                    &env,
                )
            };
            inner.parse_file_with(
                &path,
                &source,
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
    pub fn extract(&self, path: String, source: String) -> ExtractResult {
        crate::init_tracing();
        let result = self.inner.extract(&path, &source);
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
    pub fn refresh_file(&mut self, env: Env, path: String, source: String) -> bool {
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_pattern_transforms && !has_utility_transforms {
            return self.inner.refresh_file(&path, &source);
        }

        let Compiler {
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
                &env,
            )
        };
        let mut utility_transform = |prop: &str, value: &AtomValue| {
            apply_utility_transform(
                prop,
                value,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        inner.refresh_file_with(
            &path,
            &source,
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
    pub fn atoms(&mut self, env: Env) -> napi::Result<Vec<crate::Atom>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "atoms").entered();
        let _ = env;
        let atoms = to_atoms(self.inner.atoms());
        crate::flush_tracing();
        Ok(atoms)
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
    pub fn encoded_recipes(&mut self, env: Env) -> napi::Result<serde_json::Value> {
        crate::init_tracing();
        let _span = tracing::trace_span!("boundary_encode", method = "encoded_recipes").entered();
        let _ = env;
        let encoded = serde_json::to_value(self.inner.encoded_recipes().snapshot())
            .unwrap_or(serde_json::Value::Null);
        crate::flush_tracing();
        Ok(encoded)
    }

    #[napi]
    pub fn compile(&mut self, env: Env) -> napi::Result<CompileOutput> {
        crate::init_tracing();
        let _span = tracing::trace_span!("css_compile", method = "project_compile").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms(env);
        let Compiler {
            inner, user_config, ..
        } = self;
        let output = crate::compile::build_compile_output(
            inner,
            user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
        );
        crate::flush_tracing();
        Ok(output)
    }

    /// Config validation diagnostics from construction. Per-file and
    /// compile diagnostics live on [`ParseFileReport`] / [`CompileOutput`].
    #[napi]
    #[must_use]
    pub fn diagnostics(&self) -> Vec<Diagnostic> {
        self.inner
            .diagnostics()
            .iter()
            .cloned()
            .map(crate::convert::convert_diagnostic)
            .collect()
    }

    /// `(path, hex source_hash)` for every known file, sorted by path.
    /// The hash matches the one the re-parse short-circuit uses.
    #[napi(js_name = fileManifest)]
    #[must_use]
    pub fn file_manifest(&self) -> Vec<CompileFileManifest> {
        self.inner
            .file_manifest()
            .into_iter()
            .map(|(path, hash)| CompileFileManifest {
                path: path.as_ref().to_owned(),
                hash: format!("{hash:016x}"),
            })
            .collect()
    }

    /// Per-file view; returns `null` when `path` isn't known.
    #[napi(js_name = getFile)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn get_file(&self, path: String) -> Option<ParsedFileView> {
        let file = self.inner.get_file(&path)?;
        Some(ParsedFileView {
            path: file.path().to_owned(),
            atoms: crate::convert::to_atoms(file.atoms()),
            diagnostics: file
                .diagnostics()
                .iter()
                .cloned()
                .map(crate::convert::convert_diagnostic)
                .collect(),
            recipes: file
                .recipes()
                .map(|(span_start, recipe)| RecipeEntry {
                    file: file.path().to_owned(),
                    span_start,
                    recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
                })
                .collect(),
            slot_recipes: file
                .slot_recipes()
                .map(|(span_start, recipe)| RecipeEntry {
                    file: file.path().to_owned(),
                    span_start,
                    recipe: serde_json::to_value(recipe).unwrap_or(serde_json::Value::Null),
                })
                .collect(),
        })
    }

    /// `staticCss.patterns` expansion as raw atoms, without compiling.
    /// Routes through the same callback host as `parseFile`.
    #[napi(js_name = staticPatternAtoms)]
    pub fn static_pattern_atoms(&mut self, env: Env) -> napi::Result<StaticPatternResult> {
        crate::init_tracing();
        let (atoms, diagnostics) = self.collect_static_pattern_atoms(env);
        crate::flush_tracing();
        Ok(StaticPatternResult {
            atoms: crate::convert::slice_to_atoms(&atoms),
            diagnostics: diagnostics
                .into_iter()
                .map(crate::convert::convert_diagnostic)
                .collect(),
        })
    }

    fn collect_static_pattern_atoms(
        &mut self,
        env: Env,
    ) -> (
        Vec<pandacss_encoder::Atom>,
        Vec<pandacss_extractor::Diagnostic>,
    ) {
        let Compiler {
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
                    &env,
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

fn atom_value_to_json(value: &AtomValue) -> serde_json::Value {
    match value {
        AtomValue::String(value) => serde_json::Value::String(value.to_string()),
        AtomValue::Number(value) => parse_number_string(value),
        AtomValue::Bool(value) => serde_json::Value::Bool(*value),
        AtomValue::Null => serde_json::Value::Null,
    }
}

fn parse_number_string(value: &str) -> serde_json::Value {
    if let Ok(value) = value.parse::<i64>() {
        return serde_json::Value::from(value);
    }
    if let Ok(value) = value.parse::<f64>()
        && let Some(value) = serde_json::Number::from_f64(value)
    {
        return serde_json::Value::Number(value);
    }
    serde_json::Value::String(value.to_owned())
}

fn apply_project_options(
    mut project: pandacss_project::Project,
    opts: &ProjectOptions,
) -> pandacss_project::Project {
    if opts.cross_file.unwrap_or(true) {
        project = project.with_cross_file(pandacss_extractor::CrossFileResolver::new());
    }
    project
}

fn resolve_utility_values_callbacks(
    config: &mut UserConfig,
    token_dictionary: Option<&pandacss_tokens::TokenDictionary>,
    callbacks: Option<&UtilityValueCallbacks>,
    env: &Env,
) -> napi::Result<()> {
    let Some(callbacks) = callbacks else {
        return Ok(());
    };
    if callbacks.is_empty() {
        return Ok(());
    }

    let token_dictionary = token_dictionary.map(from_core_token_dictionary);
    for (prop, utility) in &mut config.utilities {
        let Some(id) = utility_values_callback_id(utility).map(str::to_owned) else {
            continue;
        };
        let Some(callback) = callbacks.get(&id) else {
            continue;
        };
        let token_dictionary_json =
            serde_json::to_value(&token_dictionary).unwrap_or(serde_json::Value::Null);
        let result = callback
            .borrow_back(env)
            .map_err(|err| {
                napi::Error::from_reason(format!(
                    "Failed to borrow utility values callback `{id}` for `{prop}`: {err}"
                ))
            })?
            .call(FnArgs::from((token_dictionary_json,)))
            .map_err(|err| {
                napi::Error::from_reason(format!(
                    "Utility values callback `{id}` for `{prop}` threw: {}",
                    err.reason
                ))
            })?;
        utility.values = Some(serde_json::from_value(result).map_err(|err| {
            napi::Error::from_reason(format!(
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
    callbacks: &HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    cache: &mut HashMap<UtilityTransformCacheKey, Vec<crate::Atom>>,
    env: &Env,
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
                .cloned()
                .filter_map(core_atom_from_js_atom)
                .collect(),
        ));
    }

    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow utility transform callback `{id}` for `{prop}`: {err}"
        ))
    })?;
    let result = transform.call(FnArgs::from((value,))).map_err(|err| {
        callback_diagnostic(format!(
            "Utility transform callback `{id}` for `{prop}` threw: {}",
            err.reason
        ))
    })?;
    let Some(style) = result.as_object() else {
        return Ok(Some(Vec::new()));
    };
    if style.is_empty() {
        cache.insert(cache_key, Vec::new());
        return Ok(Some(Vec::new()));
    }
    let transformed = style_object_to_atoms(style, &[]);
    let core = transformed
        .iter()
        .cloned()
        .filter_map(core_atom_from_js_atom)
        .collect();
    cache.insert(cache_key, transformed);
    Ok(Some(core))
}

fn apply_pattern_transform(
    name: &str,
    styles: &Literal,
    pattern_transform_refs: &HashMap<String, String>,
    callbacks: &HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    cache: &mut HashMap<PatternTransformCacheKey, Option<Literal>>,
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
    if let Some(cached) = cache.get(&cache_key) {
        return Ok(cached.clone());
    }

    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow pattern transform callback `{id}` for `{name}`: {err}"
        ))
    })?;
    let result = transform.call(FnArgs::from((props,))).map_err(|err| {
        callback_diagnostic(format!(
            "Pattern transform callback `{id}` for `{name}` threw: {}",
            err.reason
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
    cache.insert(cache_key, transformed.clone());
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
        .then_some(value.id.as_deref())
        .flatten()
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
        code: diagnostic_codes::TRANSFORM_CALLBACK_FAILED.to_owned(),
        message,
        severity: DiagnosticSeverity::Warning,
        span: None,
        location: None,
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

fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_uppercase().chain(chars).collect()
}
