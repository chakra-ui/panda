//! Inline `cva()` / `sva()` call transforms to string-branch runtime configs.

use pandacss_extractor::StyleTree;
use pandacss_literal::Literal;
use pandacss_recipes::{CompoundVariant, Recipe, SlotCompoundVariant, SlotRecipe};
use pandacss_system::System;
use pandacss_system::is_recipe_config;

use super::helper::{CVA_HELPER_LOCAL, SVA_HELPER_LOCAL};
use super::js;
use super::plan::{Rewrite, TransformHelperFacts};
use super::resolve::is_static_style_literal;
use super::style_lower::{self, LowerTarget};

pub(crate) fn rewrite_for_cva_call(
    system: &System,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    _arg_spans: &[pandacss_shared::Span],
    style_args: &[Option<StyleTree>],
) -> Option<Rewrite> {
    let definition = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_style_literal(definition) {
        return None;
    }
    let style = style_args.first().and_then(|value| value.as_ref());
    let encoded = encode_cva_config(system, source, definition, style)?;
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: format!("/* @__PURE__ */ {CVA_HELPER_LOCAL}({encoded})"),
        preserved: style
            .map(style_lower::preserved_source_spans)
            .unwrap_or_default(),
        helper: TransformHelperFacts::cva(),
    })
}

pub(crate) fn rewrite_for_sva_call(
    system: &System,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    let definition = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_slot_config(definition) {
        return None;
    }
    let encoded = encode_sva_config(system, definition)?;
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: format!("/* @__PURE__ */ {SVA_HELPER_LOCAL}({encoded})"),
        preserved: Vec::new(),
        helper: TransformHelperFacts::sva(),
    })
}

pub(crate) fn encode_cva_config(
    system: &System,
    source: &str,
    definition: &Literal,
    style: Option<&StyleTree>,
) -> Option<String> {
    if is_recipe_config(definition) {
        let recipe = Recipe::from_literal(definition)?;
        print_recipe_config(system, source, &recipe, style)
    } else {
        print_plain_style_as_base(system, source, definition, style)
    }
}

pub(crate) fn encode_sva_config(system: &System, definition: &Literal) -> Option<String> {
    let recipe = SlotRecipe::from_literal(definition)?;
    print_slot_recipe_config(system, &recipe)
}

