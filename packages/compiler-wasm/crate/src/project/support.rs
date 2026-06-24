use pandacss_encoder::Atom as CoreAtom;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::GlobOptions;
use serde::Serialize as _;
use serde::de::DeserializeOwned;
use std::collections::BTreeSet;
use std::path::PathBuf;
use std::sync::Arc;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use pandacss_codegen::{Artifact, ConfigDependency, DependencySet, GenerateOptions};
use pandacss_config::UserConfig;

use super::serde_types::{
    AtomSerde, CodegenArtifactSerde, CodegenFileSerde, CompileFileManifestSerde,
    CompileLayerRangeSerde, CompileLayerRangesSerde, CompileManifestSerde, CompileOptionsSerde,
    CompileOutputSerde, CssOutputOptionsSerde, GenerateArtifactOptionsSerde, GlobOverrides,
    LayerCssOptionsSerde, ParseFileReportSerde, SplitCssFileSerde, WriteArtifactsOptionsSerde,
    WriteCssOptionsSerde, WriteSplitCssOptionsSerde,
};

pub(super) fn parse_required_options<T>(value: JsValue, label: &str) -> Result<T, JsValue>
where
    T: DeserializeOwned,
{
    if value.is_undefined() || value.is_null() {
        return Err(JsValue::from_str(&format!("{label} options are required")));
    }
    serde_wasm_bindgen::from_value(value).map_err(|err| JsValue::from_str(&err.to_string()))
}

pub(super) fn compile_options_from_js(
    options: Option<JsValue>,
) -> Result<CompileOptionsSerde, JsValue> {
    match options {
        Some(value) if !value.is_undefined() && !value.is_null() => {
            parse_required_options(value, "compile")
        }
        _ => Ok(CompileOptionsSerde::default()),
    }
}

pub(super) fn css_output_options_from_js(
    options: Option<JsValue>,
    label: &str,
) -> Result<CssOutputOptionsSerde, JsValue> {
    match options {
        Some(value) if !value.is_undefined() && !value.is_null() => {
            parse_required_options(value, label)
        }
        _ => Ok(CssOutputOptionsSerde::default()),
    }
}

pub(super) fn write_artifacts_options_from_js(
    options: JsValue,
) -> Result<WriteArtifactsOptionsSerde, JsValue> {
    parse_required_options(options, "writeArtifacts")
}

pub(super) fn write_css_options_from_js(options: JsValue) -> Result<WriteCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeCss")
}

pub(super) fn write_split_css_options_from_js(
    options: JsValue,
) -> Result<WriteSplitCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeSplitCss")
}

