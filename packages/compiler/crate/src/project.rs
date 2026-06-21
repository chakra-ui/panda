//! NAPI `Project` — JS-facing wrapper around `pandacss_project::Project`.
//!
//! Stateful project orchestration. Holds a per-file atom registry, drops a
//! file's contribution on `removeFile` / `refreshFile`, runs the encoder over
//! every extracted style so callers see `Atom[]` directly (not raw
//! `ExtractedCall` records — for that, use `Extractor`).

use lru::LruCache;
use napi_derive::napi;
use std::collections::HashMap;
use std::sync::Arc;

use crate::Diagnostic;
use crate::cache::{
    MAX_TRANSFORM_CACHE_KEY_BYTES, PatternTransformCacheKey, TransformCache,
    UtilityTransformCacheKey,
};
use crate::convert::{convert_diagnostic, to_atoms, to_call, to_jsx};
use crate::extract::ExtractResult;
use napi::bindgen_prelude::{Env, FnArgs, FunctionRef};
use pandacss_codegen::{Artifact, ArtifactId, ConfigDependency, DependencySet, GenerateOptions};
use pandacss_config::{
    CallbackRef, JsxSpecifier, PatternConfig, UserConfig, UtilityConfig, UtilityValues,
    ValidationMode, validate_config_value, validation_mode_from_value,
};
use pandacss_encoder::AtomValue;
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};
use pandacss_fs::{FileSystem, OsPathSystem, OxcResolverFileSystem, PathSystem};

use crate::compile::{CompileFileManifest, CompileOptions, CompileOutput};
use crate::matcher::{TokenDictionary, from_core_token_dictionary};

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
}

#[napi(object)]
pub struct WriteSplitCssOptions {
    pub outdir: String,
    pub cwd: Option<String>,
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

    /// Return the serialized config snapshot this project was constructed
    /// with.
    #[napi]
    #[must_use]
    pub fn config(&self) -> serde_json::Value {
        self.config.clone()
    }

    /// The resolved cascade-layer names (config overrides merged over defaults).
    /// The host needs these to recognize the user's `@layer …;` directive
    /// without re-deriving the Rust defaults.
    #[napi]
    #[must_use]
    pub fn layers(&self) -> LayerNames {
        let layers = &self.user_config.layers;
        LayerNames {
            reset: layers.reset.clone(),
            base: layers.base.clone(),
            tokens: layers.tokens.clone(),
            recipes: layers.recipes.clone(),
            utilities: layers.utilities.clone(),
        }
    }

