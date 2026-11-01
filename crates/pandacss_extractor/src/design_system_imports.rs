//! Filter import-scan results for design-system hydrate narrowing.

use std::collections::BTreeSet;

use serde::Serialize;

use crate::imports::{
    ImportKind, ImportRecord, ImportSpecifierKind, ScanImportsOptions, scan_imports_with,
};

/// `All` = full hydrate; `Names` = only these imports (may be empty).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DesignSystemImportSelection {
    All,
    Names { imports: Vec<DesignSystemImport> },
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize)]
pub struct DesignSystemImport {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
}

impl DesignSystemImport {
    #[must_use]
    pub fn new(name: impl Into<String>, from: Option<&str>) -> Self {
        Self {
            name: name.into(),
            from: from.map(str::to_owned),
        }
    }
}

impl DesignSystemImportSelection {
    /// `None` = omit `imports` (full hydrate); `Some` = pass to `load({ imports })`.
    #[must_use]
    pub fn into_load_imports(self) -> Option<Vec<DesignSystemImport>> {
        match self {
            Self::All => None,
            Self::Names { imports } => Some(imports),
        }
    }

    /// The flat form build info records: names plus subpaths.
    #[must_use]
    pub fn export_names(imports: &[DesignSystemImport]) -> Vec<String> {
        let names: BTreeSet<&str> = imports
            .iter()
            .flat_map(|import| [Some(import.name.as_str()), import.from.as_deref()])
            .flatten()
            .collect();
        names.into_iter().map(str::to_owned).collect()
    }
}

/// One package query for [`collect_design_system_imports_for_packages`].
#[derive(Debug, Clone, Copy)]
pub struct DesignSystemPackageQuery<'a> {
    pub package_roots: &'a [&'a str],
    pub exclude_modules: &'a [&'a str],
}

/// Scan sources once (imports + `export … from`), then filter per package.
#[must_use]
pub fn collect_design_system_imports_for_packages<'a, I>(
    sources: I,
    packages: &[DesignSystemPackageQuery<'_>],
) -> Vec<DesignSystemImportSelection>
where
    I: IntoIterator<Item = (&'a str, &'a str)>,
{
    let records = scan_all_records(sources);
    packages
        .iter()
        .map(|pkg| selection_from_import_records(&records, pkg.package_roots, pkg.exclude_modules))
        .collect()
}

/// Collect export names from `package_roots` across `sources` (single package).
#[must_use]
pub fn collect_design_system_imports<'a, I>(
    sources: I,
    package_roots: &[&str],
    exclude_modules: &[&str],
) -> DesignSystemImportSelection
where
    I: IntoIterator<Item = (&'a str, &'a str)>,
{
    collect_design_system_imports_for_packages(
        sources,
        &[DesignSystemPackageQuery {
            package_roots,
            exclude_modules,
        }],
    )
    .into_iter()
    .next()
    .unwrap_or(DesignSystemImportSelection::Names {
        imports: Vec::new(),
    })
}

/// Filter already-scanned records for one package.
#[must_use]
pub fn selection_from_import_records(
    records: &[ImportRecord],
    package_roots: &[&str],
    exclude_modules: &[&str],
) -> DesignSystemImportSelection {
    let roots = normalize_roots(package_roots);
    if roots.is_empty() {
        return DesignSystemImportSelection::Names {
            imports: Vec::new(),
        };
    }
    let excluded: BTreeSet<&str> = exclude_modules.iter().copied().collect();
    selection_from_records(records, &roots, &excluded)
}

fn scan_all_records<'a, I>(sources: I) -> Vec<ImportRecord>
where
    I: IntoIterator<Item = (&'a str, &'a str)>,
{
    let opts = ScanImportsOptions {
        reexports: true,
        dynamic: true,
    };
    let mut records = Vec::new();
    for (path, source) in sources {
        records.extend(scan_imports_with(source, path, opts).imports);
    }
    records
}

