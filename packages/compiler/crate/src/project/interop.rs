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
 * Diagnostics.
 */
