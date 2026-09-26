use pandacss_compiler::SourceGlobOverrides;
use pandacss_encoder::Atom as CoreAtom;
use pandacss_extractor::CrossFileResolver;
use pandacss_fs::GlobOptions;
use serde::de::DeserializeOwned;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use crate::fs::WasmFileSystem;
use pandacss_config::UserConfig;

use super::serde_types::{
    AtomSerde, CompileOptionsSerde, CssOutputOptionsSerde, ParseFileReportSerde,
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
            value: pandacss_compiler::atom_value_json(atom.value()),
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
            value: pandacss_compiler::atom_value_json(atom.value()),
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

pub(super) fn glob_options(
    user_config: &UserConfig,
    options: JsValue,
) -> Result<GlobOptions, JsValue> {
    let overrides = if options.is_undefined() || options.is_null() {
        SourceGlobOverrides::default()
    } else {
        serde_wasm_bindgen::from_value(options)
            .map_err(|err| JsValue::from_str(&format!("invalid scan options: {err}")))?
    };
    Ok(pandacss_compiler::source_glob_options(
        user_config,
        overrides,
    ))
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
            pandacss_compiler::format_config_diagnostics(diagnostics)
        )
    }
}

pub(super) fn js_error_message(value: &JsValue) -> String {
    if let Some(error) = value.dyn_ref::<js_sys::Error>() {
        return error.message().into();
    }
    value.as_string().unwrap_or_else(|| format!("{value:?}"))
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
