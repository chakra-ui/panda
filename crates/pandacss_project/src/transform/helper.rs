//! Internal css runtime import injection and className merge printing.

use pandacss_extractor::ExpressionKind;

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
    pub expression: String,
    pub ternary: Option<ClassNameTernary>,
    pub needs_cx: bool,
}

#[derive(Debug, Clone)]
pub(crate) struct ClassNameTernary {
    pub condition: String,
    pub consequent: String,
    pub alternate: String,
}

#[derive(Debug, Clone, Copy, Default)]
pub(crate) struct ExistingClassName<'a> {
    pub static_value: Option<&'a str>,
    pub dynamic_value: Option<&'a str>,
    pub dynamic_kind: Option<ExpressionKind>,
    /// Byte offset before the Oxc-located array expression's closing bracket.
    pub dynamic_array_insert: Option<usize>,
    pub dynamic_array_has_elements: bool,
    pub dynamic_parenthesize: bool,
}

pub(crate) fn merge_class_name_fragments(
    class_attr: &str,
    helper_cx: HelperCxMode,
    existing: ExistingClassName<'_>,
    panda: &str,
) -> ClassNamePrint {
    let panda = panda.trim();
    if let Some(dynamic) = existing.dynamic_value
        && !panda.is_empty()
        && let Some(merged) = merge_into_literal_class_expression(
            dynamic,
            &super::resolve::js_string_literal(panda),
            existing.dynamic_kind,
            existing.dynamic_array_insert,
            existing.dynamic_array_has_elements,
        )
    {
        return ClassNamePrint {
            attribute: format!("{class_attr}={{{merged}}}"),
            expression: merged,
            ternary: None,
            needs_cx: false,
        };
    }
    let mut fragments = existing_class_name_fragments(existing);
    if !panda.is_empty() {
        fragments.push(ClassFragment::Static(panda.to_owned()));
    }
    merge_fragments(class_attr, helper_cx, &fragments)
}

pub(crate) fn merge_class_name_with_expression(
    class_attr: &str,
    helper_cx: HelperCxMode,
    existing: ExistingClassName<'_>,
    panda_expr: &str,
    panda_expr_parenthesize: bool,
) -> ClassNamePrint {
    let panda_expr = panda_expr.trim();
    if let Some(dynamic) = existing.dynamic_value
        && !panda_expr.is_empty()
        && let Some(merged) = merge_into_literal_class_expression(
            dynamic,
            panda_expr,
            existing.dynamic_kind,
            existing.dynamic_array_insert,
            existing.dynamic_array_has_elements,
        )
    {
        return ClassNamePrint {
            attribute: format!("{class_attr}={{{merged}}}"),
            expression: merged,
            ternary: None,
            needs_cx: false,
        };
    }
    let mut fragments = existing_class_name_fragments(existing);
    if !panda_expr.is_empty() {
        fragments.push(ClassFragment::Expr {
            value: panda_expr.to_owned(),
            parenthesize: panda_expr_parenthesize,
        });
    }
    merge_fragments(class_attr, helper_cx, &fragments)
}

/// Appends the resolved Panda piece into an existing array/record class
/// expression instead of string-concatenating something that isn't a string
/// at runtime.
fn merge_into_literal_class_expression(
    existing: &str,
    new_element: &str,
    kind: Option<ExpressionKind>,
    array_insert: Option<usize>,
    array_has_elements: bool,
) -> Option<String> {
    match kind {
        Some(ExpressionKind::Array) => {
            let insert = array_insert?;
            let (head, tail) = existing.split_at_checked(insert)?;
            let separator = if array_has_elements { ", " } else { "" };
            Some(format!("{head}{separator}{new_element}{tail}"))
        }
        Some(ExpressionKind::Object) => Some(format!("[{existing}, {new_element}]")),
        _ => None,
    }
}

/// The pre-existing `className` split into fragments. The two callers differ
/// only in how they classify the *new* Panda-generated piece.
fn existing_class_name_fragments(existing: ExistingClassName<'_>) -> Vec<ClassFragment> {
    let mut fragments = Vec::new();
    if let Some(value) = existing.static_value.filter(|value| !value.is_empty()) {
        fragments.push(ClassFragment::Static(value.to_owned()));
    }
    if let Some(expr) = existing.dynamic_value {
        fragments.push(ClassFragment::Expr {
            value: expr.to_owned(),
            parenthesize: existing.dynamic_parenthesize,
        });
    }
    fragments
}

#[derive(Debug, Clone)]
enum ClassFragment {
    Static(String),
    Expr { value: String, parenthesize: bool },
}

