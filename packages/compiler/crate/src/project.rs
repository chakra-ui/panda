//! NAPI `Project` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration. Holds a per-file atom registry, drops a
//! file's contribution on `removeFile` / `refreshFile`, runs the encoder over
//! every extracted style so callers see `Atom[]` directly (not raw
//! `ExtractedCall` records — for that, use `Extractor`).

mod build_info;
mod codegen;
mod config;
mod css;
mod files;
mod introspect;
mod recipes;
mod support;
mod transforms;

use napi_derive::napi;
use std::collections::HashMap;
use std::sync::Arc;

use crate::Diagnostic;
use crate::cache::TransformCache;
use napi::bindgen_prelude::{Env, FnArgs, FunctionRef};
use pandacss_config::{
    UserConfig, ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_fs::OsPathSystem;

use self::support::{
    apply_project_options, format_config_diagnostics, get_pattern_transform_refs,
    get_utility_transform_refs, resolve_utility_values_callbacks,
};

/// JS `utility.values` callbacks keyed by callback id, passed from the TS layer.
type UtilityValueCallbacks =
    HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>;

/// Per-call telemetry from `parseFile`. Mirrors `pandacss_project::ParseFileReport`.
#[napi(object)]
pub struct ParseFileReport {
    /// Source path parsed for this report.
    pub path: String,
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

/// Glob overrides for `scan`. Omitted fields fall back to the
/// config's `include`/`exclude`/`cwd`.
#[napi(object)]
pub struct ScanOptions {
    pub include: Option<Vec<String>>,
    pub exclude: Option<Vec<String>>,
    pub cwd: Option<String>,
}

/// A source glob with its static base directory (the dir a watcher subscribes to).
#[napi(object)]
pub struct SourceEntry {
    pub base: String,
    pub pattern: String,
}

/// The resolved cascade-layer names (config overrides + defaults applied).
#[napi(object)]
pub struct LayerNames {
    pub reset: String,
    pub base: String,
    pub tokens: String,
    pub recipes: String,
    pub utilities: String,
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

#[napi(object)]
pub struct ResolveUtilityValueInput {
    pub prop: String,
    pub value: serde_json::Value,
}

#[napi(object)]
pub struct ResolvedUtilityValue {
    pub utility: String,
    pub class_name: String,
    pub css_value: serde_json::Value,
    pub important: bool,
    pub source: serde_json::Value,
}

#[napi(object)]
pub struct GenerateArtifactOptions {
    pub force_import_extension: Option<bool>,
}

#[napi(object)]
pub struct WriteArtifactsOptions {
    pub outdir: String,
    pub cwd: Option<String>,
    pub force_import_extension: Option<bool>,
    pub artifacts: Option<Vec<CodegenArtifact>>,
}

#[napi(object)]
pub struct CodegenFile {
    pub path: String,
    pub code: String,
    pub dependencies: Vec<String>,
}

#[napi(object)]
pub struct CodegenArtifact {
    pub id: String,
    pub files: Vec<CodegenFile>,
}

#[napi(object)]
pub struct WriteCssResult {
    pub path: String,
    pub css: String,
    pub source_map: Option<String>,
    pub manifest: crate::compile::CompileManifest,
    pub layer_ranges: crate::compile::CompileLayerRanges,
    pub diagnostics: Vec<Diagnostic>,
}

#[napi(object)]
pub struct WriteFilesResult {
    pub root: String,
    pub paths: Vec<String>,
    pub files: Vec<crate::compile::SplitCssFile>,
}

#[napi(object)]
pub struct WriteCssOptions {
    pub outfile: String,
    pub cwd: Option<String>,
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
}

#[napi(object)]
pub struct WriteSplitCssOptions {
    pub outdir: String,
    pub cwd: Option<String>,
    pub layers: Option<Vec<String>>,
    pub emit_layer_declaration: Option<bool>,
    pub minify: Option<bool>,
}

#[napi]
pub struct Compiler {
    inner: pandacss_project::Project,
    config: serde_json::Value,
    user_config: UserConfig,
    callbacks: CallbackHost,
    /// Platform filesystem engine (real disk). Shared with the cross-file
    /// resolver and used by `glob`/`scan` to discover + read source files.
    fs: pandacss_fs::OsFileSystem,
    paths: OsPathSystem,
}

/// JS utility transform ref: `(resolvedValue, originalValue) -> styleObject`.
type UtilityTransformRef =
    FunctionRef<FnArgs<(serde_json::Value, serde_json::Value)>, serde_json::Value>;
type SourceTransformRef = FunctionRef<FnArgs<(String, String)>, Option<String>>;

struct SourceTransformCallback {
    filter: pandacss_project::HookFilter,
    callback: SourceTransformRef,
}

struct CallbackHost {
    utility_transform_refs: HashMap<String, String>,
    pattern_transform_refs: HashMap<String, String>,
    utility_transforms: HashMap<String, UtilityTransformRef>,
    pattern_transforms:
        HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    source_transforms: Vec<(String, SourceTransformCallback)>,
    transform_cache: TransformCache,
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
        let fs = pandacss_fs::OsFileSystem::default();
        Ok(Self {
            inner: apply_project_options(project, &opts, &fs),
            config: config_snapshot,
            user_config,
            callbacks,
            fs,
            paths: OsPathSystem,
        })
    }
}
