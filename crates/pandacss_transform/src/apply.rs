//! Apply planned edits with a single `string_wizard::MagicString` pass.

use std::sync::Arc;

use string_wizard::{MagicString, MagicStringOptions, SourceMapOptions};

use super::helper;
use super::imports;
use super::plan::{HelperCxMode, Rewrite, TransformPlan};
use pandacss_extractor::QuotedExpression;
use pandacss_system::System;

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
    system: &System,
    path: &str,
    source: &str,
    plan: &TransformPlan,
    helper_cx: HelperCxMode,
) -> Vec<Edit> {
    let mut edits = Vec::new();
    let quoted = if is_vue(path) {
        pandacss_extractor::vue_quoted_expressions(source)
    } else {
        Vec::new()
    };

    for rewrite in &plan.rewrites {
        edits.push(Edit::Update {
            start: rewrite.start,
            end: rewrite.end,
            content: escape_attribute_quote(&quoted, rewrite.start, &rewrite.content),
        });
    }

    if !plan.bailed && plan.module.symbols_resolved {
        edits.extend(imports::plan_panda_import_edits(
            system,
            path,
            source,
            &plan.module,
            &plan.rewrites,
        ));
    }

    let hoisted = (!plan.hoisted.is_empty()).then(|| {
        plan.hoisted
            .iter()
            .enumerate()
            .fold(String::new(), |mut out, (index, value)| {
                out.push_str("const ");
                out.push_str(&super::plan::hoisted_name(index));
                out.push_str(" = ");
                out.push_str(value);
                out.push_str(";\n");
                out
            })
    });

    let mut import_line = None;
    if plan.module.symbols_resolved || helper_facts_required(&plan.helper) {
        edits.extend(imports::plan_internal_css_import_removals(
            source,
            &plan.module,
        ));
        let helper = helper_facts_with_live_references(&plan.helper, &plan.module, &plan.rewrites);
        import_line = helper::plan_internal_css_import_line(&helper, helper_cx);
    }

    let at = imports::internal_css_import_insertion_point(&plan.module);
    if is_astro(path) {
        let content = [hoisted, import_line]
            .into_iter()
            .flatten()
            .collect::<String>();
        if !content.is_empty() {
            edits.push(Edit::Insert {
                at,
                content: separated_import(source, path, &plan.module, content),
            });
        }
    } else {
        if let Some(content) = hoisted {
            edits.push(Edit::Insert { at, content });
        }
        if let Some(content) = import_line {
            edits.push(Edit::Insert {
                at,
                content: separated_import(source, path, &plan.module, content),
            });
        }
    }

    edits
}

fn is_astro(path: &str) -> bool {
    std::path::Path::new(path)
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("astro"))
}

fn is_vue(path: &str) -> bool {
    std::path::Path::new(path)
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("vue"))
}

fn escape_attribute_quote(quoted: &[QuotedExpression], at: u32, content: &str) -> String {
    let at = at as usize;
    let Some(expr) = quoted.iter().find(|expr| expr.start <= at && at < expr.end) else {
        return content.to_owned();
    };
    let content = content.replace('&', "&amp;");
    if expr.quote == b'"' {
        content.replace('"', "&quot;")
    } else {
        content.replace('\'', "&#39;")
    }
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
    apply_edits(source, "config.ts", edits).0
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
            content: separated_import(source, path, &module, content),
        });
    }
    apply_edits(source, path, &edits).0
}

fn helper_facts_required(helper: &super::plan::TransformHelperFacts) -> bool {
    helper.needs_cx || helper.needs_attach_recipe || helper.needs_memo_recipe
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
        needs_attach_recipe: helper.needs_attach_recipe
            || imports::binding_has_live_reference(module, helper::RECIPE_HELPER_LOCAL, rewrites),
        needs_memo_recipe: helper.needs_memo_recipe
            || imports::binding_has_live_reference(module, helper::MEMO_HELPER_LOCAL, rewrites),
    }
}

fn separated_import(
    source: &str,
    path: &str,
    module: &pandacss_extractor::ModuleFacts,
    content: String,
) -> String {
    let eol = if is_astro(path) && source_uses_crlf(source) {
        "\r\n"
    } else {
        "\n"
    };
    if module.needs_frontmatter {
        return format!("---{eol}{}---{eol}", content.replace('\n', eol));
    }
    let at = usize::try_from(imports::internal_css_import_insertion_point(module))
        .unwrap_or(source.len())
        .min(source.len());
    let content = if eol == "\n" {
        content
    } else {
        content.replace('\n', eol)
    };
    if at == 0
        || source
            .get(..at)
            .is_some_and(|prefix| prefix.ends_with([';', '\n', '\r']))
    {
        content
    } else {
        format!("{eol}{content}")
    }
}

fn source_uses_crlf(source: &str) -> bool {
    source
        .find('\n')
        .is_some_and(|index| index > 0 && source.as_bytes()[index - 1] == b'\r')
}

