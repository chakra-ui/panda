use super::{ParseFileReport, ProjectOptions, ScanOptions};

use pandacss_config::UserConfig;

/*
 * File discovery and config glue.
 */
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
    let overrides = options.map_or_else(pandacss_compiler::SourceGlobOverrides::default, |opts| {
        pandacss_compiler::SourceGlobOverrides {
            include: opts.include.clone(),
            exclude: opts.exclude.clone(),
            cwd: opts.cwd.clone(),
        }
    });
    pandacss_compiler::source_glob_options(user_config, overrides)
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
 * Diagnostics.
 */