fn selection_from_records<'r>(
    records: impl IntoIterator<Item = &'r ImportRecord>,
    roots: &[&str],
    excluded: &BTreeSet<&str>,
) -> DesignSystemImportSelection {
    let mut imports = BTreeSet::new();

    for record in records {
        if record.type_only || !is_design_system_module(&record.module, roots, excluded) {
            continue;
        }
        if matches!(record.kind, ImportKind::SideEffect | ImportKind::ExportAll) {
            return DesignSystemImportSelection::All;
        }
        let from = package_subpath(&record.module, roots);
        for specifier in &record.specifiers {
            if specifier.type_only {
                continue;
            }
            if specifier.kind == ImportSpecifierKind::Namespace || specifier.imported == "*" {
                return DesignSystemImportSelection::All;
            }
            imports.insert(DesignSystemImport::new(specifier.imported.clone(), from));
        }
    }

    DesignSystemImportSelection::Names {
        imports: imports.into_iter().collect(),
    }
}

/// How a design system's own file uses a parent package.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DesignSystemUsage {
    /// Exports the file imports or re-exports by name.
    pub referenced_exports: DesignSystemImportSelection,
    /// `export * from` the parent: names the file doesn't list fall through to it.
    pub star_reexport: bool,
}

/// Like [`selection_from_import_records`], but keeps `export *` out of `referenced_exports`.
#[must_use]
pub fn design_system_usage_from_import_records(
    records: &[ImportRecord],
    package_roots: &[&str],
    exclude_modules: &[&str],
) -> DesignSystemUsage {
    let roots = normalize_roots(package_roots);
    let excluded: BTreeSet<&str> = exclude_modules.iter().copied().collect();
    let star_reexport = records.iter().any(|record| {
        record.kind == ImportKind::ExportAll
            && is_design_system_module(&record.module, &roots, &excluded)
    });
    let referenced_exports = records
        .iter()
        .filter(|record| record.kind != ImportKind::ExportAll);
    DesignSystemUsage {
        referenced_exports: selection_from_records(referenced_exports, &roots, &excluded),
        star_reexport,
    }
}

/// `@acme/ds/button` → `button` when `roots` contains `@acme/ds`.
fn package_subpath<'a>(module_id: &'a str, roots: &[&str]) -> Option<&'a str> {
    roots.iter().find_map(|root| {
        module_id
            .strip_prefix(root)
            .and_then(|rest| rest.strip_prefix('/'))
            .filter(|stem| !stem.is_empty())
    })
}

fn normalize_roots<'a>(roots: &[&'a str]) -> Vec<&'a str> {
    let mut seen = BTreeSet::new();
    let mut out = Vec::new();
    for root in roots {
        if root.is_empty() || !seen.insert(*root) {
            continue;
        }
        out.push(*root);
    }
    out
}

