use super::{ParseFileReport, ProjectOptions, ScanOptions};

use pandacss_config::UserConfig;
use pandacss_encoder::AtomValue;
use pandacss_extractor::Literal;

/*
 * JSON boundary conversion.
 */
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

/*
 * File discovery and config glue.
 */
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
            .unwrap_or_else(|| user_config.scan_exclude()),
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

/*
 * Config values are flattened through JSON before they cross the NAPI layer.
 */
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

/*
 * Diagnostics.
 */
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
