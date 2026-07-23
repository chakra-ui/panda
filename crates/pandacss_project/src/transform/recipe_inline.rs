//! Inline `cva()` / `sva()` call transforms to string-branch runtime configs.

use crate::Project;
use pandacss_extractor::{Literal, StyleTree};
use pandacss_recipes::{CompoundVariant, Recipe, SlotCompoundVariant, SlotRecipe};

use super::helper::{CVA_HELPER_LOCAL, SVA_HELPER_LOCAL};
use super::plan::Rewrite;
use super::resolve::{is_static_style_literal, js_string_literal};
use super::style_lower::{self, LowerResult};

pub(crate) fn rewrite_for_cva_call(
    project: &Project,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    _arg_spans: &[pandacss_shared::Span],
    style_args: &[Option<StyleTree>],
) -> Option<Rewrite> {
    let config = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_style_literal(config) {
        return None;
    }
    let style = style_args.first().and_then(|value| value.as_ref());
    let encoded = encode_cva_config(project, source, config, style)?;
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: format!("{CVA_HELPER_LOCAL}({encoded})"),
        preserved: style
            .map(style_lower::preserved_source_spans)
            .unwrap_or_default(),
    })
}

pub(crate) fn rewrite_for_sva_call(
    project: &Project,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    let config = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_slot_config(config) {
        return None;
    }
    let encoded = encode_sva_config(project, config)?;
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: format!("{SVA_HELPER_LOCAL}({encoded})"),
        preserved: Vec::new(),
    })
}

/// `__pcva({ … })` for a static style object or cva config, or `None` if it
/// has no resolvable styles. Without `StyleTree`, conditionals are rejected (not unioned).
pub(crate) fn styled_config_call(project: &Project, config: &Literal) -> Option<String> {
    if style_literal_has_conditional(config) {
        return None;
    }
    if !is_static_style_literal(config) {
        return None;
    }
    let encoded = encode_cva_config(project, "", config, None)?;
    Some(format!("{CVA_HELPER_LOCAL}({encoded})"))
}

pub(crate) fn encode_cva_config(
    project: &Project,
    source: &str,
    config: &Literal,
    style: Option<&StyleTree>,
) -> Option<String> {
    if is_recipe_config(config) {
        let recipe = Recipe::from_literal(config)?;
        print_recipe_config(project, source, &recipe, style)
    } else {
        print_plain_style_as_base(project, source, config, style)
    }
}

pub(crate) fn encode_sva_config(project: &Project, config: &Literal) -> Option<String> {
    let recipe = SlotRecipe::from_literal(config)?;
    print_slot_recipe_config(project, &recipe)
}

fn is_recipe_config(config: &Literal) -> bool {
    let Literal::Object(entries) = config else {
        return false;
    };
    entries.iter().any(|(key, _)| {
        matches!(
            key.as_str(),
            "base" | "variants" | "defaultVariants" | "compoundVariants"
        )
    })
}

fn is_static_slot_config(config: &Literal) -> bool {
    let Some(recipe) = SlotRecipe::from_literal(config) else {
        return false;
    };
    recipe
        .base
        .iter()
        .all(|(_, style)| is_static_style_literal(style))
        && recipe.variants.iter().all(|group| {
            group.options.iter().all(|option| {
                option
                    .styles
                    .iter()
                    .all(|(_, style)| is_static_style_literal(style))
            })
        })
        && recipe.compound_variants.iter().all(|compound| {
            compound
                .css
                .iter()
                .all(|(_, style)| is_static_style_literal(style))
        })
}

fn print_plain_style_as_base(
    project: &Project,
    source: &str,
    config: &Literal,
    style: Option<&StyleTree>,
) -> Option<String> {
    if let Some(expr) = style_tree_class_expression(project, source, style) {
        return Some(format!("{{ base: {expr} }}"));
    }
    if style_literal_has_conditional(config) {
        return None;
    }
    let classes = project.class_names_for_style_literal(config)?;
    Some(format!("{{ base: '{}' }}", escape_js(&classes.join(" "))))
}

fn print_recipe_config(
    project: &Project,
    source: &str,
    recipe: &Recipe,
    style: Option<&StyleTree>,
) -> Option<String> {
    let mut parts = Vec::new();

    if let Some(base) = &recipe.base {
        let base_tree = style.and_then(|tree| style_lower::style_tree_object_entry(tree, "base"));
        let base_part = print_recipe_base(project, source, base, base_tree)?;
        parts.push(format!("base: {base_part}"));
    }

    if !recipe.variants.is_empty() {
        let mut groups = Vec::new();
        for group in &recipe.variants {
            let mut options = Vec::new();
            for option in &group.options {
                if style_literal_has_conditional(&option.style) {
                    return None;
                }
                if !is_static_style_literal(&option.style) {
                    return None;
                }
                let classes = project.class_names_for_style_literal(&option.style)?;
                options.push(format!(
                    "{}: '{}'",
                    escape_js_key(&option.key),
                    escape_js(&classes.join(" "))
                ));
            }
            groups.push(format!(
                "{}: {{ {} }}",
                escape_js_key(&group.name),
                options.join(", ")
            ));
        }
        parts.push(format!("variants: {{ {} }}", groups.join(", ")));
    }

    push_default_variants_part(&mut parts, &recipe.default_variants);

    if !recipe.compound_variants.is_empty() {
        let compounds = recipe
            .compound_variants
            .iter()
            .map(|compound| print_compound_variant(project, compound))
            .collect::<Option<Vec<_>>>()?;
        parts.push(format!("compoundVariants: [{}]", compounds.join(", ")));
    }

    if parts.is_empty() {
        return None;
    }

    Some(format!("{{ {} }}", parts.join(", ")))
}

