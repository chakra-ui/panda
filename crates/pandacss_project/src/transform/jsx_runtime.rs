//! React runtime call rewrites (`jsx`, `jsxs`, `createElement`, …).

use pandacss_extractor::ExtractedJsx;

use crate::PatternTransformFn;
use crate::Project;

use super::helper::format_object_class_name;
use super::jsx_parse::{ConditionalSpreadPlan, SpreadSyntax, parsed_object_from_facts};
use super::jsx_shared::{
    SelectedSlots, plan_runtime_class_name, plan_slot_spreads, resolve_element_tag, select_slots,
    style_slots_should_skip,
};
use super::plan::{HelperCxMode, Rewrite, TransformHelperFacts};
use super::resolve::span_slice;

pub(super) fn rewrites_for_jsx_runtime_call(
    project: &Project,
    source: &str,
    jsx: &ExtractedJsx,
    helper_cx: HelperCxMode,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Vec<Rewrite> {
    let Some(callee_span) = jsx.source.callee_span else {
        return Vec::new();
    };
    let Some(callee) = span_slice(source, callee_span) else {
        return Vec::new();
    };
    if jsx.source.args.len() < 2 {
        return Vec::new();
    }
    let Some(props_facts) = jsx.source.args[1].object.as_ref() else {
        return Vec::new();
    };
    let Some(props) = parsed_object_from_facts(source, props_facts) else {
        return Vec::new();
    };
    let Some(spread_plan) = plan_slot_spreads(
        project,
        source,
        jsx,
        &props.properties,
        SpreadSyntax::ObjectProperty,
    ) else {
        return Vec::new();
    };
    if props.has_unresolved_as_prop()
        || style_slots_should_skip(
            project,
            source,
            jsx,
            &props.properties,
            pattern_transform.as_deref_mut(),
        )
    {
        return Vec::new();
    }
    let Some(tag) = resolve_element_tag(jsx, None, Some(&props.properties)) else {
        return Vec::new();
    };
    let Some(class_name) =
        plan_runtime_class_name(project, source, jsx, &props, helper_cx, pattern_transform)
    else {
        return Vec::new();
    };

    let mut args = jsx
        .source
        .args
        .iter()
        .filter_map(|argument| span_slice(source, argument.span).map(str::to_owned))
        .collect::<Vec<_>>();
    if args.len() != jsx.source.args.len() {
        return Vec::new();
    }
    args[0] = tag.runtime_first_arg();
    let runtime_spread = match &spread_plan {
        ConditionalSpreadPlan::Runtime(rewrite) => Some(rewrite),
        ConditionalSpreadPlan::None | ConditionalSpreadPlan::StyleOnly => None,
    };
    let Some(selected) = select_slots(project, jsx, &props.properties, &class_name, runtime_spread)
    else {
        return Vec::new();
    };
    args[1] = print_props_object(project, &selected, &class_name);
    let mut preserved = selected.preserved;
    preserved.push(callee_span);
    preserved.extend(jsx.source.args.iter().skip(2).map(|argument| argument.span));
    let content = format!("{callee}({})", args.join(", "));

    vec![Rewrite {
        start: jsx.span.start,
        end: jsx.span.end,
        content,
        preserved,
        helper: TransformHelperFacts {
            needs_cx: class_name.needs_cx,
            ..TransformHelperFacts::none()
        },
    }]
}

/// `{ …props, className: … }` — the object spelling of the selected slots.
fn print_props_object(
    project: &Project,
    selected: &SelectedSlots,
    class_name: &super::helper::ClassNamePrint,
) -> String {
    let class_attr = project.config().extractor_config().class_attribute;
    let mut parts = selected.parts.clone();
    if !selected.embedded_class {
        parts.push(format_object_class_name(class_attr, class_name));
    }
    format!("{{ {} }}", parts.join(", "))
}
