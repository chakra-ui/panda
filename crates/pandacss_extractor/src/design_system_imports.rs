//! Filter import-scan results for design-system hydrate narrowing.

use std::collections::BTreeSet;

use serde::Serialize;

use crate::imports::{
    ImportKind, ImportRecord, ImportSpecifierKind, ScanImportsOptions, scan_imports_with,
};

/// `All` = full hydrate; `Names` = only these export names (may be empty).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DesignSystemImportSelection {
    All,
    Names { names: Vec<String> },
}

impl DesignSystemImportSelection {
    /// `None` = omit `imports` (full hydrate); `Some` = pass to `load({ imports })`.
    #[must_use]
    pub fn into_load_imports(self) -> Option<Vec<String>> {
        match self {
            Self::All => None,
            Self::Names { names } => Some(names),
        }
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
    .unwrap_or(DesignSystemImportSelection::Names { names: Vec::new() })
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
        return DesignSystemImportSelection::Names { names: Vec::new() };
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

fn selection_from_records(
    records: &[ImportRecord],
    roots: &[&str],
    excluded: &BTreeSet<&str>,
) -> DesignSystemImportSelection {
    let mut names = BTreeSet::new();

    for record in records {
        if record.type_only || !is_design_system_module(&record.module, roots, excluded) {
            continue;
        }
        if record.kind == ImportKind::SideEffect {
            return DesignSystemImportSelection::All;
        }
        // Deep imports (`@acme/ds/button`) — keep the subpath stem so
        // `modulesFor` can resolve module keys when barrel `exports` miss.
        if let Some(stem) = package_subpath(&record.module, roots) {
            names.insert(stem.to_owned());
        }
        for specifier in &record.specifiers {
            if specifier.type_only {
                continue;
            }
            if specifier.kind == ImportSpecifierKind::Namespace || specifier.imported == "*" {
                return DesignSystemImportSelection::All;
            }
            names.insert(specifier.imported.clone());
        }
    }

    DesignSystemImportSelection::Names {
        names: names.into_iter().collect(),
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

    fn collect(source: &str, roots: &[&str], exclude: &[&str]) -> DesignSystemImportSelection {
        collect_design_system_imports([("fixture.tsx", source)], roots, exclude)
    }

    #[test]
    fn named_and_default() {
        assert_eq!(
            collect(
                "import { Button, Card as C } from '@acme/ds'\nimport B from '@acme/ds'",
                &["@acme/ds"],
                &[]
            ),
            DesignSystemImportSelection::Names {
                names: vec!["Button".into(), "Card".into(), "default".into()],
            }
        );
    }

    #[test]
    fn namespace_and_side_effect_are_all() {
        assert_eq!(
            collect("import * as DS from '@acme/ds'", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
        assert_eq!(
            collect("import '@acme/ds'", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    #[test]
    fn export_from_and_export_all() {
        assert_eq!(
            collect(
                "export { Button as Btn } from '@acme/ds'",
                &["@acme/ds"],
                &[]
            ),
            DesignSystemImportSelection::Names {
                names: vec!["Button".into()],
            }
        );
        assert_eq!(
            collect("export * from '@acme/ds'", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
    }

    #[test]
    fn skips_excluded_and_type_only() {
        assert_eq!(
            collect(
                "import { css } from '@acme/ds/css'\nimport type { Button } from '@acme/ds'",
                &["@acme/ds"],
                &["@acme/ds/css"]
            ),
            DesignSystemImportSelection::Names { names: vec![] }
        );
    }

    #[test]
    fn batch_one_scan_two_packages() {
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
        assert_eq!(
            selections,
            vec![
                DesignSystemImportSelection::Names {
                    names: vec!["Button".into()],
                },
                DesignSystemImportSelection::Names {
                    names: vec!["Stack".into()],
                },
            ]
        );
    }

    #[test]
    fn into_load_imports() {
        assert_eq!(DesignSystemImportSelection::All.into_load_imports(), None);
        assert_eq!(
            DesignSystemImportSelection::Names {
                names: vec!["Button".into()]
            }
            .into_load_imports(),
            Some(vec!["Button".into()])
        );
    }

    #[test]
    fn subpath_imports_collect_stem() {
        assert_eq!(
            collect(
                "import Badge from '@acme/ds/badge'\nimport { Panel } from '@acme/ds/panel'",
                &["@acme/ds"],
                &[]
            ),
            DesignSystemImportSelection::Names {
                names: vec![
                    "Panel".into(),
                    "badge".into(),
                    "default".into(),
                    "panel".into(),
                ],
            }
        );
    }

    #[test]
    fn dynamic_import_and_require_are_all() {
        assert_eq!(
            collect("const ds = await import('@acme/ds')", &["@acme/ds"], &[]),
            DesignSystemImportSelection::All
        );
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
            DesignSystemImportSelection::Names { names: vec![] }
        );
    }
}
