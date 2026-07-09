//! Internal css runtime import injection and className merge printing.

use super::plan::{HelperCxMode, TransformHelperFacts};

/// Virtual module for transformed source — mirrors styled-system/css (`cx`, `css`, `cva`, `sva`).
pub const INTERNAL_CSS_MODULE: &str = "@pandacss-internal/css";

/// Host-neutral helper module specifier (resolved by bundler adapters).
pub const CX_HELPER_MODULE: &str = INTERNAL_CSS_MODULE;

/// Local alias injected into transformed source to avoid user `cx` collisions.
pub const CX_HELPER_LOCAL: &str = "__pcx";

/// Local alias for transformed inline `cva()` configs (future styled/cva transforms).
pub const CVA_HELPER_LOCAL: &str = "__pcva";

/// Local alias for transformed inline `sva()` configs.
pub const SVA_HELPER_LOCAL: &str = "__psva";

/// Local alias for transformed `css()` call sites that still need runtime join.
pub const CSS_HELPER_LOCAL: &str = "__pcss";

#[derive(Debug, Clone)]
pub(crate) struct ClassNamePrint {
    pub attribute: String,
    pub needs_cx: bool,
}

pub(crate) fn merge_class_name_fragments(
    helper_cx: HelperCxMode,
    existing_static: Option<&str>,
    existing_dynamic: Option<&str>,
    panda: &str,
) -> ClassNamePrint {
    let panda = panda.trim();
    let mut fragments = Vec::new();

    if let Some(existing) = existing_static.filter(|value| !value.is_empty()) {
        fragments.push(ClassFragment::Static(existing.to_owned()));
    }
    if let Some(expr) = existing_dynamic {
        fragments.push(ClassFragment::Expr(expr.to_owned()));
    }
    if !panda.is_empty() {
        fragments.push(ClassFragment::Static(panda.to_owned()));
    }

    merge_fragments(helper_cx, &fragments)
}

pub(crate) fn merge_class_name_with_expression(
    helper_cx: HelperCxMode,
    existing_static: Option<&str>,
    existing_dynamic: Option<&str>,
    panda_expr: &str,
) -> ClassNamePrint {
    let mut fragments = Vec::new();

    if let Some(existing) = existing_static.filter(|value| !value.is_empty()) {
        fragments.push(ClassFragment::Static(existing.to_owned()));
    }
    if let Some(expr) = existing_dynamic {
        fragments.push(ClassFragment::Expr(expr.to_owned()));
    }
    if !panda_expr.trim().is_empty() {
        fragments.push(ClassFragment::Expr(panda_expr.to_owned()));
    }

    merge_fragments(helper_cx, &fragments)
}

#[derive(Debug, Clone)]
enum ClassFragment {
    Static(String),
    Expr(String),
}

/// Falls back to the `className={"…"}` expression form when the value has a
/// quote/backslash a double-quoted JSX attribute can't hold.
fn class_name_attribute(value: &str) -> String {
    if value.contains('"') || value.contains('\\') {
        format!("className={{{}}}", super::resolve::js_string_literal(value))
    } else {
        format!("className=\"{value}\"")
    }
}

fn merge_fragments(helper_cx: HelperCxMode, fragments: &[ClassFragment]) -> ClassNamePrint {
    if fragments.is_empty() {
        return ClassNamePrint {
            attribute: "className=\"\"".to_owned(),
            needs_cx: false,
        };
    }

    if fragments
        .iter()
        .all(|fragment| matches!(fragment, ClassFragment::Static(_)))
    {
        let value = fragments
            .iter()
            .map(|fragment| match fragment {
                ClassFragment::Static(value) => value.as_str(),
                ClassFragment::Expr(_) => "",
            })
            .collect::<Vec<_>>()
            .join(" ");
        return ClassNamePrint {
            attribute: class_name_attribute(&value),
            needs_cx: false,
        };
    }

    if fragments.len() == 1 {
        return match &fragments[0] {
            ClassFragment::Static(value) => ClassNamePrint {
                attribute: class_name_attribute(value),
                needs_cx: false,
            },
            ClassFragment::Expr(expr) => ClassNamePrint {
                attribute: format!("className={{{expr}}}"),
                needs_cx: false,
            },
        };
    }

    let use_cx = should_use_cx(helper_cx, fragments);
    if use_cx {
        let args = fragments
            .iter()
            .map(|fragment| match fragment {
                ClassFragment::Static(value) => super::resolve::js_string_literal(value),
                ClassFragment::Expr(expr) => expr.clone(),
            })
            .collect::<Vec<_>>()
            .join(", ");
        return ClassNamePrint {
            attribute: format!("className={{{CX_HELPER_LOCAL}({args})}}"),
            needs_cx: true,
        };
    }

    let mut expr = String::new();
    for (index, fragment) in fragments.iter().enumerate() {
        if index > 0 {
            expr.push_str(" + ");
            if let (ClassFragment::Static(_) | ClassFragment::Expr(_), ClassFragment::Expr(_)) =
                (&fragments[index - 1], fragment)
            {
                expr.push_str("\" \" + ");
            }
        }
        match fragment {
            ClassFragment::Static(value) => {
                if index > 0 && matches!(fragments[index - 1], ClassFragment::Expr(_)) {
                    expr.push('"');
                    expr.push(' ');
                    expr.push_str(value);
                    expr.push('"');
                } else {
                    expr.push('"');
                    expr.push_str(value);
                    expr.push('"');
                }
            }
            ClassFragment::Expr(value) => {
                // Parenthesize a ternary so an adjacent `+ " …"` can't bind
                // inside a branch (`a ? b : c + " x"` → `a ? b : (c + " x")`).
                let wrap = value.contains('?');
                if wrap {
                    expr.push('(');
                }
                expr.push_str(value);
                if wrap {
                    expr.push(')');
                }
            }
        }
    }

    ClassNamePrint {
        attribute: format!("className={{{expr}}}"),
        needs_cx: false,
    }
}