#[cfg(test)]
mod tests {
    use insta::assert_snapshot;
    use pandacss_extractor::{
        ImportBindingFacts, ImportKind, ImportRecord, ImportSpecifier, ImportSpecifierKind,
        ModuleFacts,
    };
    use pandacss_shared::Span;
    use serde_json::json;

    use super::*;
    use crate::TransformHelperFacts;
    use pandacss_system::System;

    fn test_system() -> System {
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
        .expect("system");
        System::new(config).expect("system")
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
        let system = test_system();
        let source =
            "import { css } from '@panda/css';\nexport const cls = css({ color: 'red' });\n";
        let call_span = Span { start: 51, end: 72 };
        let plan = TransformPlan {
            rewrites: vec![Rewrite {
                start: call_span.start,
                end: call_span.end,
                content: "\"color_red\"".to_owned(),
                preserved: Vec::new(),
                helper: TransformHelperFacts::none(),
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
                local_call_bindings: Vec::new(),
                after_directives: 0,
                needs_frontmatter: false,
                symbols_resolved: false,
            },
            bailed: false,
            hashed_recipe: None,
            hoisted: Vec::new(),
        };

        let edits =
            build_transform_edits(&system, "src/styles.ts", source, &plan, HelperCxMode::Auto);
        let out = project_edits(source, &edits);

        assert_snapshot!(out, @r#"
        import { css } from '@panda/css';
        export const cls "color_red"});
        "#);
    }

    #[test]
    fn unresolved_symbols_still_insert_helper_import_when_plan_requires_it() {
        let system = test_system();
        let source = "export const cls = \"color_red\";\n";
        let plan = TransformPlan {
            rewrites: Vec::new(),
            dependencies: Vec::new(),
            helper: TransformHelperFacts {
                needs_cx: true,
                needs_attach_recipe: false,
                needs_memo_recipe: false,
            },
            module: ModuleFacts {
                imports: Vec::new(),
                import_bindings: Vec::new(),
                local_call_bindings: Vec::new(),
                after_directives: 0,
                needs_frontmatter: false,
                symbols_resolved: false,
            },
            bailed: false,
            hashed_recipe: None,
            hoisted: Vec::new(),
        };

        let edits =
            build_transform_edits(&system, "src/styles.ts", source, &plan, HelperCxMode::Auto);
        let out = project_edits(source, &edits);

        assert_snapshot!(out, @r#"
        import { cx as __pcx } from '@pandacss-internal/css';
        export const cls = "color_red";
        "#);
    }

    fn astro_plan(needs_frontmatter: bool, after_directives: u32) -> TransformPlan {
        TransformPlan {
            rewrites: Vec::new(),
            dependencies: Vec::new(),
            helper: TransformHelperFacts {
                needs_cx: true,
                needs_attach_recipe: false,
                needs_memo_recipe: false,
            },
            module: ModuleFacts {
                imports: Vec::new(),
                import_bindings: Vec::new(),
                local_call_bindings: Vec::new(),
                after_directives,
                needs_frontmatter,
                symbols_resolved: false,
            },
            bailed: false,
            hashed_recipe: None,
            hoisted: vec!["{ a: \"b\" }".to_owned()],
        }
    }

    #[test]
    fn hoisted_declarations_and_helper_share_one_new_astro_frontmatter() {
        let system = test_system();
        let source = "<p class={__ps0.a} />\n";
        let edits = build_transform_edits(
            &system,
            "src/a.astro",
            source,
            &astro_plan(true, 0),
            HelperCxMode::Auto,
        );

        assert_snapshot!(project_edits(source, &edits), @r#"
        ---
        const __ps0 = { a: "b" };
        import { cx as __pcx } from '@pandacss-internal/css';
        ---
        <p class={__ps0.a} />
        "#);
    }

    #[test]
    fn hoisted_declarations_alone_create_one_crlf_astro_frontmatter() {
        let system = test_system();
        let source = "<p class={__ps0.a} />\r\n<b />\r\n";
        let mut plan = astro_plan(true, 0);
        plan.helper = TransformHelperFacts::default();
        let edits =
            build_transform_edits(&system, "src/a.astro", source, &plan, HelperCxMode::Auto);

        assert_eq!(
            project_edits(source, &edits),
            "---\r\nconst __ps0 = { a: \"b\" };\r\n---\r\n<p class={__ps0.a} />\r\n<b />\r\n"
        );
    }

    #[test]
    fn unresolved_symbols_do_not_infer_helper_demand_from_live_references() {
        let system = test_system();
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
                local_call_bindings: Vec::new(),
                after_directives: 0,
                needs_frontmatter: false,
                symbols_resolved: false,
            },
            bailed: false,
            hashed_recipe: None,
            hoisted: Vec::new(),
        };

        let edits =
            build_transform_edits(&system, "src/styles.ts", source, &plan, HelperCxMode::Auto);

        // Without resolved symbols and without plan helper demand, import sync is skipped
        // entirely — including removal of the existing internal import.
        assert!(edits.is_empty());
    }
}
