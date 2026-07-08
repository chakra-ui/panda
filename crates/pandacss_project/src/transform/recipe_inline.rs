//! Inline `cva()` / `sva()` call transforms to string-branch runtime configs.

use crate::Project;
use pandacss_extractor::Literal;
use pandacss_recipes::{CompoundVariant, Recipe, SlotCompoundVariant, SlotRecipe};

use super::helper::{CVA_HELPER_LOCAL, SVA_HELPER_LOCAL};
use super::plan::Rewrite;
use super::resolve::{call_arg_span, is_static_style_literal};

pub(crate) fn rewrite_for_cva_call(
    project: &Project,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
) -> Option<Rewrite> {
    let config = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_style_literal(config) {
        return None;
    }
    let encoded = encode_cva_config(project, config)?;
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: format!("{CVA_HELPER_LOCAL}({encoded})"),
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
    })
}

pub(crate) fn encode_cva_config(project: &Project, config: &Literal) -> Option<String> {
    if is_recipe_config(config) {
        let recipe = Recipe::from_literal(config)?;
        print_recipe_config(project, &recipe)
    } else {
        let classes = project.class_names_for_style_literal(config)?;
        Some(format!("{{ base: '{}' }}", escape_js(&classes.join(" "))))
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

fn print_recipe_config(project: &Project, recipe: &Recipe) -> Option<String> {
    let mut parts = Vec::new();

    if let Some(base) = &recipe.base {
        if !is_static_style_literal(base) {
            return None;
        }
        let classes = project.class_names_for_style_literal(base)?;
        if !classes.is_empty() {
            parts.push(format!("base: '{}'", escape_js(&classes.join(" "))));
        }
    }

    if !recipe.variants.is_empty() {
        let mut groups = Vec::new();
        for group in &recipe.variants {
            let mut options = Vec::new();
            for option in &group.options {
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

    if !recipe.default_variants.is_empty() {
        let defaults = recipe
            .default_variants
            .iter()
            .map(|(key, value)| format!("{}: '{}'", escape_js_key(key), escape_js(value)))
            .collect::<Vec<_>>()
            .join(", ");
        parts.push(format!("defaultVariants: {{ {defaults} }}"));
    }

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

    if !recipe.default_variants.is_empty() {
        let defaults = recipe
            .default_variants
            .iter()
            .map(|(key, value)| format!("{}: '{}'", escape_js_key(key), escape_js(value)))
            .collect::<Vec<_>>()
            .join(", ");
        parts.push(format!("defaultVariants: {{ {defaults} }}"));
    }

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

fn encode_shared_slot_variant_option(
    project: &Project,
    option: &pandacss_recipes::SlotVariantOption,
) -> Option<String> {
    let mut encoded: Vec<String> = Vec::new();
    for (_, style) in &option.styles {
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
    call_span: pandacss_shared::Span,
    config_arg_index: usize,
    config: &Literal,
) -> Option<Rewrite> {
    if !is_static_style_literal(config) {
        return None;
    }
    let (start, end) = call_arg_span(source, call_span, config_arg_index)?;
    let encoded = encode_cva_config(project, config)?;
    Some(Rewrite {
        start,
        end,
        content: format!("{CVA_HELPER_LOCAL}({encoded})"),
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
    rewrite_styled_config_arg(project, source, call.span, config_index, config)
}

fn is_jsx_factory_call(call: &pandacss_extractor::ExtractedCall) -> bool {
    call.name == call.alias || call.name.starts_with(&format!("{}.", call.alias))
}

fn styled_config_arg(call: &pandacss_extractor::ExtractedCall) -> Option<(usize, &Literal)> {
    if call.name == call.alias {
        let tag = call.data.first().and_then(|arg| arg.as_ref())?;
        if !matches!(tag, Literal::String(_)) {
            return None;
        }
        let config = call.data.get(1).and_then(|arg| arg.as_ref())?;
        return Some((1, config));
    }

    if call.name.starts_with(&format!("{}.", call.alias)) {
        let config = call.data.first().and_then(|arg| arg.as_ref())?;
        return Some((0, config));
    }

    None
}

#[cfg(test)]
mod tests {
    use super::super::resolve::span_slice;
    use super::*;

    #[test]
    fn call_arg_span_finds_second_argument() {
        let source = "styled('div', { color: 'red' })";
        let span = pandacss_shared::Span {
            start: 0,
            end: u32::try_from(source.len()).expect("span"),
        };
        let (start, end) = call_arg_span(source, span, 1).expect("arg span");
        assert_eq!(
            span_slice(source, pandacss_shared::Span { start, end }),
            Some("{ color: 'red' }")
        );
    }
}
