//! Apply planned edits with a single `string_wizard::MagicString` pass.

use std::sync::Arc;

use string_wizard::{MagicString, MagicStringOptions, SourceMapOptions};

use super::helper;
use super::imports;
use super::plan::{HelperCxMode, Rewrite, TransformPlan};
use crate::Project;

/// One edit recorded against the original source indices.
#[derive(Debug, Clone)]
pub(crate) enum Edit {
    Update {
        start: u32,
        end: u32,
        content: String,
    },
    Remove {
        start: u32,
        end: u32,
    },
    Insert {
        at: u32,
        content: String,
    },
}

#[must_use]
pub(crate) fn build_transform_edits(
    project: &Project,
    path: &str,
    source: &str,
    plan: &TransformPlan,
    helper_cx: HelperCxMode,
) -> Vec<Edit> {
    let mut edits = Vec::new();

    let rewrites = dedup_overlapping_rewrites(&plan.rewrites);
    for rewrite in &rewrites {
        edits.push(Edit::Update {
            start: rewrite.start,
            end: rewrite.end,
            content: rewrite.content.clone(),
        });
    }

    let projected = project_rewrites(source, &rewrites);

    if !plan.bailed {
        edits.extend(imports::plan_panda_import_edits(
            project,
            path,
            source,
            projected.as_str(),
        ));
    }

    edits.extend(imports::plan_internal_css_import_removals(source, path));

    let analysis_source = imports::source_without_internal_css_import(projected.as_str(), path);
    if let Some(content) =
        helper::plan_internal_css_import_line(&analysis_source, &plan.helper, helper_cx)
    {
        edits.push(Edit::Insert {
            at: imports::internal_css_import_insertion_point(source, path),
            content,
        });
    }

    edits
}

/// Drops rewrites overlapping an earlier, wider one — `MagicString` silently
/// discards overlapping edits. Keeps the outermost; a nested site stays as-is
/// inside the outer rewrite's output.
fn dedup_overlapping_rewrites(rewrites: &[Rewrite]) -> Vec<Rewrite> {
    let mut sorted: Vec<&Rewrite> = rewrites.iter().collect();
    sorted.sort_by(|a, b| a.start.cmp(&b.start).then(b.end.cmp(&a.end)));
    let mut kept: Vec<Rewrite> = Vec::new();
    let mut covered_end = 0u32;
    for rewrite in sorted {
        if rewrite.start < covered_end {
            continue;
        }
        covered_end = rewrite.end;
        kept.push(rewrite.clone());
    }
    kept
}

/// Apply edits and emit transformed code plus an optional source map JSON string.
#[must_use]
pub(crate) fn apply_edits(source: &str, path: &str, edits: &[Edit]) -> (String, Option<String>) {
    if edits.is_empty() {
        return (source.to_owned(), None);
    }

    let mut magic_string = MagicString::with_options(
        source,
        MagicStringOptions {
            filename: Some(path.to_owned()),
            ..Default::default()
        },
    );

    for edit in edits {
        match edit {
            Edit::Update {
                start,
                end,
                content,
            } => {
                let _ = magic_string.update(*start, *end, content.as_str());
            }
            Edit::Remove { start, end } => {
                let _ = magic_string.remove(*start, *end);
            }
            Edit::Insert { at, content } => {
                magic_string.append_left(*at, content.as_str());
            }
        }
    }

    if !magic_string.has_changed() {
        return (source.to_owned(), None);
    }

    let code = magic_string.to_string();
    let map = magic_string
        .source_map(SourceMapOptions {
            include_content: true,
            source: Arc::from(path),
            ..Default::default()
        })
        .to_json_string();

    (code, Some(map))
}

/// Project rewrites onto a copy of `source` for post-transform binding analysis.
#[must_use]
pub(crate) fn project_rewrites(source: &str, rewrites: &[Rewrite]) -> String {
    if rewrites.is_empty() {
        return source.to_owned();
    }

    let mut ordered = rewrites.to_vec();
    ordered.sort_by(|left, right| right.start.cmp(&left.start));

    let mut out = source.to_owned();
    for rewrite in ordered {
        let start = usize::try_from(rewrite.start).unwrap_or(out.len());
        let end = usize::try_from(rewrite.end).unwrap_or(out.len());
        if start > end || end > out.len() {
            continue;
        }
        out.replace_range(start..end, &rewrite.content);
    }
    out
}

/// Project edits onto a copy of `source` (no source map).
#[must_use]
pub(crate) fn project_edits(source: &str, edits: &[Edit]) -> String {
    apply_edits(source, "project.ts", edits).0
}

/// Apply helper-only import sync without target rewrites.
#[must_use]
pub(crate) fn apply_helper_sync(
    source: &str,
    path: &str,
    helper: &super::plan::TransformHelperFacts,
    helper_cx: HelperCxMode,
) -> String {
    let mut edits = imports::plan_internal_css_import_removals(source, path);
    let analysis = imports::source_without_internal_css_import(source, path);
    if let Some(content) = helper::plan_internal_css_import_line(&analysis, helper, helper_cx) {
        edits.push(Edit::Insert {
            at: imports::internal_css_import_insertion_point(source, path),
            content,
        });
    }
    apply_edits(source, path, &edits).0
}
