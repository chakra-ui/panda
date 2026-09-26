//! Which exports of each design-system package the app imports, so hydration
//! can narrow to the modules that are used.

use std::io;
use std::path::Path;

use pandacss_config::UserConfig;
use pandacss_extractor::{
    DesignSystemImportSelection, DesignSystemPackageQuery,
    collect_design_system_imports_for_packages,
};
use pandacss_fs::FileSystem;
use pandacss_project::Project;
use serde::Deserialize;

use crate::{SourceGlobOverrides, source_glob_options};

/// One design-system package to look for in the app's imports.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemImportQuery {
    pub package_roots: Vec<String>,
    /// Subpaths that don't count as a use of the package (e.g. its `css` entry).
    #[serde(default)]
    pub exclude_modules: Option<Vec<String>>,
}

/// Per-package import selections from one scan of the `include` sources.
/// Each entry is `None` = hydrate everything, or the export names to narrow to.
///
/// # Errors
/// Returns the glob error when the source scan fails (e.g. a missing `cwd`).
pub fn design_system_import_selections<F: FileSystem>(
    project: &Project,
    fs: &F,
    user_config: &UserConfig,
    packages: &[DesignSystemImportQuery],
) -> io::Result<Vec<Option<Vec<String>>>> {
    let paths = fs.glob(&source_glob_options(
        user_config,
        SourceGlobOverrides::default(),
    ))?;
    let sources: Vec<(String, String)> = paths
        .into_iter()
        .filter_map(|path| {
            let source = source_for_import_scan(project, fs, &path)?;
            Some((path.to_string_lossy().into_owned(), source))
        })
        .collect();

    let root_lists: Vec<Vec<&str>> = packages
        .iter()
        .map(|pkg| pkg.package_roots.iter().map(String::as_str).collect())
        .collect();
    let exclude_lists: Vec<Vec<&str>> = packages
        .iter()
        .map(|pkg| {
            pkg.exclude_modules
                .as_ref()
                .map(|mods| mods.iter().map(String::as_str).collect())
                .unwrap_or_default()
        })
        .collect();
    let queries: Vec<DesignSystemPackageQuery<'_>> = root_lists
        .iter()
        .zip(exclude_lists.iter())
        .map(|(roots, excluded)| DesignSystemPackageQuery {
            package_roots: roots.as_slice(),
            exclude_modules: excluded.as_slice(),
        })
        .collect();

    Ok(collect_design_system_imports_for_packages(
        sources
            .iter()
            .map(|(path, source)| (path.as_str(), source.as_str())),
        &queries,
    )
    .into_iter()
    .map(DesignSystemImportSelection::into_load_imports)
    .collect())
}

/// Prefer the project's in-memory source (watch `applyChange`) over the filesystem.
fn source_for_import_scan<F: FileSystem>(project: &Project, fs: &F, path: &Path) -> Option<String> {
    let path_str = path.to_string_lossy();
    if let Some(source) = project.file_source(path_str.as_ref()) {
        return Some(source.to_owned());
    }
    if let Ok(real) = fs.canonicalize(path) {
        let real_str = real.to_string_lossy();
        if real_str != path_str
            && let Some(source) = project.file_source(real_str.as_ref())
        {
            return Some(source.to_owned());
        }
    }
    fs.read_to_string(path).ok()
}