pub(super) fn generate_artifact_options_from_js(
    options: &JsValue,
) -> Result<GenerateArtifactOptionsSerde, JsValue> {
    if options.is_undefined() || options.is_null() {
        return Ok(GenerateArtifactOptionsSerde::default());
    }
    serde_wasm_bindgen::from_value(options.clone())
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

pub(super) fn serialize_codegen_artifacts(artifacts: Vec<Artifact>) -> Result<JsValue, JsValue> {
    let _span = tracing::trace_span!("boundary_encode", method = "codegen_artifacts").entered();
    let artifacts = artifacts
        .into_iter()
        .map(to_codegen_artifact)
        .collect::<Vec<_>>();
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    artifacts
        .serialize(&serializer)
        .map_err(|err| JsValue::from_str(&err.to_string()))
}

pub(super) fn to_codegen_artifact(artifact: Artifact) -> CodegenArtifactSerde {
    CodegenArtifactSerde {
        id: artifact.id.as_str().to_owned(),
        files: artifact
            .files
            .into_iter()
            .map(|file| CodegenFileSerde {
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
) -> Result<DependencySet, JsValue> {
    let mut set = DependencySet::EMPTY;
    for dependency in dependencies {
        let dependency = dependency.parse::<ConfigDependency>().map_err(|()| {
            JsValue::from_str(&format!("unknown config dependency `{dependency}`"))
        })?;
        set = set.union(DependencySet::one(dependency));
    }
    Ok(set)
}

pub(super) fn generate_options(
    user_config: &UserConfig,
    options: &GenerateArtifactOptionsSerde,
) -> GenerateOptions {
    let import_extensions = options
        .force_import_extension
        .unwrap_or(user_config.force_import_extension);

    GenerateOptions {
        format: user_config.out_extension,
        import_extensions,
    }
}

pub(super) fn build_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    emit_layer_declaration: bool,
    minify_override: Option<bool>,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        emit_layer_declaration,
        minify_override,
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
        manifest,
        layer_ranges: layer_ranges_from(&output.layer_ranges),
        diagnostics,
    }
}

pub(super) fn build_layer_compile_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    static_pattern_diagnostics: Vec<pandacss_extractor::Diagnostic>,
    options: &LayerCssOptionsSerde,
) -> CompileOutputSerde {
    let token_dictionary = project.config().token_dictionary();
    let manifest = compile_manifest_serde(project, token_dictionary.as_ref());
    let output = build_stylesheet_output(
        project,
        user_config,
        token_dictionary,
        static_pattern_atoms,
        false,
        options.minify,
    );
    let selected: Vec<pandacss_stylesheet::StylesheetLayer> = options
        .layers
        .iter()
        .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
        .collect();
    let mut css = output.get_layer_css(&selected);
    if options.emit_layer_declaration.unwrap_or(false) {
        let preamble =
            pandacss_stylesheet::layer_order_declaration(&user_config.layers, Some(&selected));
        if !preamble.is_empty() {
            css.insert_str(0, &format!("{preamble}\n"));
        }
    }
    let diagnostics: Vec<pandacss_shared::Diagnostic> = project
        .diagnostics()
        .iter()
        .cloned()
        .chain(static_pattern_diagnostics)
        .chain(output.diagnostics)
        .collect();
    CompileOutputSerde {
        css,
        source_map: output.source_map,
        manifest,
        layer_ranges: empty_layer_ranges(),
        diagnostics,
    }
}

/// Split the stylesheet into per-file outputs (layers + recipes + indexes).
pub(super) fn build_split_css(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    static_pattern_atoms: &[CoreAtom],
    css_options: &CssOutputOptionsSerde,
) -> Vec<SplitCssFileSerde> {
    let token_dictionary = project.config().token_dictionary();
    let snapshots = project.stylesheet_snapshots(user_config);
    let selected_layers = css_options.layers.as_ref().map(|layers| {
        layers
            .iter()
            .filter_map(|name| pandacss_stylesheet::StylesheetLayer::from_name(name))
            .collect::<Vec<_>>()
    });
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: resolve_minify(user_config, css_options.minify),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration: css_options.emit_layer_declaration.unwrap_or(true),
        layers: selected_layers,
    };
    pandacss_stylesheet::split_css(
        &pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
    .into_iter()
    .map(|file| SplitCssFileSerde {
        path: file.path,
        code: file.code,
    })
    .collect()
}

/// Raw stylesheet (css + layer ranges); shared by `build_compile_output` and
/// `css_for_layers`.
pub(super) fn build_stylesheet_output(
    project: &mut pandacss_project::Project,
    user_config: &pandacss_config::UserConfig,
    token_dictionary: Option<std::sync::Arc<pandacss_tokens::TokenDictionary>>,
    static_pattern_atoms: &[CoreAtom],
    emit_layer_declaration: bool,
    minify_override: Option<bool>,
) -> pandacss_stylesheet::StylesheetOutput {
    let snapshots = project.stylesheet_snapshots(user_config);
    let options = pandacss_stylesheet::StylesheetOptions {
        minify: resolve_minify(user_config, minify_override),
        include_static: pandacss_stylesheet::has_static_css(user_config),
        source_map: false,
        emit_layer_declaration,
        layers: None,
    };
    pandacss_stylesheet::compile(
        pandacss_stylesheet::StylesheetInput {
            config: user_config,
            token_dictionary,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms,
            token_refs: snapshots.token_refs,
        },
        &options,
    )
}

pub(super) fn resolve_minify(
    user_config: &pandacss_config::UserConfig,
    minify_override: Option<bool>,
) -> bool {
    minify_override.unwrap_or_else(|| {
        user_config
            .extra
            .get("minify")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false)
    })
}

pub(super) fn compile_manifest_serde(
    project: &pandacss_project::Project,
    token_dictionary: Option<&Arc<pandacss_tokens::TokenDictionary>>,
) -> CompileManifestSerde {
    let files: Vec<CompileFileManifestSerde> = project
        .file_manifest()
        .into_iter()
        .map(|(path, hash)| CompileFileManifestSerde {
            path: path.as_ref().to_owned(),
            hash: format!("{hash:016x}"),
        })
        .collect();
    let tokens: Vec<String> = token_dictionary.map_or_else(Vec::new, |dict| {
        let mut paths: BTreeSet<String> = BTreeSet::new();
        for token in dict.iter() {
            paths.insert(token.path.to_string());
        }
        paths.into_iter().collect()
    });
    CompileManifestSerde { files, tokens }
}

pub(super) fn empty_layer_ranges() -> CompileLayerRangesSerde {
    CompileLayerRangesSerde {
        reset: None,
        base: None,
        tokens: None,
        recipes: None,
        utilities: None,
    }
}

