use super::{
    CodegenArtifact, CodegenFile, GenerateArtifactOptions, ParseFileReport, ProjectOptions,
    ScanOptions, SourceTransformCallback, UtilityTransformRef, UtilityValueCallbacks,
    WriteCssOptions, WriteSplitCssOptions,
};

use lru::LruCache;
use std::collections::HashMap;

use crate::cache::{
    MAX_TRANSFORM_CACHE_KEY_BYTES, PatternTransformCacheKey, UtilityTransformCacheKey,
};
use crate::compile::{CompileOptions, CssOutputOptions};
use crate::matcher::from_core_token_dictionary;
use napi::bindgen_prelude::{Env, FnArgs, FunctionRef};
use pandacss_codegen::{Artifact, ConfigDependency, DependencySet, GenerateOptions};
use pandacss_config::{
    CallbackRef, JsxSpecifier, PatternConfig, UserConfig, UtilityConfig, UtilityValues,
};
use pandacss_encoder::AtomValue;
use pandacss_extractor::{DiagnosticSeverity, Literal, diagnostic_codes};

pub(super) fn atom_value_to_json(value: &AtomValue) -> serde_json::Value {
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

pub(super) fn utility_value_source_to_json(
    source: pandacss_project::UtilityValueSource,
) -> serde_json::Value {
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

pub(super) fn parse_number_string(value: &str) -> serde_json::Value {
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
pub(super) fn resolve_base(cwd: &str, pattern: &str) -> String {
    let cwd = std::path::Path::new(cwd);
    let base = pandacss_fs::base_dir(pattern);
    if base.is_empty() {
        cwd.to_string_lossy().into_owned()
    } else {
        cwd.join(base).to_string_lossy().into_owned()
    }
}

pub(super) fn convert_report(
    path: String,
    report: pandacss_project::ParseFileReport,
) -> ParseFileReport {
    ParseFileReport {
        path,
        css_calls: u32::try_from(report.css_calls).unwrap_or(u32::MAX),
        cva_calls: u32::try_from(report.cva_calls).unwrap_or(u32::MAX),
        sva_calls: u32::try_from(report.sva_calls).unwrap_or(u32::MAX),
        jsx_usages: u32::try_from(report.jsx_usages).unwrap_or(u32::MAX),
        diagnostics: report
            .diagnostics
            .into_iter()
            .map(crate::convert::convert_diagnostic)
            .collect(),
    }
}

pub(super) fn glob_options(
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

pub(super) fn apply_project_options(
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

pub(super) fn generate_options(
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

pub(super) fn compile_options_from_write_css(options: &WriteCssOptions) -> CompileOptions {
    CompileOptions {
        emit_layer_declaration: options.emit_layer_declaration,
        minify: options.minify,
    }
}

pub(super) fn css_output_options_from_write_split(
    options: &WriteSplitCssOptions,
) -> CssOutputOptions {
    CssOutputOptions {
        layers: options.layers.clone(),
        emit_layer_declaration: options.emit_layer_declaration,
        minify: options.minify,
    }
}

pub(super) fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifact {
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

pub(super) fn dependency_names(dependencies: DependencySet) -> Vec<String> {
    dependencies
        .to_vec()
        .into_iter()
        .map(|dependency| dependency.as_str().to_owned())
        .collect()
}

pub(super) fn dependency_set_from_strings(
    dependencies: Vec<String>,
) -> napi::Result<DependencySet> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let dependency = dependency.parse::<ConfigDependency>().map_err(|()| {
            napi::Error::from_reason(format!("unknown config dependency `{dependency}`"))
        })?;
        set = set.union(DependencySet::one(dependency));
    }
    Ok(set)
}

pub(super) fn resolve_utility_values_callbacks(
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

pub(super) fn utility_values_callback_id(utility: &UtilityConfig) -> Option<&str> {
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
pub(super) fn apply_source_transforms(
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
pub(super) fn apply_utility_transform(
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
pub(super) fn apply_pattern_transform(
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

pub(super) fn trace_cache_store(cache: &'static str, target: &str, len: usize, capacity: usize) {
    tracing::trace!(
        cache,
        action = "store",
        target,
        entries = len.saturating_add(1).min(capacity),
        evicted = len == capacity
    );
}

pub(super) fn get_utility_transform_refs(config: &UserConfig) -> HashMap<String, String> {
    let mut refs = HashMap::new();
    for (prop, utility) in &config.utilities {
        if let Some(id) = utility_callback_id(utility) {
            refs.insert(prop.clone(), id.to_owned());
        }
    }

    refs
}

pub(super) fn get_pattern_transform_refs(config: &UserConfig) -> HashMap<String, String> {
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

pub(super) fn utility_callback_id(utility: &UtilityConfig) -> Option<&str> {
    callback_ref_id(utility.transform.as_ref()?)
}

pub(super) fn pattern_callback_id(pattern: &PatternConfig) -> Option<&str> {
    callback_ref_id(pattern.transform.as_ref()?)
}

pub(super) fn callback_ref_id(value: &CallbackRef) -> Option<&str> {
    (value.kind == "js-callback")
        .then_some(value.id.as_deref())
        .flatten()
}

pub(super) fn json_value_to_literal(value: &serde_json::Value) -> Option<Literal> {
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

pub(super) fn callback_diagnostic(message: String) -> pandacss_extractor::Diagnostic {
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

pub(super) fn format_config_diagnostics(diagnostics: &[pandacss_shared::Diagnostic]) -> String {
    let mut message = String::from("Invalid config:");
    for diagnostic in diagnostics {
        message.push_str("\n- [");
        message.push_str(&diagnostic.code);
        message.push_str("] ");
        message.push_str(&diagnostic.message);
    }
    message
}

pub(super) fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_uppercase().chain(chars).collect()
}