fn should_use_cx(helper_cx: HelperCxMode, fragments: &[ClassFragment]) -> bool {
    match helper_cx {
        HelperCxMode::False => false,
        HelperCxMode::True => fragments
            .iter()
            .any(|fragment| matches!(fragment, ClassFragment::Expr(_))),
        HelperCxMode::Auto => {
            let expr_count = fragments
                .iter()
                .filter(|fragment| matches!(fragment, ClassFragment::Expr(_)))
                .count();
            expr_count > 1 || (expr_count == 1 && fragments.len() > 2)
        }
    }
}

pub(crate) fn format_object_class_name(print: &ClassNamePrint) -> String {
    if let Some(inner) = print
        .attribute
        .strip_prefix("className=\"")
        .and_then(|value| value.strip_suffix('"'))
    {
        return format!("className: '{inner}'");
    }
    if let Some(expr) = print
        .attribute
        .strip_prefix("className={")
        .and_then(|value| value.strip_suffix('}'))
    {
        return format!("className: {expr}");
    }
    print.attribute.clone()
}

/// Plan the internal css helper import line for symbols used in `source`.
#[must_use]
#[allow(
    clippy::similar_names,
    reason = "needs_cva/needs_sva mirror TransformHelperFacts fields"
)]
pub(crate) fn plan_internal_css_import_line(
    source: &str,
    helper: &TransformHelperFacts,
    helper_cx: HelperCxMode,
) -> Option<String> {
    let needs_cx = helper_cx != HelperCxMode::False
        && (helper.needs_cx
            || super::imports::local_binding_used(source, CX_HELPER_LOCAL, dead_span()));
    let needs_cva = helper.needs_cva
        || super::imports::local_binding_used(source, CVA_HELPER_LOCAL, dead_span());
    let needs_sva = helper.needs_sva
        || super::imports::local_binding_used(source, SVA_HELPER_LOCAL, dead_span());

    if !needs_cx && !needs_cva && !needs_sva {
        return None;
    }

    let mut specs = Vec::new();
    if needs_cx {
        specs.push(format!("cx as {CX_HELPER_LOCAL}"));
    }
    if needs_cva {
        specs.push(format!("cva as {CVA_HELPER_LOCAL}"));
    }
    if needs_sva {
        specs.push(format!("sva as {SVA_HELPER_LOCAL}"));
    }

    Some(format!(
        "import {{ {} }} from '{INTERNAL_CSS_MODULE}';\n",
        specs.join(", ")
    ))
}

/// Sync the internal css helper import with symbols referenced by transformed source.
#[must_use]
pub fn sync_internal_css_import(
    source: &str,
    path: &str,
    helper: &TransformHelperFacts,
    helper_cx: HelperCxMode,
) -> String {
    super::apply::apply_helper_sync(source, path, helper, helper_cx)
}

fn dead_span() -> pandacss_shared::Span {
    pandacss_shared::Span { start: 0, end: 0 }
}

/// Prepend the internal css helper import for symbols used by transformed source.
#[must_use]
pub fn inject_internal_css_import(source: &str, helper: &TransformHelperFacts) -> String {
    inject_internal_css_import_at(source, "fixture.ts", helper)
}

/// Prepend the internal css helper import using the caller's module path for parsing.
#[must_use]
pub fn inject_internal_css_import_at(
    source: &str,
    path: &str,
    helper: &TransformHelperFacts,
) -> String {
    sync_internal_css_import(source, path, helper, HelperCxMode::Auto)
}