fn is_design_system_module(module_id: &str, roots: &[&str], excluded: &BTreeSet<&str>) -> bool {
    if excluded.contains(module_id) {
        return false;
    }
    roots.iter().any(|root| {
        module_id == *root
            || module_id
                .strip_prefix(root)
                .is_some_and(|rest| rest.starts_with('/'))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn named(names: &[&str]) -> DesignSystemImportSelection {
        DesignSystemImportSelection::Names {
            imports: names
                .iter()
                .map(|name| DesignSystemImport::new(*name, None))
                .collect(),
        }
    }

    fn collect(source: &str, roots: &[&str], exclude: &[&str]) -> DesignSystemImportSelection {
        collect_design_system_imports([("fixture.tsx", source)], roots, exclude)
    }

    #[test]
    fn named_and_default_imports_select_their_names() {
        assert_eq!(
            collect(
                "import { Button, Card as C } from '@acme/ds'\nimport B from '@acme/ds'",
                &["@acme/ds"],
                &[]
            ),
            named(&["Button", "Card", "default"])
        );
    }

    #[test]
    fn namespace_import_selects_all_exports() {
        assert_eq!(
            collect("import * as DS from '@acme/ds'", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    #[test]
    fn side_effect_import_selects_all_exports() {
        assert_eq!(
            collect("import '@acme/ds'", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    #[test]
    fn named_reexport_selects_the_imported_name() {
        assert_eq!(
            collect(
                "export { Button as Btn } from '@acme/ds'",
                &["@acme/ds"],
                &[]
            ),
            named(&["Button"])
        );
    }

    #[test]
    fn export_all_selects_all_exports() {
        assert_eq!(
            collect("export * from '@acme/ds'", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    use indoc::indoc;

    fn usage(source: &str) -> DesignSystemUsage {
        let records = scan_imports_with(
            source,
            "fixture.tsx",
            ScanImportsOptions {
                reexports: true,
                dynamic: true,
            },
        )
        .imports;
        design_system_usage_from_import_records(&records, &["@acme/ds"], &["@acme/ds/css"])
    }

    #[test]
    fn usage_keeps_export_all_out_of_imports() {
        assert_eq!(
            usage(indoc! {"
                export * from '@acme/ds'
                export { Card } from '@acme/ds'
            "}),
            DesignSystemUsage {
                referenced_exports: named(&["Card"]),
                star_reexport: true,
            }
        );
    }

    #[test]
    fn usage_treats_namespace_import_as_all() {
        assert_eq!(
            usage("import * as DS from '@acme/ds'"),
            DesignSystemUsage {
                referenced_exports: DesignSystemImportSelection::All,
                star_reexport: false,
            }
        );
    }

    #[test]
    fn usage_treats_side_effect_import_as_all() {
        assert_eq!(
            usage(indoc! {"
                import '@acme/ds'
                export * from '@acme/ds'
            "}),
            DesignSystemUsage {
                referenced_exports: DesignSystemImportSelection::All,
                star_reexport: true,
            }
        );
    }

    #[test]
    fn usage_ignores_export_all_from_other_packages() {
        assert_eq!(
            usage(indoc! {"
                export * from './local'
                export * from '@acme/ds/css'
            "}),
            DesignSystemUsage {
                referenced_exports: named(&[]),
                star_reexport: false,
            }
        );
    }

    #[test]
    fn excluded_modules_and_type_only_imports_select_nothing() {
        assert_eq!(
            collect(
                "import { css } from '@acme/ds/css'\nimport type { Button } from '@acme/ds'",
                &["@acme/ds"],
                &["@acme/ds/css"]
            ),
            named(&[])
        );
    }

    #[test]
    fn one_scan_selects_names_for_each_package() {
        let source = "import { Button } from '@acme/ds'\nimport { Stack } from '@acme/base'";
        let selections = collect_design_system_imports_for_packages(
            [("fixture.tsx", source)],
            &[
                DesignSystemPackageQuery {
                    package_roots: &["@acme/ds"],
                    exclude_modules: &[],
                },
                DesignSystemPackageQuery {
                    package_roots: &["@acme/base"],
                    exclude_modules: &[],
                },
            ],
        );
        assert_eq!(selections, vec![named(&["Button"]), named(&["Stack"]),]);
    }

    #[test]
    fn all_selection_loads_every_export() {
        assert_eq!(DesignSystemImportSelection::All.into_load_imports(), None);
    }

    #[test]
    fn names_selection_loads_only_those_names() {
        assert_eq!(
            named(&["Button"]).into_load_imports(),
            Some(vec![DesignSystemImport::new("Button", None)])
        );
    }

    #[test]
    fn subpath_imports_keep_the_subpath_with_each_name() {
        assert_eq!(
            collect(
                "import Badge from '@acme/ds/badge'\nimport { Panel } from '@acme/ds/panel'",
                &["@acme/ds"],
                &[]
            ),
            DesignSystemImportSelection::Names {
                imports: vec![
                    DesignSystemImport::new("Panel", Some("panel")),
                    DesignSystemImport::new("default", Some("badge")),
                ],
            }
        );
    }

    #[test]
    fn build_info_records_subpath_imports_as_names_and_subpaths() {
        assert_eq!(
            DesignSystemImportSelection::export_names(&[
                DesignSystemImport::new("Root", Some("alpha")),
                DesignSystemImport::new("Root", Some("beta")),
            ]),
            vec!["Root".to_owned(), "alpha".to_owned(), "beta".to_owned()]
        );
    }

    #[test]
    fn dynamic_import_selects_all_exports() {
        assert_eq!(
            collect("const ds = await import('@acme/ds')", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    #[test]
    fn require_selects_all_exports() {
        assert_eq!(
            collect("const ds = require('@acme/ds')", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    #[test]
    fn excluded_subpaths_are_ignored_even_for_dynamic() {
        assert_eq!(
            collect(
                "import { css } from '@acme/ds/css'\nawait import('@acme/ds/tokens')",
                &["@acme/ds"],
                &["@acme/ds/css", "@acme/ds/tokens"]
            ),
            named(&[])
        );
    }
}
