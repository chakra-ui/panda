//! Dead Panda import cleanup after rewrites are applied.

use crate::Project;
use pandacss_extractor::{
    ImportKind, ImportRecord, ImportSpecifier, ImportSpecifierKind, scan_imports,
};
use pandacss_shared::Span;

use super::apply::Edit;
use super::helper::INTERNAL_CSS_MODULE;

/// Plan remove/narrow edits for Panda imports whose bindings are unused in `usage_source`.
#[must_use]
pub(crate) fn plan_panda_import_edits(
    project: &Project,
    path: &str,
    source: &str,
    usage_source: &str,
) -> Vec<Edit> {
    let modules = panda_modules(project);
    if modules.is_empty() {
        return Vec::new();
    }

    let scan = scan_imports(source, path);
    let mut edits = Vec::new();

    for record in &scan.imports {
        if record.type_only || !is_panda_module(&modules, &record.module) {
            continue;
        }
        if let ImportKind::Value = record.kind
            && let Some(edit) = plan_import_edit(source, usage_source, record)
        {
            edits.push(edit);
        }
    }

    edits
}

/// Plan removal of any existing `@pandacss-internal/css` import lines.
#[must_use]
pub(crate) fn plan_internal_css_import_removals(source: &str, path: &str) -> Vec<Edit> {
    let scan = scan_imports(source, path);
    scan.imports
        .into_iter()
        .filter(|record| record.module == INTERNAL_CSS_MODULE)
        .map(|record| import_line_remove(source, record.span))
        .collect()
}

/// Strip internal css imports from `source` for helper binding analysis.
#[must_use]
pub(crate) fn source_without_internal_css_import(source: &str, path: &str) -> String {
    let edits = plan_internal_css_import_removals(source, path);
    super::apply::project_edits(source, &edits)
}

/// Insertion point for a helper value import: after shebang/directive prologue,
/// before the first non-internal import when one exists.
#[must_use]
pub(crate) fn internal_css_import_insertion_point(source: &str, path: &str) -> u32 {
    let scan = scan_imports(source, path);
    if let Some(record) = scan
        .imports
        .iter()
        .find(|record| record.module != INTERNAL_CSS_MODULE)
    {
        return record.span.start;
    }

    u32::try_from(directive_prologue_end(source)).unwrap_or(0)
}

fn plan_import_edit(source: &str, usage_source: &str, record: &ImportRecord) -> Option<Edit> {
    let live_specifiers: Vec<&ImportSpecifier> = record
        .specifiers
        .iter()
        .filter(|specifier| {
            specifier.type_only || local_binding_used(usage_source, &specifier.local, record.span)
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

fn panda_modules(project: &Project) -> Vec<String> {
    let config = project.config().extractor_config();
    let matchers = &config.matchers;
    let mut modules = Vec::new();
    modules.extend(matchers.css.modules.iter().cloned());
    modules.extend(matchers.recipe.modules.iter().cloned());
    modules.extend(matchers.pattern.modules.iter().cloned());
    if let Some(jsx) = &matchers.jsx {
        modules.extend(jsx.modules.iter().cloned());
    }
    modules.extend(matchers.tokens.modules.iter().cloned());
    modules.sort();
    modules.dedup();
    modules
}

fn is_panda_module(modules: &[String], module: &str) -> bool {
    modules.iter().any(|candidate| candidate == module)
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

pub(crate) fn local_binding_used(source: &str, local: &str, import_span: Span) -> bool {
    if local.is_empty() {
        return true;
    }

    let skip_start = usize::try_from(import_span.start).unwrap_or(0);
    let skip_end = usize::try_from(import_span.end)
        .unwrap_or(source.len())
        .min(source.len());
    let local_len = local.len();
    let mut index = 0usize;

    while index + local_len <= source.len() {
        if &source[index..index + local_len] != local {
            index += 1;
            continue;
        }

        let overlaps_import = index < skip_end && index + local_len > skip_start;
        if !overlaps_import && identifier_boundary(source, index, index + local_len) {
            return true;
        }
        index += 1;
    }

    false
}

fn identifier_boundary(source: &str, start: usize, end: usize) -> bool {
    let before_ok = start == 0
        || source
            .get(..start)
            .and_then(|prefix| prefix.chars().next_back())
            .is_none_or(|ch| !is_identifier_part(ch));
    let after_ok = end >= source.len()
        || source
            .get(end..)
            .and_then(|suffix| suffix.chars().next())
            .is_none_or(|ch| !is_identifier_part(ch));
    before_ok && after_ok
}

fn is_identifier_part(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_' || ch == '$'
}

fn directive_prologue_end(source: &str) -> usize {
    let mut index = skip_bom_and_shebang(source);

    loop {
        let stmt_start = skip_whitespace_and_comments(source, index);
        if stmt_start >= source.len() {
            return index;
        }

        let Some(after_directive) = directive_statement_end(source, stmt_start) else {
            return index;
        };

        index = after_directive;
    }
}

fn skip_bom_and_shebang(source: &str) -> usize {
    let mut index = source
        .strip_prefix('\u{feff}')
        .map_or(0, |rest| source.len() - rest.len());
    if source
        .get(index..)
        .is_some_and(|rest| rest.starts_with("#!"))
    {
        index = source[index..]
            .find('\n')
            .map_or(source.len(), |offset| index + offset + 1);
    }
    index
}

fn skip_whitespace_and_comments(source: &str, mut index: usize) -> usize {
    while index < source.len() {
        let Some(rest) = source.get(index..) else {
            break;
        };

        if rest.starts_with("//") {
            index = rest
                .find('\n')
                .map_or(source.len(), |offset| index + offset + 1);
            continue;
        }
        if rest.starts_with("/*") {
            index = rest
                .find("*/")
                .map_or(source.len(), |offset| index + offset + 2);
            continue;
        }

        let Some(ch) = rest.chars().next() else {
            break;
        };
        if ch.is_whitespace() {
            index += ch.len_utf8();
            continue;
        }

        break;
    }

    index
}

fn directive_statement_end(source: &str, start: usize) -> Option<usize> {
    let quote = source.get(start..)?.chars().next()?;
    if quote != '"' && quote != '\'' {
        return None;
    }

    let mut index = start + quote.len_utf8();
    let mut escaped = false;
    while index < source.len() {
        let ch = source.get(index..)?.chars().next()?;
        index += ch.len_utf8();

        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == quote {
            break;
        }
        if ch == '\n' || ch == '\r' {
            return None;
        }
    }

    let line_end = source
        .get(index..)?
        .find(['\n', '\r'])
        .map_or(source.len(), |offset| index + offset);
    let trailing = source.get(index..line_end)?.trim_start();
    if !(trailing.is_empty()
        || trailing == ";"
        || trailing.starts_with("//")
        || trailing.starts_with("; //")
        || trailing.starts_with("/*")
        || trailing.starts_with(";/*")
        || trailing.starts_with("; /*"))
    {
        return None;
    }

    Some(line_terminator_end(source, line_end))
}

fn line_terminator_end(source: &str, line_end: usize) -> usize {
    let Some(rest) = source.get(line_end..) else {
        return line_end;
    };
    if rest.starts_with("\r\n") {
        line_end + 2
    } else if rest.starts_with('\n') || rest.starts_with('\r') {
        line_end + 1
    } else {
        line_end
    }
}

#[cfg(test)]
mod tests {
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