fn is_static_slot_config(definition: &Literal) -> bool {
    let Some(recipe) = SlotRecipe::from_literal(definition) else {
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
    system: &System,
    source: &str,
    definition: &Literal,
    style: Option<&StyleTree>,
) -> Option<String> {
    if let Some(expr) = style_tree_class_expression(system, source, style) {
        return Some(format!("{{ base: {expr} }}"));
    }
    if definition.has_conditional() {
        return None;
    }
    let classes = system.class_names_for_style_literal(definition)?;
    Some(format!("{{ base: '{}' }}", js::escape(&classes.join(" "))))
}

fn print_recipe_config(
    system: &System,
    source: &str,
    recipe: &Recipe,
    style: Option<&StyleTree>,
) -> Option<String> {
    let mut parts = Vec::new();

    if let Some(base) = &recipe.base {
        let base_tree = style.and_then(|tree| style_lower::style_tree_object_entry(tree, "base"));
        let base_part = print_recipe_base(system, source, base, base_tree)?;
        parts.push(format!("base: {base_part}"));
    }

    if !recipe.variants.is_empty() {
        let mut groups = Vec::new();
        for group in &recipe.variants {
            let mut options = Vec::new();
            for option in &group.options {
                if option.style.has_conditional() {
                    return None;
                }
                if !is_static_style_literal(&option.style) {
                    return None;
                }
                let classes = system.class_names_for_style_literal(&option.style)?;
                options.push(format!(
                    "{}: '{}'",
                    js::key(&option.key),
                    js::escape(&classes.join(" "))
                ));
            }
            groups.push(js::field(&group.name, js::object(options)));
        }
        parts.push(js::field("variants", js::object(groups)));
    }

    push_default_variants_part(&mut parts, &recipe.default_variants);

    if !recipe.compound_variants.is_empty() {
        let compounds = recipe
            .compound_variants
            .iter()
            .map(|compound| print_compound_variant(system, compound))
            .collect::<Option<Vec<_>>>()?;
        parts.push(format!("compoundVariants: [{}]", compounds.join(", ")));
    }

    if parts.is_empty() {
        return None;
    }

    Some(js::object(parts))
}

/// `base` value as a JS expression: quoted class string, or unquoted ternary.
fn print_recipe_base(
    system: &System,
    source: &str,
    base: &Literal,
    base_tree: Option<&StyleTree>,
) -> Option<String> {
    if let Some(expr) = style_tree_class_expression(system, source, base_tree) {
        return Some(expr);
    }
    if base.has_conditional() {
        return None;
    }
    if !is_static_style_literal(base) {
        return None;
    }
    let classes = system.class_names_for_style_literal(base)?;
    if classes.is_empty() {
        return None;
    }
    Some(format!("'{}'", js::escape(&classes.join(" "))))
}

fn style_tree_class_expression(
    system: &System,
    source: &str,
    tree: Option<&StyleTree>,
) -> Option<String> {
    let tree = tree?;
    if !style_lower::style_tree_has_rewrite_sites(tree) {
        return None;
    }
    style_lower::lower_style_tree(system, source, tree, LowerTarget::Css, None)
        .map(|expr| style_lower::print_class_expr(&expr))
}

fn print_slot_recipe_config(system: &System, recipe: &SlotRecipe) -> Option<String> {
    let mut parts = Vec::new();

    if !recipe.slots.is_empty() {
        let slots = recipe
            .slots
            .iter()
            .map(|slot| format!("'{}'", js::escape(slot)))
            .collect::<Vec<_>>()
            .join(", ");
        parts.push(format!("slots: [{slots}]"));
    }

    if !recipe.base.is_empty() {
        let mut base_parts = Vec::new();
        for (slot, style) in &recipe.base {
            if style.has_conditional() {
                return None;
            }
            let classes = system.class_names_for_style_literal(style)?;
            base_parts.push(format!(
                "{}: '{}'",
                js::key(slot),
                js::escape(&classes.join(" "))
            ));
        }
        parts.push(js::field("base", js::object(base_parts)));
    }

    if !recipe.variants.is_empty() {
        let mut groups = Vec::new();
        for group in &recipe.variants {
            let mut options = Vec::new();
            for option in &group.options {
                let encoded = print_slot_variant_option(system, recipe, option)?;
                options.push(format!("{}: {encoded}", js::key(&option.key)));
            }
            groups.push(js::field(&group.name, js::object(options)));
        }
        parts.push(js::field("variants", js::object(groups)));
    }

    push_default_variants_part(&mut parts, &recipe.default_variants);

    if !recipe.compound_variants.is_empty() {
        let compounds = recipe
            .compound_variants
            .iter()
            .map(|compound| print_slot_compound_variant(system, compound))
            .collect::<Option<Vec<_>>>()?;
        parts.push(format!("compoundVariants: [{}]", compounds.join(", ")));
    }

    if parts.is_empty() {
        return None;
    }

    Some(js::object(parts))
}

/// `defaultVariants: { … }` config part, shared by [`print_recipe_config`] and
/// [`print_slot_recipe_config`] (both recipe kinds share the same shape).
fn push_default_variants_part(parts: &mut Vec<String>, default_variants: &[(String, String)]) {
    if default_variants.is_empty() {
        return;
    }
    let defaults = default_variants
        .iter()
        .map(|(key, value)| format!("{}: {}", js::key(key), format_variant_value(value)))
        .collect::<Vec<_>>()
        .join(", ");
    parts.push(format!("defaultVariants: {{ {defaults} }}"));
}

/// Booleans stay booleans so the runtime's strict compound matching sees the prop value.
fn format_variant_value(value: &str) -> String {
    match value {
        "true" | "false" => value.to_owned(),
        other => format!("'{}'", js::escape(other)),
    }
}

/// One class string when the option styles every slot the same way, else a
/// per-slot map so classes never leak onto slots the option doesn't style.
fn print_slot_variant_option(
    system: &System,
    recipe: &SlotRecipe,
    option: &pandacss_recipes::SlotVariantOption,
) -> Option<String> {
    let mut per_slot = Vec::new();
    for (slot, style) in &option.styles {
        if style.has_conditional() {
            return None;
        }
        let classes = system.class_names_for_style_literal(style)?.join(" ");
        if !classes.is_empty() {
            per_slot.push((slot.as_str(), classes));
        }
    }

    let slots = slot_names(recipe);
    let shared = per_slot.first().map(|(_, classes)| classes);
    let covers_every_slot = !slots.is_empty()
        && slots
            .iter()
            .all(|slot| per_slot.iter().any(|(name, _)| name == slot));
    if covers_every_slot && per_slot.iter().all(|(_, classes)| Some(classes) == shared) {
        return shared.map(|classes| format!("'{}'", js::escape(classes)));
    }

    let entries = per_slot
        .iter()
        .map(|(slot, classes)| js::field(slot, format!("'{}'", js::escape(classes))));
    Some(js::object(entries))
}

/// Mirrors the runtime's `config.slots ?? Object.keys(base)`.
fn slot_names(recipe: &SlotRecipe) -> Vec<&str> {
    if recipe.slots.is_empty() {
        recipe.base.iter().map(|(slot, _)| slot.as_str()).collect()
    } else {
        recipe.slots.iter().map(String::as_str).collect()
    }
}

fn print_compound_variant(system: &System, compound: &CompoundVariant) -> Option<String> {
    if compound.css.has_conditional() {
        return None;
    }
    let mut parts = print_compound_conditions(&compound.conditions);
    let classes = if let Some(class_name) = &compound.class_name {
        class_name.clone()
    } else {
        system
            .class_names_for_style_literal(&compound.css)?
            .join(" ")
    };
    parts.push(format!("css: '{}'", js::escape(&classes)));
    Some(js::object(parts))
}

fn print_slot_compound_variant(system: &System, compound: &SlotCompoundVariant) -> Option<String> {
    let mut parts = print_compound_conditions(&compound.conditions);
    let mut css_parts = Vec::new();
    for (slot, style) in &compound.css {
        if style.has_conditional() {
            return None;
        }
        let classes = system.class_names_for_style_literal(style)?;
        css_parts.push(format!(
            "{}: '{}'",
            js::key(slot),
            js::escape(&classes.join(" "))
        ));
    }
    if css_parts.is_empty() {
        return None;
    }
    parts.push(js::field("css", js::object(css_parts)));
    if let Some(class_name) = &compound.class_name {
        parts.push(format!("className: '{}'", js::escape(class_name)));
    }
    Some(js::object(parts))
}

fn print_compound_conditions(conditions: &[(String, Vec<String>)]) -> Vec<String> {
    conditions
        .iter()
        .map(|(key, values)| {
            if values.len() == 1 {
                format!("{}: {}", js::key(key), format_variant_value(&values[0]))
            } else {
                let joined = values
                    .iter()
                    .map(|value| format_variant_value(value))
                    .collect::<Vec<_>>()
                    .join(", ");
                format!("{}: [{joined}]", js::key(key))
            }
        })
        .collect()
}

pub(crate) fn rewrite_styled_config_arg(
    system: &System,
    source: &str,
    arg_spans: &[pandacss_shared::Span],
    config_arg_index: usize,
    definition: &Literal,
    style: Option<&StyleTree>,
) -> Option<Rewrite> {
    let arg = arg_spans.get(config_arg_index)?;
    let content = {
        let encoded = encode_cva_config(system, source, definition, style)?;
        format!("/* @__PURE__ */ {CVA_HELPER_LOCAL}({encoded})")
    };
    Some(Rewrite {
        start: arg.start,
        end: arg.end,
        content,
        preserved: style
            .map(style_lower::preserved_source_spans)
            .unwrap_or_default(),
        helper: TransformHelperFacts::cva(),
    })
}

/// `styled('tag', config)` / `styled.tag(config)` factory call transforms.
pub(crate) fn rewrites_for_styled_call(
    system: &System,
    source: &str,
    call: &pandacss_extractor::ExtractedCall,
) -> Option<[Rewrite; 2]> {
    if call.category != pandacss_extractor::MatchCategory::Jsx || call.jsx_recipe_ident.is_some() {
        return None;
    }
    if !is_jsx_factory_call(call) {
        return None;
    }

    let (config_index, definition) = styled_config_arg(call)?;
    let style = call
        .style_args
        .get(config_index)
        .and_then(|value| value.as_ref());
    let definition = rewrite_styled_config_arg(
        system,
        source,
        &call.arg_spans,
        config_index,
        definition,
        style,
    )?;
    let callee_span = call.facts.callee_span;
    let callee = super::resolve::span_slice(source, callee_span)?;
    let outer = Rewrite {
        start: callee_span.start,
        end: callee_span.end,
        content: format!("/* @__PURE__ */ {callee}"),
        // The replacement re-emits the original callee. Keep its resolved
        // import reference live during dead-import cleanup.
        preserved: vec![callee_span],
        helper: TransformHelperFacts::none(),
    };
    Some([outer, definition])
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
            let definition = call.data.get(1).and_then(|arg| arg.as_ref())?;
            Some((1, definition))
        }
        pandacss_extractor::CallCalleeKind::StaticMember => {
            let definition = call.data.first().and_then(|arg| arg.as_ref())?;
            Some((0, definition))
        }
    }
}