/// Falls back to the `className={"…"}` expression form when the value has a
/// quote/backslash a double-quoted JSX attribute can't hold.
fn class_name_attribute(class_attr: &str, value: &str) -> String {
    if value.contains(['"', '\\', '\n', '\r']) {
        format!(
            "{class_attr}={{{}}}",
            super::resolve::js_string_literal(value)
        )
    } else {
        format!("{class_attr}=\"{value}\"")
    }
}

fn static_class_expression(value: &str) -> String {
    if value.contains(['\'', '"', '\\', '\n', '\r']) {
        super::resolve::js_string_literal(value)
    } else {
        format!("'{value}'")
    }
}

fn merge_fragments(
    class_attr: &str,
    helper_cx: HelperCxMode,
    fragments: &[ClassFragment],
) -> ClassNamePrint {
    if fragments.is_empty() {
        return ClassNamePrint {
            attribute: format!("{class_attr}=\"\""),
            expression: "\"\"".to_owned(),
            ternary: None,
            needs_cx: false,
        };
    }

    if fragments
        .iter()
        .all(|fragment| matches!(fragment, ClassFragment::Static(_)))
    {
        return print_static_fragments(class_attr, fragments);
    }

    if fragments.len() == 1 {
        return print_single_fragment(class_attr, &fragments[0]);
    }

    if should_use_cx(helper_cx, fragments) {
        return print_cx_fragments(class_attr, fragments);
    }

    print_concatenated_fragments(class_attr, fragments)
}

fn print_static_fragments(class_attr: &str, fragments: &[ClassFragment]) -> ClassNamePrint {
    let value = fragments
        .iter()
        .filter_map(|fragment| match fragment {
            ClassFragment::Static(value) => Some(value.as_str()),
            ClassFragment::Expr { .. } => None,
        })
        .collect::<Vec<_>>()
        .join(" ");
    ClassNamePrint {
        attribute: class_name_attribute(class_attr, &value),
        expression: static_class_expression(&value),
        ternary: None,
        needs_cx: false,
    }
}

fn print_single_fragment(class_attr: &str, fragment: &ClassFragment) -> ClassNamePrint {
    match fragment {
        ClassFragment::Static(value) => ClassNamePrint {
            attribute: class_name_attribute(class_attr, value),
            expression: static_class_expression(value),
            ternary: None,
            needs_cx: false,
        },
        ClassFragment::Expr { value: expr, .. } => ClassNamePrint {
            attribute: format!("{class_attr}={{{expr}}}"),
            expression: expr.clone(),
            ternary: None,
            needs_cx: false,
        },
    }
}

fn print_cx_fragments(class_attr: &str, fragments: &[ClassFragment]) -> ClassNamePrint {
    let args = fragments
        .iter()
        .map(|fragment| match fragment {
            ClassFragment::Static(value) => super::resolve::js_string_literal(value),
            ClassFragment::Expr { value: expr, .. } => expr.clone(),
        })
        .collect::<Vec<_>>()
        .join(", ");
    let expression = format!("{CX_HELPER_LOCAL}({args})");
    ClassNamePrint {
        attribute: format!("{class_attr}={{{expression}}}"),
        expression,
        ternary: None,
        needs_cx: true,
    }
}

fn print_concatenated_fragments(class_attr: &str, fragments: &[ClassFragment]) -> ClassNamePrint {
    let mut expr = String::new();
    for (index, fragment) in fragments.iter().enumerate() {
        if index > 0 {
            expr.push_str(" + ");
            if let (
                ClassFragment::Static(_) | ClassFragment::Expr { .. },
                ClassFragment::Expr { .. },
            ) = (&fragments[index - 1], fragment)
            {
                expr.push_str("\" \" + ");
            }
        }
        match fragment {
            ClassFragment::Static(value) => {
                if index > 0 && matches!(fragments[index - 1], ClassFragment::Expr { .. }) {
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
            ClassFragment::Expr {
                value,
                parenthesize,
            } => {
                if *parenthesize {
                    expr.push('(');
                }
                expr.push_str(value);
                if *parenthesize {
                    expr.push(')');
                }
            }
        }
    }

    ClassNamePrint {
        attribute: format!("{class_attr}={{{expr}}}"),
        expression: expr,
        ternary: None,
        needs_cx: false,
    }
}

fn should_use_cx(helper_cx: HelperCxMode, fragments: &[ClassFragment]) -> bool {
    match helper_cx {
        HelperCxMode::False => false,
        HelperCxMode::True => fragments
            .iter()
            .any(|fragment| matches!(fragment, ClassFragment::Expr { .. })),
        HelperCxMode::Auto => {
            let expr_count = fragments
                .iter()
                .filter(|fragment| matches!(fragment, ClassFragment::Expr { .. }))
                .count();
            expr_count > 1 || (expr_count == 1 && fragments.len() > 2)
        }
    }
}

pub(crate) fn format_object_class_name(class_attr: &str, print: &ClassNamePrint) -> String {
    format!("{class_attr}: {}", print.expression)
}

/// Plan the internal css helper import line for required transform symbols.
#[must_use]
#[allow(
    clippy::similar_names,
    reason = "needs_cva/needs_sva mirror TransformHelperFacts fields"
)]
pub(crate) fn plan_internal_css_import_line(
    helper: &TransformHelperFacts,
    helper_cx: HelperCxMode,
) -> Option<String> {
    let needs_cx = helper_cx != HelperCxMode::False && helper.needs_cx;
    let needs_cva = helper.needs_cva;
    let needs_sva = helper.needs_sva;

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
            needs_cx: true,
            ..Default::default()
        },
    )
}

