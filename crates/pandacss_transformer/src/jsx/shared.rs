//! Shared JSX rewrite helpers.

use pandacss_extractor::ExtractedJsx;
use pandacss_project::Project;

use super::conditional::class_expression_for_jsx_data;
use crate::helper::{
    ClassNamePrint, format_object_class_name, merge_class_name_fragments,
    merge_class_name_with_expression,
};
use crate::plan::HelperCxMode;

use super::parse::{ParsedObjectLiteral, ParsedOpeningElement};

pub(super) fn should_skip_style_prop(key: &str) -> bool {
    matches!(key, "children" | "key" | "ref")
}

pub(super) fn plan_opening_class_name(
    project: &Project,
    jsx: &ExtractedJsx,
    parsed: &ParsedOpeningElement,
    helper_cx: HelperCxMode,
) -> Option<ClassNamePrint> {
    if let Some(expression) = class_expression_for_jsx_data(project, jsx, parsed) {
        return Some(merge_class_name_with_expression(
            helper_cx,
            parsed.static_class_name().as_deref(),
            parsed.dynamic_class_name_expression().as_deref(),
            &expression,
        ));
    }

    let classes = project.class_names_for_jsx_usage(jsx)?;
    Some(merge_class_name_fragments(
        helper_cx,
        parsed.static_class_name().as_deref(),
        parsed.dynamic_class_name_expression().as_deref(),
        &classes.join(" "),
    ))
}

pub(super) fn plan_runtime_class_name(
    project: &Project,
    jsx: &ExtractedJsx,
    parsed: &ParsedObjectLiteral,
    props_source: &str,
    helper_cx: HelperCxMode,
) -> Option<ClassNamePrint> {
    use super::conditional::class_expression_for_runtime_props;

    if let Some(expression) = class_expression_for_runtime_props(project, jsx, props_source) {
        return Some(merge_class_name_with_expression(
            helper_cx,
            parsed.static_class_name().as_deref(),
            parsed.dynamic_class_name_expression().as_deref(),
            &expression,
        ));
    }

    let classes = project.class_names_for_jsx_usage(jsx)?;
    let print = merge_class_name_fragments(
        helper_cx,
        parsed.static_class_name().as_deref(),
        parsed.dynamic_class_name_expression().as_deref(),
        &classes.join(" "),
    );
    Some(ClassNamePrint {
        attribute: format_object_class_name(&print),
        needs_cx: print.needs_cx,
    })
}