pub(super) fn layer_ranges_from(
    r: &pandacss_stylesheet::StylesheetLayerRanges,
) -> CompileLayerRangesSerde {
    CompileLayerRangesSerde {
        reset: r.reset.as_ref().map(to_serde_range),
        base: r.base.as_ref().map(to_serde_range),
        tokens: r.tokens.as_ref().map(to_serde_range),
        recipes: r.recipes.as_ref().map(to_serde_range),
        utilities: r.utilities.as_ref().map(to_serde_range),
    }
}

pub(super) fn to_serde_range(range: &std::ops::Range<usize>) -> CompileLayerRangeSerde {
    CompileLayerRangeSerde {
        start: u32::try_from(range.start).unwrap_or(u32::MAX),
        end: u32::try_from(range.end).unwrap_or(u32::MAX),
    }
}

pub(super) fn slice_to_atom_serde(atoms: &[CoreAtom]) -> Vec<AtomSerde> {
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

pub(super) fn with_wasm_fs(
    project: pandacss_project::Project,
    fs: &WasmFileSystem,
) -> pandacss_project::Project {
    // Cross-file resolver always shares the WasmFileSystem so imports
    // fold through whatever the JS host populated.
    project.with_cross_file(CrossFileResolver::with_fs(fs.inner.clone()))
}

pub(super) fn parse_file_report(
    path: &str,
    report: pandacss_project::ParseFileReport,
) -> ParseFileReportSerde {
    ParseFileReportSerde {
        path: path.to_owned(),
        css_calls: u32::try_from(report.css_calls).unwrap_or(u32::MAX),
        cva_calls: u32::try_from(report.cva_calls).unwrap_or(u32::MAX),
        sva_calls: u32::try_from(report.sva_calls).unwrap_or(u32::MAX),
        jsx_usages: u32::try_from(report.jsx_usages).unwrap_or(u32::MAX),
        diagnostics: report.diagnostics,
    }
}

/// Resolve a glob's watch base dir against `cwd` (empty base → `cwd` itself).
pub(super) fn resolve_base(cwd: &str, pattern: &str) -> String {
    let cwd = std::path::Path::new(cwd);
    let base = pandacss_fs::base_dir(pattern);
    if base.is_empty() {
        cwd.to_string_lossy().into_owned()
    } else {
        cwd.join(base).to_string_lossy().into_owned()
    }
}

pub(super) fn glob_options(
    user_config: &UserConfig,
    options: JsValue,
) -> Result<GlobOptions, JsValue> {
    let overrides: GlobOverrides = if options.is_undefined() || options.is_null() {
        GlobOverrides::default()
    } else {
        serde_wasm_bindgen::from_value(options)
            .map_err(|err| JsValue::from_str(&format!("invalid scan options: {err}")))?
    };
    Ok(GlobOptions {
        include: overrides
            .include
            .unwrap_or_else(|| user_config.include.clone()),
        exclude: overrides
            .exclude
            .unwrap_or_else(|| user_config.exclude.clone()),
        cwd: PathBuf::from(overrides.cwd.unwrap_or_else(|| user_config.cwd.clone())),
        absolute: true,
    })
}

pub(super) fn collect_sorted_atoms<S: std::hash::BuildHasher>(
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

pub(super) fn format_deserialize_error(
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

pub(super) fn js_error_message(value: &JsValue) -> String {
    if let Some(error) = value.dyn_ref::<js_sys::Error>() {
        return error.message().into();
    }
    value.as_string().unwrap_or_else(|| format!("{value:?}"))
}

pub(super) fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    first.to_uppercase().chain(chars).collect()
}

pub(super) fn atom_value_to_json(v: &pandacss_encoder::AtomValue) -> serde_json::Value {
    match v {
        // Resolved CSS string at the boundary; token path is build-info-only.
        pandacss_encoder::AtomValue::String(s)
        | pandacss_encoder::AtomValue::Token { value: s, .. } => {
            serde_json::Value::String(s.to_string())
        }
        pandacss_encoder::AtomValue::Number(s) => parse_number_string(s),
        pandacss_encoder::AtomValue::Bool(b) => serde_json::Value::Bool(*b),
        pandacss_encoder::AtomValue::Null => serde_json::Value::Null,
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

pub(super) fn parse_number_string(s: &str) -> serde_json::Value {
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

pub(super) fn value_sort_key(v: &pandacss_encoder::AtomValue) -> String {
    match v {
        pandacss_encoder::AtomValue::String(s)
        | pandacss_encoder::AtomValue::Token { value: s, .. } => format!("s:{s}"),
        pandacss_encoder::AtomValue::Number(s) => format!("n:{s}"),
        pandacss_encoder::AtomValue::Bool(b) => format!("b:{b}"),
        pandacss_encoder::AtomValue::Null => "z:".to_owned(),
    }
}