#[cfg(test)]
mod tests {
    use super::super::plan::HelperCxMode;
    use super::*;

    fn existing<'a>(
        static_value: Option<&'a str>,
        dynamic_value: Option<&'a str>,
        dynamic_kind: Option<ExpressionKind>,
        dynamic_parenthesize: bool,
    ) -> ExistingClassName<'a> {
        ExistingClassName {
            static_value,
            dynamic_value,
            dynamic_kind,
            dynamic_array_insert: None,
            dynamic_array_has_elements: false,
            dynamic_parenthesize,
        }
    }

    #[test]
    fn folds_multiple_static_fragments_to_one_literal() {
        let print = merge_class_name_fragments(
            "className",
            HelperCxMode::Auto,
            existing(Some("foo"), None, None, false),
            "bar baz",
        );
        assert_eq!(print.attribute, r#"className="foo bar baz""#);
        assert!(!print.needs_cx);
    }

    #[test]
    fn dynamic_plus_static_uses_inline_concat_in_auto_mode() {
        let print = merge_class_name_fragments(
            "className",
            HelperCxMode::Auto,
            existing(
                None,
                Some("props.cls"),
                Some(ExpressionKind::Identifier),
                false,
            ),
            "color_red",
        );
        assert_eq!(print.attribute, r#"className={props.cls + " color_red"}"#);
        assert!(!print.needs_cx);
    }

    #[test]
    fn two_expressions_use_cx_in_auto_mode() {
        let print = merge_class_name_with_expression(
            "className",
            HelperCxMode::Auto,
            existing(
                None,
                Some("props.cls"),
                Some(ExpressionKind::Identifier),
                false,
            ),
            r#"isError ? "color_red" : "color_blue""#,
            true,
        );
        assert_eq!(
            print.attribute,
            r#"className={__pcx(props.cls, isError ? "color_red" : "color_blue")}"#
        );
        assert!(print.needs_cx);
    }

    #[test]
    fn true_mode_uses_cx_for_dynamic_and_static_pair() {
        let print = merge_class_name_fragments(
            "className",
            HelperCxMode::True,
            existing(
                None,
                Some("props.cls"),
                Some(ExpressionKind::Identifier),
                false,
            ),
            "color_red",
        );
        assert_eq!(
            print.attribute,
            r#"className={__pcx(props.cls, "color_red")}"#
        );
        assert!(print.needs_cx);
    }

    #[test]
    fn false_mode_never_emits_cx_even_with_multiple_expressions() {
        let print = merge_class_name_with_expression(
            "className",
            HelperCxMode::False,
            existing(
                None,
                Some("props.cls"),
                Some(ExpressionKind::Identifier),
                false,
            ),
            r#"isError ? "color_red" : "color_blue""#,
            true,
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
            "className",
            HelperCxMode::False,
            existing(Some("foo"), None, None, false),
            r#"isError ? "color_red" : "color_blue""#,
            true,
        );
        assert_eq!(
            print.attribute,
            r#"className={"foo" + " " + (isError ? "color_red" : "color_blue")}"#
        );
    }

    #[test]
    fn solid_class_attribute_merges_static_fragments() {
        let print = merge_class_name_fragments(
            "class",
            HelperCxMode::Auto,
            existing(Some("foo"), None, None, false),
            "bar baz",
        );
        assert_eq!(print.attribute, r#"class="foo bar baz""#);
        assert!(!print.needs_cx);
    }

    #[test]
    fn remove_internal_css_import_strips_indented_import() {
        let source =
            "    import { cx as __pcx } from '@pandacss-internal/css';\n    export const x = 1;\n";
        let module = pandacss_extractor::analyze_module(source, "fixture.ts");
        let edits = super::super::imports::plan_internal_css_import_removals(source, &module);
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