/// `base` value as a JS expression: quoted class string, or unquoted ternary.
fn print_recipe_base(
    project: &Project,
    source: &str,
    base: &Literal,
    base_tree: Option<&StyleTree>,
) -> Option<String> {
    if let Some(expr) = style_tree_class_expression(project, source, base_tree) {
        return Some(expr);
    }
    if style_literal_has_conditional(base) {
        return None;
    }
    if !is_static_style_literal(base) {
        return None;
    }
    let classes = project.class_names_for_style_literal(base)?;
    if classes.is_empty() {
        return None;
    }
    Some(format!("'{}'", escape_js(&classes.join(" "))))
}

fn style_tree_class_expression(
    project: &Project,
    source: &str,
    tree: Option<&StyleTree>,
) -> Option<String> {
    let tree = tree?;
    if !style_lower::style_tree_has_rewrite_sites(tree) {
        return None;
    }
    match style_lower::lower_style_tree(project, source, tree, None, None) {
        LowerResult::Expr(expr) => Some(style_lower::print_class_expr(&expr)),
        LowerResult::Static(classes) => Some(js_string_literal(&classes)),
        LowerResult::Bail => None,
    }
}

fn style_literal_has_conditional(value: &Literal) -> bool {
    match value {
        Literal::Conditional(_) => true,
        Literal::Object(entries) => entries
            .iter()
            .any(|(_, nested)| style_literal_has_conditional(nested)),
        Literal::Array(items) => items.iter().any(style_literal_has_conditional),
        _ => false,
    }
}

fn print_slot_recipe_config(project: &Project, recipe: &SlotRecipe) -> Option<String> {
    let mut parts = Vec::new();

    if !recipe.slots.is_empty() {
        let slots = recipe
            .slots
            .iter()
            .map(|slot| format!("'{}'", escape_js(slot)))
            .collect::<Vec<_>>()
            .join(", ");
        parts.push(format!("slots: [{slots}]"));
    }

    if !recipe.base.is_empty() {
        let mut base_parts = Vec::new();
        for (slot, style) in &recipe.base {
            if style_literal_has_conditional(style) {
                return None;
            }
            let classes = project.class_names_for_style_literal(style)?;
            base_parts.push(format!(
                "{}: '{}'",
                escape_js_key(slot),
                escape_js(&classes.join(" "))
            ));
        }
        parts.push(format!("base: {{ {} }}", base_parts.join(", ")));
    }

    if !recipe.variants.is_empty() {
        let mut groups = Vec::new();
        for group in &recipe.variants {
            let mut options = Vec::new();
            for option in &group.options {
                let encoded = encode_shared_slot_variant_option(project, option)?;
                options.push(format!(
                    "{}: '{}'",
                    escape_js_key(&option.key),
                    escape_js(&encoded)
                ));
            }
            groups.push(format!(
                "{}: {{ {} }}",
                escape_js_key(&group.name),
                options.join(", ")
            ));
        }
        parts.push(format!("variants: {{ {} }}", groups.join(", ")));
    }

    push_default_variants_part(&mut parts, &recipe.default_variants);

    if !recipe.compound_variants.is_empty() {
        let compounds = recipe
            .compound_variants
            .iter()
            .map(|compound| print_slot_compound_variant(project, compound))
            .collect::<Option<Vec<_>>>()?;
        parts.push(format!("compoundVariants: [{}]", compounds.join(", ")));
    }

    if parts.is_empty() {
        return None;
    }

    Some(format!("{{ {} }}", parts.join(", ")))
}

/// `defaultVariants: { … }` config part, shared by [`print_recipe_config`] and
/// [`print_slot_recipe_config`] (both recipe kinds share the same shape).
fn push_default_variants_part(parts: &mut Vec<String>, default_variants: &[(String, String)]) {
    if default_variants.is_empty() {
        return;
    }
    let defaults = default_variants
        .iter()
        .map(|(key, value)| format!("{}: '{}'", escape_js_key(key), escape_js(value)))
        .collect::<Vec<_>>()
        .join(", ");
    parts.push(format!("defaultVariants: {{ {defaults} }}"));
}

