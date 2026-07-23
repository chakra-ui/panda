//! Dead Panda import cleanup after rewrites are applied.

use crate::Project;
use pandacss_extractor::{
    ImportKind, ImportRecord, ImportSpecifier, ImportSpecifierKind, ModuleFacts,
};
use pandacss_shared::Span;

use super::apply::Edit;
use super::helper::INTERNAL_CSS_MODULE;
use super::plan::Rewrite;

/// Plan remove/narrow edits for Panda imports whose bindings are unused in `usage_source`.
#[must_use]
pub(crate) fn plan_panda_import_edits(
    project: &Project,
    path: &str,
    source: &str,
    module: &ModuleFacts,
    rewrites: &[Rewrite],
) -> Vec<Edit> {
    let config = project.config().extractor_config();
    let matchers = &config.matchers;
    if !matchers.has_module_matchers() {
        return Vec::new();
    }

    let file_path = std::path::Path::new(path);
    let mut edits = Vec::new();

    for record in &module.imports {
        if record.type_only {
            continue;
        }
        let is_panda = matchers.record_is_panda_import(record, |specifier| {
            config
                .cross_file
                .as_ref()
                .and_then(|resolver| resolver.resolve_path(file_path, specifier))
                .map(|resolved| resolved.to_string_lossy().into_owned())
        });
        if !is_panda {
            continue;
        }
        if let ImportKind::Value = record.kind
            && let Some(edit) = plan_import_edit(source, module, rewrites, record)
        {
            edits.push(edit);
        }
    }

    edits
}

/// Plan removal of any existing `@pandacss-internal/css` import lines.
#[must_use]
pub(crate) fn plan_internal_css_import_removals(source: &str, module: &ModuleFacts) -> Vec<Edit> {
    module
        .imports
        .iter()
        .filter(|record| record.module == INTERNAL_CSS_MODULE)
        .map(|record| import_line_remove(source, record.span))
        .collect()
}

/// Insertion point for a helper value import: after shebang/directive prologue,
/// before the first non-internal import when one exists.
#[must_use]
pub(crate) fn internal_css_import_insertion_point(module: &ModuleFacts) -> u32 {
    if let Some(record) = module
        .imports
        .iter()
        .find(|record| record.module != INTERNAL_CSS_MODULE)
    {
        return record.span.start;
    }

    module.after_directives
}

fn plan_import_edit(
    source: &str,
    module: &ModuleFacts,
    rewrites: &[Rewrite],
    record: &ImportRecord,
) -> Option<Edit> {
    let live_specifiers: Vec<&ImportSpecifier> = record
        .specifiers
        .iter()
        .filter(|specifier| {
            specifier.type_only || !binding_was_consumed(module, &specifier.local, rewrites)
        })
        .collect();

    if live_specifiers.len() == record.specifiers.len() {
        return None;
    }

    let (start, end) = import_line_range(source, record.span);
    if live_specifiers.is_empty() {
        return Some(Edit::Remove { start, end });
    }

    Some(Edit::Update {
        start,
        end,
        content: format_import(record, &live_specifiers),
    })
}

fn import_line_remove(source: &str, span: Span) -> Edit {
    let (start, end) = import_line_range(source, span);
    Edit::Remove { start, end }
}

fn import_line_range(source: &str, span: Span) -> (u32, u32) {
    let start = u32::try_from(usize::try_from(span.start).unwrap_or(0)).unwrap_or(0);
    let mut end = usize::try_from(span.end)
        .unwrap_or(source.len())
        .min(source.len());
    if end < source.len() && source.as_bytes().get(end) == Some(&b';') {
        end += 1;
    }
    if end < source.len() && source.as_bytes().get(end) == Some(&b'\n') {
        end += 1;
    }
    (start, u32::try_from(end).unwrap_or(start))
}

fn format_import(record: &ImportRecord, specifiers: &[&ImportSpecifier]) -> String {
    let kind = if record.type_only {
        "import type"
    } else {
        "import"
    };
    let default = specifiers
        .iter()
        .find(|specifier| specifier.kind == ImportSpecifierKind::Default)
        .map(|specifier| specifier.local.as_str());
    let namespace = specifiers
        .iter()
        .find(|specifier| specifier.kind == ImportSpecifierKind::Namespace)
        .map(|specifier| specifier.local.as_str());
    let named = specifiers
        .iter()
        .filter(|specifier| specifier.kind == ImportSpecifierKind::Named)
        .map(|specifier| format_named_specifier(specifier))
        .collect::<Vec<_>>();

    let mut head = Vec::new();
    if let Some(default) = default {
        head.push(default.to_owned());
    }
    if let Some(namespace) = namespace {
        head.push(format!("* as {namespace}"));
    }
    if !named.is_empty() {
        head.push(format!("{{ {} }}", named.join(", ")));
    }

    if head.is_empty() {
        format!("{kind} '{}';\n", record.module)
    } else {
        format!("{kind} {} from '{}';\n", head.join(", "), record.module)
    }
}

