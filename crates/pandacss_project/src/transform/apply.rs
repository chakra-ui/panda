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

    if !plan.bailed && plan.module.symbols_resolved {
        edits.extend(imports::plan_panda_import_edits(
            project,
            path,
            source,
            &plan.module,
            &rewrites,
        ));
    }

    if plan.module.symbols_resolved || helper_facts_required(&plan.helper) {
        edits.extend(imports::plan_internal_css_import_removals(
            source,
            &plan.module,
        ));
        let helper = helper_facts_with_live_references(&plan.helper, &plan.module, &rewrites);
        if let Some(content) = helper::plan_internal_css_import_line(&helper, helper_cx) {
            edits.push(Edit::Insert {
                at: imports::internal_css_import_insertion_point(&plan.module),
                content: separated_import(source, &plan.module, content),
            });
        }
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

/// Project edits onto a copy of `source` (no source map).
#[must_use]
#[cfg(test)]
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
    let module = pandacss_extractor::analyze_module(source, path);
    let mut edits = imports::plan_internal_css_import_removals(source, &module);
    let helper = helper_facts_with_live_references(helper, &module, &[]);
    if let Some(content) = helper::plan_internal_css_import_line(&helper, helper_cx) {
        edits.push(Edit::Insert {
            at: imports::internal_css_import_insertion_point(&module),
            content: separated_import(source, &module, content),
        });
    }
    apply_edits(source, path, &edits).0
}

fn helper_facts_required(helper: &super::plan::TransformHelperFacts) -> bool {
    helper.needs_cx || helper.needs_cva || helper.needs_sva
}

fn helper_facts_with_live_references(
    helper: &super::plan::TransformHelperFacts,
    module: &pandacss_extractor::ModuleFacts,
    rewrites: &[Rewrite],
) -> super::plan::TransformHelperFacts {
    if !module.symbols_resolved {
        return helper.clone();
    }

    super::plan::TransformHelperFacts {
        needs_cx: helper.needs_cx
            || imports::binding_has_live_reference(module, helper::CX_HELPER_LOCAL, rewrites),
        needs_cva: helper.needs_cva
            || imports::binding_has_live_reference(module, helper::CVA_HELPER_LOCAL, rewrites),
        needs_sva: helper.needs_sva
            || imports::binding_has_live_reference(module, helper::SVA_HELPER_LOCAL, rewrites),
    }
}

fn separated_import(
    source: &str,
    module: &pandacss_extractor::ModuleFacts,
    content: String,
) -> String {
    let at = usize::try_from(imports::internal_css_import_insertion_point(module))
        .unwrap_or(source.len())
        .min(source.len());
    if at == 0
        || source
            .get(..at)
            .is_some_and(|prefix| prefix.ends_with([';', '\n', '\r']))
    {
        content
    } else {
        format!("\n{content}")
    }
}

#[cfg(test)]
mod tests {
    use pandacss_extractor::{
        ImportBindingFacts, ImportKind, ImportRecord, ImportSpecifier, ImportSpecifierKind,
        ModuleFacts,
    };
    use pandacss_shared::Span;
    use serde_json::json;

    use super::*;
    use crate::{Project, System, TransformHelperFacts};

    fn test_project() -> Project {
        let config: pandacss_config::UserConfig = serde_json::from_value(json!({
            "outdir": "styled-system",
            "importMap": {
                "css": ["@panda/css"],
                "recipe": ["@panda/recipes"],
                "pattern": ["@panda/patterns"],
                "jsx": ["@panda/jsx"],
                "tokens": ["@panda/tokens"]
            }
        }))
        .expect("config");
        Project::new(System::new(config).expect("system"))
    }