fn encode_shared_slot_variant_option(
    project: &Project,
    option: &pandacss_recipes::SlotVariantOption,
) -> Option<String> {
    let mut encoded: Vec<String> = Vec::new();
    for (_, style) in &option.styles {
        if style_literal_has_conditional(style) {
            return None;
        }
        encoded.push(project.class_names_for_style_literal(style)?.join(" "));
    }
    if encoded.is_empty() {
        return None;
    }
    let first = encoded.first()?;
    if encoded.iter().all(|value| value == first) {
        Some(first.clone())
    } else {
        None
    }
}

fn print_compound_variant(project: &Project, compound: &CompoundVariant) -> Option<String> {
    if style_literal_has_conditional(&compound.css) {
        return None;
    }
    let mut parts = print_compound_conditions(&compound.conditions);
    let classes = if let Some(class_name) = &compound.class_name {
        class_name.clone()
    } else {
        project
            .class_names_for_style_literal(&compound.css)?
            .join(" ")
    };
    parts.push(format!("css: '{}'", escape_js(&classes)));
    Some(format!("{{ {} }}", parts.join(", ")))
}

fn print_slot_compound_variant(
    project: &Project,
    compound: &SlotCompoundVariant,
) -> Option<String> {
    let mut parts = print_compound_conditions(&compound.conditions);
    let mut css_parts = Vec::new();
    for (slot, style) in &compound.css {
        if style_literal_has_conditional(style) {
            return None;
        }
        let classes = project.class_names_for_style_literal(style)?;
        css_parts.push(format!(
            "{}: '{}'",
            escape_js_key(slot),
            escape_js(&classes.join(" "))
        ));
    }
    if css_parts.is_empty() {
        return None;
    }
    parts.push(format!("css: {{ {} }}", css_parts.join(", ")));
    if let Some(class_name) = &compound.class_name {
        parts.push(format!("className: '{}'", escape_js(class_name)));
    }
    Some(format!("{{ {} }}", parts.join(", ")))
}

fn print_compound_conditions(conditions: &[(String, Vec<String>)]) -> Vec<String> {
    conditions
        .iter()
        .map(|(key, values)| {
            if values.len() == 1 {
                format!("{}: '{}'", escape_js_key(key), escape_js(&values[0]))
            } else {
                let joined = values
                    .iter()
                    .map(|value| format!("'{}'", escape_js(value)))
                    .collect::<Vec<_>>()
                    .join(", ");
                format!("{}: [{joined}]", escape_js_key(key))
            }
        })
        .collect()
}

fn escape_js(value: &str) -> String {
    value.replace('\\', "\\\\").replace('\'', "\\'")
}

fn escape_js_key(key: &str) -> String {
    if key
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '$')
        && !key.is_empty()
        && !key.chars().next().is_some_and(|ch| ch.is_ascii_digit())
    {
        key.to_owned()
    } else {
        format!("'{}'", escape_js(key))
    }
}

pub(crate) fn rewrite_styled_config_arg(
    project: &Project,
    source: &str,
    arg_spans: &[pandacss_shared::Span],
    config_arg_index: usize,
    config: &Literal,
    style: Option<&StyleTree>,
) -> Option<Rewrite> {
    let arg = arg_spans.get(config_arg_index)?;
    let content = {
        let encoded = encode_cva_config(project, source, config, style)?;
        format!("{CVA_HELPER_LOCAL}({encoded})")
    };
    Some(Rewrite {
        start: arg.start,
        end: arg.end,
        content,
        preserved: style
            .map(style_lower::preserved_source_spans)
            .unwrap_or_default(),
    })
}

/// `styled('tag', config)` / `styled.tag(config)` factory call transforms.
pub(crate) fn rewrite_for_styled_call(
    project: &Project,
    source: &str,
    call: &pandacss_extractor::ExtractedCall,
) -> Option<Rewrite> {
    if call.category != pandacss_extractor::MatchCategory::Jsx || call.jsx_recipe_ident.is_some() {
        return None;
    }
    if !is_jsx_factory_call(call) {
        return None;
    }

    let (config_index, config) = styled_config_arg(call)?;
    let style = call
        .style_args
        .get(config_index)
        .and_then(|value| value.as_ref());
    rewrite_styled_config_arg(
        project,
        source,
        &call.arg_spans,
        config_index,
        config,
        style,
    )
}

fn is_jsx_factory_call(call: &pandacss_extractor::ExtractedCall) -> bool {
    matches!(
        call.facts.callee_kind,
        pandacss_extractor::CallCalleeKind::Direct
            | pandacss_extractor::CallCalleeKind::StaticMember
    )
}

fn styled_config_arg(call: &pandacss_extractor::ExtractedCall) -> Option<(usize, &Literal)> {
    match call.facts.callee_kind {
        pandacss_extractor::CallCalleeKind::Direct => {
            let tag = call.data.first().and_then(|arg| arg.as_ref())?;
            if !matches!(tag, Literal::String(_)) {
                return None;
            }
            let config = call.data.get(1).and_then(|arg| arg.as_ref())?;
            Some((1, config))
        }
        pandacss_extractor::CallCalleeKind::StaticMember => {
            let config = call.data.first().and_then(|arg| arg.as_ref())?;
            Some((0, config))
        }
    }
}