fn format_named_specifier(specifier: &ImportSpecifier) -> String {
    if specifier.imported == specifier.local {
        if specifier.type_only {
            format!("type {}", specifier.local)
        } else {
            specifier.local.clone()
        }
    } else if specifier.type_only {
        format!("type {} as {}", specifier.imported, specifier.local)
    } else {
        format!("{} as {}", specifier.imported, specifier.local)
    }
}

pub(crate) fn binding_has_live_reference(
    module: &ModuleFacts,
    local: &str,
    rewrites: &[Rewrite],
) -> bool {
    if !module.symbols_resolved {
        return true;
    }
    module
        .import_bindings
        .iter()
        .find(|binding| binding.local == local)
        .is_some_and(|binding| {
            binding.references.iter().any(|reference| {
                rewrites.iter().all(|rewrite| {
                    let covered = rewrite.start <= reference.start && rewrite.end >= reference.end;
                    let preserved = rewrite
                        .preserved
                        .iter()
                        .any(|span| span.start <= reference.start && span.end >= reference.end);
                    !covered || preserved
                })
            })
        })
}

fn binding_was_consumed(module: &ModuleFacts, local: &str, rewrites: &[Rewrite]) -> bool {
    if !module.symbols_resolved {
        return false;
    }
    module
        .import_bindings
        .iter()
        .find(|binding| binding.local == local)
        .is_some_and(|binding| {
            !binding.references.is_empty()
                && binding.references.iter().all(|reference| {
                    rewrites.iter().any(|rewrite| {
                        let covered =
                            rewrite.start <= reference.start && rewrite.end >= reference.end;
                        let preserved = rewrite
                            .preserved
                            .iter()
                            .any(|span| span.start <= reference.start && span.end >= reference.end);
                        covered && !preserved
                    })
                })
        })
}

#[cfg(test)]
mod tests {
    use pandacss_extractor::ImportBindingFacts;

    use super::*;

    fn specifier(kind: ImportSpecifierKind, imported: &str, local: &str) -> ImportSpecifier {
        ImportSpecifier {
            kind,
            imported: imported.to_owned(),
            local: local.to_owned(),
            type_only: false,
            span: Span { start: 0, end: 0 },
        }
    }

    fn module_with_css_binding(symbols_resolved: bool) -> ModuleFacts {
        ModuleFacts {
            imports: vec![ImportRecord {
                module: "@panda/css".to_owned(),
                kind: ImportKind::Value,
                type_only: false,
                specifiers: vec![specifier(ImportSpecifierKind::Named, "css", "css")],
                span: Span { start: 0, end: 32 },
            }],
            import_bindings: vec![ImportBindingFacts {
                local: "css".to_owned(),
                references: vec![Span { start: 50, end: 53 }],
            }],
            after_directives: 0,
            symbols_resolved,
        }
    }

    #[test]
    fn unresolved_symbols_never_mark_a_binding_as_consumed() {
        let module = module_with_css_binding(false);
        let rewrites = [Rewrite {
            start: 50,
            end: 80,
            content: "\"color_red\"".to_owned(),
            preserved: Vec::new(),
        }];

        assert!(!binding_was_consumed(&module, "css", &rewrites));
        assert!(binding_has_live_reference(&module, "css", &rewrites));
    }

    #[test]
    fn resolved_symbols_treat_fully_covered_references_as_consumed() {
        let module = module_with_css_binding(true);
        let rewrites = [Rewrite {
            start: 50,
            end: 80,
            content: "\"color_red\"".to_owned(),
            preserved: Vec::new(),
        }];

        assert!(binding_was_consumed(&module, "css", &rewrites));
        assert!(!binding_has_live_reference(&module, "css", &rewrites));
    }

    #[test]
    fn formats_default_only_import_without_named_braces() {
        let record = ImportRecord {
            module: "@panda/css".to_owned(),
            kind: ImportKind::Value,
            type_only: false,
            specifiers: vec![specifier(ImportSpecifierKind::Default, "default", "css")],
            span: Span { start: 0, end: 0 },
        };
        let specifiers = vec![&record.specifiers[0]];

        assert_eq!(
            format_import(&record, &specifiers),
            "import css from '@panda/css';\n"
        );
    }

    #[test]
    fn formats_default_and_named_import_without_invalid_syntax() {
        let record = ImportRecord {
            module: "@panda/css".to_owned(),
            kind: ImportKind::Value,
            type_only: false,
            specifiers: vec![
                specifier(ImportSpecifierKind::Default, "default", "css"),
                specifier(ImportSpecifierKind::Named, "cva", "cva"),
            ],
            span: Span { start: 0, end: 0 },
        };
        let specifiers = vec![&record.specifiers[0], &record.specifiers[1]];

        assert_eq!(
            format_import(&record, &specifiers),
            "import css, { cva } from '@panda/css';\n"
        );
    }
}