    fn css_import_record() -> ImportRecord {
        ImportRecord {
            module: "@panda/css".to_owned(),
            kind: ImportKind::Value,
            type_only: false,
            specifiers: vec![ImportSpecifier {
                kind: ImportSpecifierKind::Named,
                imported: "css".to_owned(),
                local: "css".to_owned(),
                type_only: false,
                span: Span { start: 9, end: 12 },
            }],
            span: Span { start: 0, end: 32 },
        }
    }

    #[test]
    fn unresolved_symbols_skip_dead_import_cleanup_even_when_rewrites_cover_refs() {
        let project = test_project();
        let source =
            "import { css } from '@panda/css';\nexport const cls = css({ color: 'red' });\n";
        let call_span = Span { start: 51, end: 72 };
        let plan = TransformPlan {
            rewrites: vec![Rewrite {
                start: call_span.start,
                end: call_span.end,
                content: "\"color_red\"".to_owned(),
                preserved: Vec::new(),
            }],
            dependencies: Vec::new(),
            helper: TransformHelperFacts::default(),
            module: ModuleFacts {
                imports: vec![css_import_record()],
                import_bindings: vec![ImportBindingFacts {
                    local: "css".to_owned(),
                    references: vec![Span {
                        start: call_span.start,
                        end: call_span.start + 3,
                    }],
                }],
                after_directives: 0,
                symbols_resolved: false,
            },
            bailed: false,
        };

        let edits =
            build_transform_edits(&project, "src/styles.ts", source, &plan, HelperCxMode::Auto);
        let out = project_edits(source, &edits);

        assert!(out.contains("import { css } from '@panda/css';"));
        assert!(out.contains("\"color_red\""));
    }

    #[test]
    fn unresolved_symbols_still_insert_helper_import_when_plan_requires_it() {
        let project = test_project();
        let source = "export const cls = \"color_red\";\n";
        let plan = TransformPlan {
            rewrites: Vec::new(),
            dependencies: Vec::new(),
            helper: TransformHelperFacts {
                needs_cx: true,
                needs_cva: false,
                needs_sva: false,
            },
            module: ModuleFacts {
                imports: Vec::new(),
                import_bindings: Vec::new(),
                after_directives: 0,
                symbols_resolved: false,
            },
            bailed: false,
        };

        let edits =
            build_transform_edits(&project, "src/styles.ts", source, &plan, HelperCxMode::Auto);
        let out = project_edits(source, &edits);

        assert!(out.contains("import { cx as __pcx } from '@pandacss-internal/css';"));
    }

    #[test]
    fn unresolved_symbols_do_not_infer_helper_demand_from_live_references() {
        let project = test_project();
        let source = concat!(
            "import { cx as __pcx } from '@pandacss-internal/css';\n",
            "export const cls = __pcx('a', 'b');\n",
        );
        let plan = TransformPlan {
            rewrites: Vec::new(),
            dependencies: Vec::new(),
            helper: TransformHelperFacts::default(),
            module: ModuleFacts {
                imports: vec![ImportRecord {
                    module: helper::INTERNAL_CSS_MODULE.to_owned(),
                    kind: ImportKind::Value,
                    type_only: false,
                    specifiers: vec![ImportSpecifier {
                        kind: ImportSpecifierKind::Named,
                        imported: "cx".to_owned(),
                        local: helper::CX_HELPER_LOCAL.to_owned(),
                        type_only: false,
                        span: Span { start: 9, end: 20 },
                    }],
                    span: Span { start: 0, end: 52 },
                }],
                import_bindings: vec![ImportBindingFacts {
                    local: helper::CX_HELPER_LOCAL.to_owned(),
                    references: vec![Span { start: 72, end: 77 }],
                }],
                after_directives: 0,
                symbols_resolved: false,
            },
            bailed: false,
        };

        let edits =
            build_transform_edits(&project, "src/styles.ts", source, &plan, HelperCxMode::Auto);

        // Without resolved symbols and without plan helper demand, import sync is skipped
        // entirely — including removal of the existing internal import.
        assert!(edits.is_empty());
    }
}