/// Prepend the helper import when a rewrite emitted `__pcx` calls.
#[must_use]
pub fn inject_cx_import(source: &str) -> String {
    inject_internal_css_import(
        source,
        &TransformHelperFacts {
            needs_cx: source.contains(CX_HELPER_LOCAL),
            needs_cva: false,
            needs_sva: false,
        },
    )
}

#[cfg(test)]
mod tests {
    use super::super::plan::HelperCxMode;
    use super::*;

    #[test]
    fn folds_multiple_static_fragments_to_one_literal() {
        let print = merge_class_name_fragments(HelperCxMode::Auto, Some("foo"), None, "bar baz");
        assert_eq!(print.attribute, r#"className="foo bar baz""#);
        assert!(!print.needs_cx);
    }

    #[test]
    fn dynamic_plus_static_uses_inline_concat_in_auto_mode() {
        let print =
            merge_class_name_fragments(HelperCxMode::Auto, None, Some("props.cls"), "color_red");
        assert_eq!(print.attribute, r#"className={props.cls + " color_red"}"#);
        assert!(!print.needs_cx);
    }

    #[test]
    fn two_expressions_use_cx_in_auto_mode() {
        let print = merge_class_name_with_expression(
            HelperCxMode::Auto,
            None,
            Some("props.cls"),
            r#"isError ? "color_red" : "color_blue""#,
        );
        assert_eq!(
            print.attribute,
            r#"className={__pcx(props.cls, isError ? "color_red" : "color_blue")}"#
        );
        assert!(print.needs_cx);
    }

    #[test]
    fn true_mode_uses_cx_for_dynamic_and_static_pair() {
        let print =
            merge_class_name_fragments(HelperCxMode::True, None, Some("props.cls"), "color_red");
        assert_eq!(
            print.attribute,
            r#"className={__pcx(props.cls, "color_red")}"#
        );
        assert!(print.needs_cx);
    }

    #[test]
    fn false_mode_never_emits_cx_even_with_multiple_expressions() {
        let print = merge_class_name_with_expression(
            HelperCxMode::False,
            None,
            Some("props.cls"),
            r#"isError ? "color_red" : "color_blue""#,
        );
        assert!(!print.attribute.contains("__pcx"));
        assert!(!print.needs_cx);
        assert_eq!(
            print.attribute,
            r#"className={props.cls + " " + (isError ? "color_red" : "color_blue")}"#
        );
    }

    #[test]
    fn wraps_trailing_ternary_when_concatenating_after_static() {
        let print = merge_class_name_with_expression(
            HelperCxMode::False,
            Some("foo"),
            None,
            r#"isError ? "color_red" : "color_blue""#,
        );
        assert_eq!(
            print.attribute,
            r#"className={"foo" + " " + (isError ? "color_red" : "color_blue")}"#
        );
    }

    #[test]
    fn remove_internal_css_import_strips_indented_import() {
        let source =
            "    import { cx as __pcx } from '@pandacss-internal/css';\n    export const x = 1;\n";
        let edits = super::super::imports::plan_internal_css_import_removals(source, "fixture.ts");
        let out = super::super::apply::project_edits(source, &edits);
        assert!(!out.contains("@pandacss-internal/css"));
    }

    #[test]
    fn sync_does_not_reinject_when_helper_is_only_in_import_line() {
        let source = "import { cx as __pcx } from '@pandacss-internal/css';\nexport const x = 1;\n";
        let out = sync_internal_css_import(
            source,
            "fixture.ts",
            &TransformHelperFacts::default(),
            HelperCxMode::Auto,
        );
        assert_eq!(out, "export const x = 1;\n");
    }

    #[test]
    fn inject_internal_css_import_merges_required_symbols() {
        let source = "export const button = __pcva({ base: 'color_red' });\n";
        let out = inject_internal_css_import(
            source,
            &TransformHelperFacts {
                needs_cx: false,
                needs_cva: true,
                needs_sva: false,
            },
        );
        assert!(out.starts_with("import { cva as __pcva }"));
        assert!(out.contains("export const button = __pcva"));
    }

    #[test]
    fn inject_cx_import_is_idempotent() {
        let source = "import { cx as __pcx } from '@pandacss-internal/css';\nexport {};\n";
        assert_eq!(inject_cx_import(source), source);
    }

    #[test]
    fn inject_cx_import_prepends_when_missing() {
        let source = "export const x = __pcx('a');\n";
        let out = inject_cx_import(source);
        assert!(out.starts_with("import { cx as __pcx }"));
        assert!(out.contains("export const x = __pcx('a');"));
    }
}
