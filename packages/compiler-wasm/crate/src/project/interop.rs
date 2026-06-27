use pandacss_encoder::Atom as CoreAtom;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::GlobOptions;
use serde::de::DeserializeOwned;
use std::path::PathBuf;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use pandacss_config::UserConfig;

use super::serde_types::{
    AtomSerde, CompileOptionsSerde, CssOutputOptionsSerde, GlobOverrides, ParseFileReportSerde,
    WriteCssOptionsSerde, WriteLayerCssOptionsSerde, WriteSplitCssOptionsSerde,
};

/*
 * JS option parsing.
 */
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

pub(super) fn write_css_options_from_js(options: JsValue) -> Result<WriteCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeCss")
}

pub(super) fn write_layer_css_options_from_js(
    options: JsValue,
) -> Result<WriteLayerCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeLayerCss")
}

pub(super) fn write_split_css_options_from_js(
    options: JsValue,
) -> Result<WriteSplitCssOptionsSerde, JsValue> {
    parse_required_options(options, "writeSplitCss")
}

/*
 * Atom serialization.
 */
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

/*
 * File discovery and config glue.
 */
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
            .unwrap_or_else(|| user_config.scan_exclude()),
        cwd: PathBuf::from(overrides.cwd.unwrap_or_else(|| user_config.cwd.clone())),
        absolute: true,
    })
}

/*
 * Diagnostics.
 */
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

/*
 * JSON boundary conversion.
 */
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