    /// Whether `css` declares Panda's cascade layers (`@layer reset, base, …;`),
    /// marking it as the stylesheet root to inject the compiled CSS into.
    #[napi(js_name = hasLayerDeclaration)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn has_layer_declaration(&self, css: String) -> bool {
        let names = self.user_config.layers.ordered().map(|(_, name)| name);
        pandacss_stylesheet::has_layer_declaration(&css, &names)
    }

    /// Tooling introspection snapshot (read once, index on the host).
    ///
    /// # Errors
    /// Returns an error if the snapshot fails to serialize.
    #[napi]
    pub fn spec(&self) -> napi::Result<serde_json::Value> {
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
        serde_json::to_value(&spec).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Low-level build-info primitive — serialize the project's encoded atoms
    /// (string-interned, per-module provenance). The public surface is the
    /// `buildInfo.create` namespace in JS; `configFingerprint` is engine-owned.
    ///
    /// # Errors
    /// Returns an error if the build info fails to serialize.
    #[napi(js_name = serializeBuildInfo)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn serialize_build_info(&self, panda: String) -> napi::Result<serde_json::Value> {
        let info = self.inner.build_info(panda);
        serde_json::to_value(&info).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Engine-owned fingerprint of the resolved config's output-affecting fields.
    /// Stamped into build info as `configFingerprint`; also exposed so a consumer
    /// host can compare its own config against a library's artifact.
    #[napi(js_name = configFingerprint)]
    #[must_use]
    pub fn config_fingerprint(&self) -> String {
        self.inner.config_fingerprint().to_string()
    }

    /// Low-level build-info primitive — hydrate a deserialized build info into
    /// this project (additive), optionally restricted to imported modules
    /// (tree-shaking). Returns `false` on schema-version mismatch. The public
    /// surface (with validation) is the `buildInfo.hydrate` namespace in JS.
    ///
    /// # Errors
    /// Returns an error if `buildInfo` isn't a valid build-info document.
    #[napi(js_name = applyBuildInfo)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn apply_build_info(
        &mut self,
        name: String,
        build_info: serde_json::Value,
        only_modules: Option<Vec<String>>,
    ) -> napi::Result<bool> {
        let info: pandacss_project::BuildInfo = serde_json::from_value(build_info)
            .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        Ok(self.inner.hydrate(&name, &info, only_modules.as_deref()))
    }

    /// The build-info wire-format version this binding reads/writes. The JS
    /// `buildInfo.validate` compares an artifact's `schemaVersion` against it.
    #[napi(js_name = buildInfoSchemaVersion)]
    #[must_use]
    pub fn build_info_schema_version(&self) -> u32 {
        pandacss_project::SCHEMA_VERSION
    }

    /// Stateless source inspection for tooling (reporting, lint, IDE). Returns
    /// classified Panda usage sites plus file-local extraction diagnostics.
    ///
    /// # Errors
    /// Returns an error if the result fails to serialize.
    #[napi(js_name = inspectFileSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn inspect_file_source(
        &self,
        path: String,
        source: String,
    ) -> napi::Result<serde_json::Value> {
        let result = self.inner.inspect_file_source(&path, &source);
        serde_json::to_value(&result).map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Resolve selector and CSS metadata for one utility value.
    ///
    /// # Errors
    /// Returns an error if the value cannot be represented by the extractor
    /// literal model.
    #[napi(js_name = resolveUtilityValue)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn resolve_utility_value(
        &self,
        input: ResolveUtilityValueInput,
    ) -> napi::Result<Option<ResolvedUtilityValue>> {
        let Some(value) = json_value_to_literal(&input.value) else {
            return Err(napi::Error::from_reason(
                "resolveUtilityValue() requires a JSON-serializable value",
            ));
        };

        let Some(resolved) = self.inner.resolve_utility_value(&input.prop, &value) else {
            return Ok(None);
        };

        Ok(Some(ResolvedUtilityValue {
            utility: resolved.utility,
            class_name: resolved.class_name,
            css_value: resolved.css_value.to_json(),
            important: resolved.important,
            source: utility_value_source_to_json(resolved.source),
        }))
    }

    /// Tokens that carry a hardcoded value, ranked (safe equivalents first).
    /// Empty when nothing matches. The rule lists these for the developer.
    #[napi(js_name = suggestTokens)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn suggest_tokens(&self, prop: String, value: String) -> serde_json::Value {
        let suggestions: Vec<serde_json::Value> = self
            .inner
            .suggest_tokens(&prop, &value)
            .into_iter()
            .map(|suggestion| {
                serde_json::json!({
                    "token": suggestion.token,
                    "semantic": suggestion.semantic,
                    "conditional": suggestion.conditional,
                })
            })
            .collect();
        serde_json::Value::Array(suggestions)
    }

    /// Source globs + their static base dirs (for the host watcher).
    #[napi]
    #[must_use]
    pub fn sources(&self) -> Vec<SourceEntry> {
        self.user_config
            .include
            .iter()
            .map(|pattern| SourceEntry {
                base: resolve_base(&self.user_config.cwd, pattern),
                pattern: pattern.clone(),
            })
            .collect()
    }

    /// Generate artifacts and write them under `outdir` via the platform fs
    /// (real disk on native). Returns the written paths.
    ///
    /// # Errors
    /// Returns an error if a file fails to write.
    #[napi(js_name = writeArtifacts)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_artifacts(&self, options: WriteArtifactsOptions) -> napi::Result<Vec<String>> {
        let artifacts = if let Some(artifacts) = options.artifacts {
            artifacts
        } else {
            let generate = generate_options(
                &self.user_config,
                Some(GenerateArtifactOptions {
                    force_import_extension: options.force_import_extension,
                }),
            );
            self.inner
                .generate_artifacts(&self.user_config, generate)
                .into_iter()
                .map(to_codegen_artifact)
                .collect()
        };
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let root = self.paths.resolve(&cwd, &options.outdir);
        self.write_artifacts_to_root(&root, &artifacts)
    }

    #[napi(js_name = resolvePath)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn resolve_path(&self, path: String, cwd: Option<String>) -> String {
        self.paths
            .resolve(&cwd.unwrap_or_else(|| self.user_config.cwd.clone()), &path)
    }

    #[napi(js_name = joinPath)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn join_path(&self, parts: Vec<String>) -> String {
        let parts = parts.iter().map(String::as_str).collect::<Vec<_>>();
        self.paths.join(&parts)
    }

    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn dirname(&self, path: String) -> String {
        self.paths.dirname(&path)
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
    pub fn register_utility_transform(&mut self, id: String, callback: UtilityTransformRef) {
        self.callbacks.utility_transforms.insert(id, callback);
        self.callbacks.transform_cache.clear_utility();
        self.inner.bump_parse_epoch();
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
        self.inner.bump_parse_epoch();
    }

    /// Register a JS-backed `parser:before` source transform with a Rust-side
    /// filter. The filter is evaluated before calling into JS.
    #[napi(js_name = "registerSourceTransform")]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn register_source_transform(
        &mut self,
        id: String,
        filter: Option<serde_json::Value>,
        callback: SourceTransformRef,
    ) -> napi::Result<()> {
        let filter = filter
            .as_ref()
            .map(pandacss_project::HookFilter::from_json)
            .transpose()
            .map_err(|err| {
                napi::Error::from_reason(format!(
                    "Invalid parser:before filter for callback `{id}`: {err}"
                ))
            })?
            .unwrap_or_default();
        self.callbacks
            .source_transforms
            .push((id, SourceTransformCallback { filter, callback }));
        self.inner.bump_parse_epoch();
        Ok(())
    }

    /// Read a source file from the native filesystem and parse it.
    #[napi(js_name = parseFile)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file(&mut self, env: Env, path: String) -> napi::Result<ParseFileReport> {
        let source = self
            .fs
            .read_to_string(std::path::Path::new(&path))
            .map_err(|err| napi::Error::from_reason(format!("failed to read `{path}`: {err}")))?;
        Ok(self.parse_file_source(env, path, source))
    }

    /// Extract + encode provided source text. Re-parsing a path replaces its
    /// prior contribution (atoms, recipes, diagnostics) — safe for watch mode.
    #[napi(js_name = parseFileSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_file_source(&mut self, env: Env, path: String, source: String) -> ParseFileReport {
        crate::init_tracing();
        let report = self.parse_inner(&env, &path, &source);
        let _span = tracing::trace_span!("boundary_encode", method = "parse_file_report").entered();
        let report = convert_report(path, report);
        crate::flush_tracing();
        report
    }

    /// Shared parse path used by `parse_file` and `scan` — wires the
    /// registered pattern/utility transform callbacks (if any) and returns the
    /// core `ParseFileReport`.
    fn parse_inner(
        &mut self,
        env: &Env,
        path: &str,
        source: &str,
    ) -> pandacss_project::ParseFileReport {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
            return self.inner.parse_file(path, source);
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
                env,
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
                env,
            )
        };
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms, env)
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

    /// Source paths matching the config's `include`/`exclude` (overridable via
    /// `options`), via the platform filesystem engine. Useful for file
    /// discovery and the host's watch dependency list.
    ///
    /// # Errors
    /// Returns an error when the scan fails (e.g. a non-existent `cwd`).
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn scan(&self, options: Option<ScanOptions>) -> napi::Result<Vec<String>> {
        Ok(self
            .scan_paths(options.as_ref())?
            .into_iter()
            .map(|path| path.to_string_lossy().into_owned())
            .collect())
    }

    /// Resolve a path to its real on-disk location (absolute, symlinks followed) so
    /// two paths to the same file compare equal. Lenient: returns the input path when
    /// it can't be resolved (e.g. it was just deleted), so callers can still match it.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn realpath(&self, path: String) -> String {
        let path = std::path::PathBuf::from(path);
        self.fs
            .canonicalize(&path)
            .unwrap_or(path)
            .to_string_lossy()
            .into_owned()
    }

    /// Whether `path` is a source file the project extracts from — its
    /// `cwd`-relative form matches the configured `include`/`exclude` globs.
    /// For routing a watch event to `applyChange` vs ignoring it.
    #[napi(js_name = isSourceFile)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    #[must_use]
    pub fn is_source_file(&self, path: String) -> bool {
        let opts = glob_options(&self.user_config, None);
        pandacss_fs::matches_globs(std::path::Path::new(&path), &opts)
    }

    /// Read + parse source paths returned from `scan()`. Returns one report per
    /// successfully parsed path.
    ///
    /// # Errors
    /// Returns an error when a listed path fails to read.
    #[napi(js_name = parseFiles)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn parse_files(
        &mut self,
        env: Env,
        paths: Vec<String>,
    ) -> napi::Result<Vec<ParseFileReport>> {
        crate::init_tracing();
        let mut reports = Vec::with_capacity(paths.len());
        for path in paths {
            let path = std::path::PathBuf::from(path);
            let Ok(source) = self.fs.read_to_string(&path) else {
                continue;
            };
            let path = path.to_string_lossy();
            let report = self.parse_inner(&env, &path, &source);
            reports.push(convert_report(path.into_owned(), report));
        }
        crate::flush_tracing();
        Ok(reports)
    }

    fn scan_paths(&self, options: Option<&ScanOptions>) -> napi::Result<Vec<std::path::PathBuf>> {
        let opts = glob_options(&self.user_config, options);
        self.fs
            .glob(&opts)
            .map_err(|err| napi::Error::from_reason(format!("scan failed: {err}")))
    }

    fn write_relative_files<'a>(
        &self,
        root: &str,
        files: impl IntoIterator<Item = (&'a str, &'a str)>,
        label: &str,
    ) -> napi::Result<Vec<String>> {
        let mut written = Vec::new();
        for (path, code) in files {
            if self.paths.is_absolute(path) {
                return Err(napi::Error::from_reason(format!(
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
        artifacts: &[CodegenArtifact],
    ) -> napi::Result<Vec<String>> {
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

    fn write_target_file(&self, target: &str, code: &str) -> napi::Result<()> {
        let parent = self.paths.dirname(target);
        if !parent.is_empty() {
            self.fs
                .create_dir_all(std::path::Path::new(&parent))
                .map_err(|err| napi::Error::from_reason(err.to_string()))?;
        }
        self.fs
            .write_if_changed(std::path::Path::new(target), code.as_bytes())
            .map(|_| ())
            .map_err(|err| napi::Error::from_reason(err.to_string()))
    }

    /// Stateless single-file extraction — raw `calls` + `jsx` + diagnostics,
    /// using the project's configured matchers + token dictionary. Unlike
    /// `parseFile`, it registers nothing; it's the read-only peek companion.
    #[napi(js_name = extractFileSource)]
    #[must_use]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn extract_file_source(&self, path: String, source: String) -> ExtractResult {
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
    pub fn refresh_file(&mut self, env: Env, path: String) -> napi::Result<bool> {
        let source = self
            .fs
            .read_to_string(std::path::Path::new(&path))
            .map_err(|err| napi::Error::from_reason(format!("failed to read `{path}`: {err}")))?;
        Ok(self.refresh_file_source(env, path, source))
    }

    /// Re-parse provided source text only if the path is already known.
    #[napi(js_name = refreshFileSource)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn refresh_file_source(&mut self, env: Env, path: String, source: String) -> bool {
        let has_source_transforms = self.callbacks.has_source_transforms();
        let has_pattern_transforms = self.callbacks.has_pattern_transforms();
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        if !has_source_transforms && !has_pattern_transforms && !has_utility_transforms {
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
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let mut source_transform = |path: &str, source: &str| {
            apply_source_transforms(path, source, &callbacks.source_transforms, &env)
        };
        inner.refresh_file_with(
            &path,
            &source,
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
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn compile(
        &mut self,
        env: Env,
        options: Option<CompileOptions>,
    ) -> napi::Result<CompileOutput> {
        crate::init_tracing();
        let _span = tracing::trace_span!("css_compile", method = "project_compile").entered();
        let (static_pattern_atoms, static_pattern_diagnostics) =
            self.collect_static_pattern_atoms(env);
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let output = crate::compile::build_compile_output(
            inner,
            user_config,
            &static_pattern_atoms,
            static_pattern_diagnostics,
            options
                .as_ref()
                .is_none_or(CompileOptions::should_emit_layer_declaration),
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
        );
        crate::flush_tracing();
        Ok(output)
    }

    #[napi(js_name = writeCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_css(
        &mut self,
        env: Env,
        options: WriteCssOptions,
    ) -> napi::Result<WriteCssResult> {
        let output = self.compile(env, to_compile_options(options.emit_layer_declaration))?;
        let target = self.paths.resolve(
            &options.cwd.unwrap_or_else(|| self.user_config.cwd.clone()),
            &options.outfile,
        );
        self.write_target_file(&target, &output.css)?;
        Ok(WriteCssResult {
            path: target,
            css: output.css,
            source_map: output.source_map,
            manifest: output.manifest,
            layer_ranges: output.layer_ranges,
            diagnostics: output.diagnostics,
        })
    }

    #[napi(js_name = writeSplitCss)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn write_split_css(
        &mut self,
        env: Env,
        options: WriteSplitCssOptions,
    ) -> napi::Result<WriteFilesResult> {
        let files = self.split_css(env)?;
        let cwd = options.cwd.unwrap_or_else(|| self.user_config.cwd.clone());
        let root = self.paths.resolve(&cwd, &options.outdir);
        let paths = self.write_relative_files(
            &root,
            files
                .iter()
                .map(|file| (file.path.as_str(), file.code.as_str())),
            "split css",
        )?;
        Ok(WriteFilesResult { root, paths, files })
    }

    /// CSS for the named cascade layers, concatenated in order. Sliced in Rust
    /// (byte offsets stay valid); unknown layer names are skipped.
    #[napi]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn layer_css(&mut self, env: Env, layers: Vec<String>) -> napi::Result<String> {
        crate::init_tracing();
        let _span = tracing::trace_span!("layer_css").entered();
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms(env);
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let token_dictionary = inner.config().token_dictionary();
        let output = crate::compile::build_stylesheet_output(
            inner,
            user_config,
            token_dictionary,
            &static_pattern_atoms,
            true,
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
        );
        let selected: Vec<pandacss_stylesheet::StylesheetLayer> = layers
            .iter()
            .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
            .collect();
        crate::flush_tracing();
        Ok(output.get_layer_css(&selected))
    }

    /// Split the stylesheet into per-file outputs (one per layer + per recipe,
    /// plus `recipes.css` / `styles.css` index files) for `--splitting`.
    #[napi]
    pub fn split_css(&mut self, env: Env) -> napi::Result<Vec<crate::compile::SplitCssFile>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("split_css").entered();
        let (static_pattern_atoms, _diagnostics) = self.collect_static_pattern_atoms(env);
        let has_utility_transforms = self.callbacks.has_utility_transforms();
        let Compiler {
            inner,
            user_config,
            callbacks,
            ..
        } = self;
        let utility_cache = &mut callbacks.transform_cache.utility;
        let mut utility_transform = |prop: &str, resolved: &AtomValue, original: &AtomValue| {
            apply_utility_transform(
                prop,
                resolved,
                original,
                &callbacks.utility_transform_refs,
                &callbacks.utility_transforms,
                utility_cache,
                &env,
            )
        };
        let files = crate::compile::build_split_css(
            inner,
            user_config,
            &static_pattern_atoms,
            has_utility_transforms
                .then_some(&mut utility_transform as &mut pandacss_project::UtilityTransformFn<'_>),
        );
        crate::flush_tracing();
        Ok(files)
    }

    #[napi(js_name = generateArtifacts)]
    pub fn generate_artifacts(
        &self,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Vec<CodegenArtifact>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("codegen", method = "generate_artifacts").entered();
        let options = generate_options(&self.user_config, options);
        let artifacts = self
            .inner
            .generate_artifacts(&self.user_config, options)
            .into_iter()
            .map(to_codegen_artifact)
            .collect();
        crate::flush_tracing();
        Ok(artifacts)
    }

    #[napi(js_name = generateArtifact)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn generate_artifact(
        &self,
        id: String,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Option<CodegenArtifact>> {
        crate::init_tracing();
        let _span = tracing::trace_span!("codegen", method = "generate_artifact", id).entered();
        let id = id
            .parse::<ArtifactId>()
            .map_err(|()| napi::Error::from_reason(format!("unknown codegen artifact `{id}`")))?;
        let options = generate_options(&self.user_config, options);
        let artifact = self
            .inner
            .generate_artifact(&self.user_config, id, options)
            .map(to_codegen_artifact);
        crate::flush_tracing();
        Ok(artifact)
    }

    #[napi(js_name = generateAffectedArtifacts)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "NAPI requires owned arguments"
    )]
    pub fn generate_affected_artifacts(
        &self,
        dependencies: Vec<String>,
        options: Option<GenerateArtifactOptions>,
    ) -> napi::Result<Vec<CodegenArtifact>> {
        crate::init_tracing();
        let _span =
            tracing::trace_span!("codegen", method = "generate_affected_artifacts").entered();
        let changed = dependency_set_from_strings(dependencies)?;
        let options = generate_options(&self.user_config, options);
        let artifacts = self
            .inner
            .generate_affected_artifacts(&self.user_config, changed, options)
            .into_iter()
            .map(to_codegen_artifact)
            .collect();
        crate::flush_tracing();
        Ok(artifacts)
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

fn atom_value_to_json(value: &AtomValue) -> serde_json::Value {
    match value {
        // Same rule as `convert::to_atom_value` — resolved string at the boundary.
        AtomValue::String(value) | AtomValue::Token { value, .. } => {
            serde_json::Value::String(value.to_string())
        }
        AtomValue::Number(value) => parse_number_string(value),
        AtomValue::Bool(value) => serde_json::Value::Bool(*value),
        AtomValue::Null => serde_json::Value::Null,
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

/// Resolve a glob's watch base dir against `cwd` (empty base → `cwd` itself,
/// avoiding a trailing-slash artifact).
fn resolve_base(cwd: &str, pattern: &str) -> String {
    let cwd = std::path::Path::new(cwd);
    let base = pandacss_fs::base_dir(pattern);
    if base.is_empty() {
        cwd.to_string_lossy().into_owned()
    } else {
        cwd.join(base).to_string_lossy().into_owned()
    }
}

fn convert_report(path: String, report: pandacss_project::ParseFileReport) -> ParseFileReport {
    ParseFileReport {
        path,
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

fn glob_options(
    user_config: &UserConfig,
    options: Option<&ScanOptions>,
) -> pandacss_fs::GlobOptions {
    pandacss_fs::GlobOptions {
        include: options
            .and_then(|opts| opts.include.clone())
            .unwrap_or_else(|| user_config.include.clone()),
        exclude: options
            .and_then(|opts| opts.exclude.clone())
            .unwrap_or_else(|| user_config.exclude.clone()),
        cwd: std::path::PathBuf::from(
            options
                .and_then(|opts| opts.cwd.clone())
                .unwrap_or_else(|| user_config.cwd.clone()),
        ),
        absolute: true,
    }
}

fn apply_project_options(
    mut project: pandacss_project::Project,
    opts: &ProjectOptions,
    fs: &pandacss_fs::OsFileSystem,
) -> pandacss_project::Project {
    if opts.cross_file.unwrap_or(true) {
        // Share the same fs instance with the resolver so cross-file reads and
        // `glob`/`scan` see one consistent view.
        project =
            project.with_cross_file(pandacss_extractor::CrossFileResolver::with_fs(fs.clone()));
    }
    project
}

fn generate_options(
    user_config: &UserConfig,
    options: Option<GenerateArtifactOptions>,
) -> GenerateOptions {
    let import_extensions = options
        .and_then(|options| options.force_import_extension)
        .unwrap_or(user_config.force_import_extension);

    GenerateOptions {
        format: user_config.out_extension,
        import_extensions,
    }
}

fn to_compile_options(emit_layer_declaration: Option<bool>) -> Option<CompileOptions> {
    emit_layer_declaration.map(|emit_layer_declaration| CompileOptions {
        emit_layer_declaration: Some(emit_layer_declaration),
    })
}

fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifact {
    CodegenArtifact {
        id: artifact.id.as_str().to_owned(),
        files: artifact
            .files
            .into_iter()
            .map(|file| CodegenFile {
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

fn dependency_set_from_strings(dependencies: Vec<String>) -> napi::Result<DependencySet> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let dependency = dependency.parse::<ConfigDependency>().map_err(|()| {
            napi::Error::from_reason(format!("unknown config dependency `{dependency}`"))
        })?;
        set = set.union(DependencySet::one(dependency));
    }
    Ok(set)
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

#[allow(
    clippy::result_large_err,
    reason = "Err mirrors the shared Result<_, Diagnostic> transform-callback contract used by other JS callbacks"
)]
fn apply_source_transforms(
    path: &str,
    source: &str,
    callbacks: &[(String, SourceTransformCallback)],
    env: &Env,
) -> Result<Option<String>, pandacss_extractor::Diagnostic> {
    let mut current: Option<String> = None;
    for (id, entry) in callbacks {
        let input = current.as_deref().unwrap_or(source);
        if !entry.filter.admits(path, input) {
            continue;
        }

        let transform = entry.callback.borrow_back(env).map_err(|err| {
            callback_diagnostic(format!(
                "Failed to borrow parser:before callback `{id}` for `{path}`: {err}"
            ))
        })?;
        let result = transform
            .call(FnArgs::from((path.to_owned(), input.to_owned())))
            .map_err(|err| {
                callback_diagnostic(format!(
                    "parser:before callback `{id}` for `{path}` threw: {}",
                    err.reason
                ))
            })?;
        if let Some(next) = result {
            current = Some(next);
        }
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
    callbacks: &HashMap<String, UtilityTransformRef>,
    cache: &mut LruCache<UtilityTransformCacheKey, Literal>,
    env: &Env,
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
    let resolved_json = atom_value_to_json(resolved);
    let original_json = atom_value_to_json(original);
    let transform = callback.borrow_back(env).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to borrow utility transform callback `{id}` for `{prop}`: {err}"
        ))
    })?;
    let result = transform
        .call(FnArgs::from((resolved_json, original_json)))
        .map_err(|err| {
            callback_diagnostic(format!(
                "Utility transform callback `{id}` for `{prop}` threw: {}",
                err.reason
            ))
        })?;
    // Keep the style object whole for the emitter; non-object/empty → empty
    // object, which drops the carrier atom downstream.
    let styles = match json_value_to_literal(&result) {
        Some(object @ Literal::Object(_)) => object,
        _ => Literal::Object(Vec::new()),
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
    callbacks: &HashMap<String, FunctionRef<FnArgs<(serde_json::Value,)>, serde_json::Value>>,
    cache: &mut LruCache<PatternTransformCacheKey, Option<Literal>>,
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

    let props = serde_json::to_value(styles).map_err(|err| {
        callback_diagnostic(format!(
            "Failed to serialize pattern props for `{name}`: {err}"
        ))
    })?;

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
