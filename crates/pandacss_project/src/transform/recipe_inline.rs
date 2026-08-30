//! Inline `cva()` / `sva()` call transforms to string-branch runtime configs.

use crate::Project;
use pandacss_extractor::{ExpressionFacts, ExpressionKind, Literal, StyleTree};
use pandacss_recipes::{
    CompoundVariant, Recipe, SlotCompoundVariant, SlotRecipe, VariantGroup, VariantOption,
};

use super::helper::{CVA_HELPER_LOCAL, SVA_HELPER_LOCAL};
use super::plan::{Rewrite, TransformHelperFacts};
use super::resolve::is_static_style_literal;
use super::style_lower;

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
        helper: TransformHelperFacts::cva(),
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
        helper: TransformHelperFacts::sva(),
    })
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
    style_lower::lower_style_tree(project, source, tree, None, None)
        .map(|expr| style_lower::print_class_expr(&expr))
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
        .map(|(key, value)| {
            format!(
                "{}: {}",
                escape_js_key(key),
                format_default_variant_value(value)
            )
        })
        .collect::<Vec<_>>()
        .join(", ");
    parts.push(format!("defaultVariants: {{ {defaults} }}"));
}

fn format_default_variant_value(value: &str) -> String {
    match value {
        "true" | "false" => value.to_owned(),
        other => format!("'{}'", escape_js(other)),
    }
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

pub(crate) fn escape_js(value: &str) -> String {
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
        helper: TransformHelperFacts::cva(),
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

// ---------------------------------------------------------------------------
// `binding.raw(props)` on an inline cva/sva — folds to the resolved styles.
// ---------------------------------------------------------------------------

/// Static variant selection from a `.raw({ … })` argument.
///
/// `None` means the call can't be resolved at build time, which also blocks the
/// string-branch desugar of the definition — the runtime `raw` returns style
/// objects and the desugared one returns class strings.
pub(crate) fn raw_call_variant_props(
    source: &str,
    args: &[Option<ExpressionFacts>],
) -> Option<Vec<(String, String)>> {
    if args.len() > 1 {
        return None;
    }
    let Some(arg) = args.first() else {
        return Some(Vec::new());
    };
    let facts = arg.as_ref()?;
    if facts.kind != ExpressionKind::Object {
        return None;
    }
    let object = facts.object.as_ref()?;

    let mut props = Vec::with_capacity(object.properties.len());
    for prop in &object.properties {
        if prop.is_spread() || prop.is_accessor_or_method {
            return None;
        }
        let key = prop.key.as_ref()?;
        let value = prop.value.as_ref()?;
        let value = static_variant_value(source, value)?;
        upsert_prop(&mut props, key.clone(), value);
    }
    Some(props)
}

/// Variant values are looked up as object keys at runtime, so every static
/// literal reduces to its string form.
fn static_variant_value(source: &str, facts: &ExpressionFacts) -> Option<String> {
    if let Some(value) = facts.string_value.as_ref() {
        return Some(value.clone());
    }
    if facts.kind != ExpressionKind::Static {
        return None;
    }
    let start = usize::try_from(facts.span.start).ok()?;
    let end = usize::try_from(facts.span.end).ok()?;
    let text = source.get(start..end)?.trim();
    match text {
        "true" | "false" => Some(text.to_owned()),
        _ if text.parse::<f64>().is_ok() => Some(text.to_owned()),
        _ => None,
    }
}

fn upsert_prop(props: &mut Vec<(String, String)>, key: String, value: String) {
    if let Some(entry) = props.iter_mut().find(|(name, _)| name == &key) {
        entry.1 = value;
    } else {
        props.push((key, value));
    }
}

/// `withDefaults(defaultVariants, props)` — defaults first, props override.
fn computed_variants(
    default_variants: &[(String, String)],
    props: &[(String, String)],
) -> Vec<(String, String)> {
    let mut computed = default_variants.to_vec();
    for (key, value) in props {
        upsert_prop(&mut computed, key.clone(), value.clone());
    }
    computed
}

fn compound_matches(conditions: &[(String, Vec<String>)], computed: &[(String, String)]) -> bool {
    conditions.iter().all(|(key, expected)| {
        computed
            .iter()
            .find(|(name, _)| name == key)
            .is_some_and(|(_, actual)| expected.iter().any(|value| value == actual))
    })
}

/// Mirror of the generated `cva(...).raw` — base, matching variants, then
/// compound css, merged by `mergeCss`.
pub(crate) fn resolve_cva_raw_styles(
    project: &Project,
    recipe: &Recipe,
    props: &[(String, String)],
) -> Option<Literal> {
    let computed = computed_variants(&recipe.default_variants, props);
    let empty = Literal::Object(Vec::new());

    let mut styles = vec![Some(recipe.base.clone().unwrap_or_else(|| empty.clone()))];
    for (key, value) in &computed {
        let Some(group) = recipe.variants.iter().find(|group| &group.name == key) else {
            continue;
        };
        if let Some(option) = group.options.iter().find(|option| &option.key == value) {
            styles.push(Some(option.style.clone()));
        }
    }

    let compounds: Vec<&Literal> = recipe
        .compound_variants
        .iter()
        .filter(|compound| compound_matches(&compound.conditions, &computed))
        .map(|compound| &compound.css)
        .collect();
    styles.push(Some(crate::merge_style_props(&compounds)));

    project.merged_style_literal(&styles)
}

/// Mirror of the generated `sva(...).raw` — one resolved style object per slot.
pub(crate) fn resolve_sva_raw_styles(
    project: &Project,
    recipe: &SlotRecipe,
    props: &[(String, String)],
) -> Option<Literal> {
    let mut slots = Vec::with_capacity(recipe.slots.len());
    for slot in &recipe.slots {
        let per_slot = slot_recipe_for(recipe, slot);
        slots.push((
            slot.clone(),
            resolve_cva_raw_styles(project, &per_slot, props)?,
        ));
    }
    Some(Literal::Object(slots))
}

/// The per-slot `cva` config `sva` builds internally via `getSlotRecipes`.
fn slot_recipe_for(recipe: &SlotRecipe, slot: &str) -> Recipe {
    let pick = |entries: &[(String, Literal)]| {
        entries
            .iter()
            .find(|(name, _)| name == slot)
            .map(|(_, style)| style.clone())
    };

    Recipe {
        base: pick(&recipe.base),
        variants: recipe
            .variants
            .iter()
            .map(|group| VariantGroup {
                name: group.name.clone(),
                options: group
                    .options
                    .iter()
                    .filter_map(|option| {
                        pick(&option.styles).map(|style| VariantOption {
                            key: option.key.clone(),
                            style,
                        })
                    })
                    .collect(),
            })
            .collect(),
        compound_variants: recipe
            .compound_variants
            .iter()
            .filter_map(|compound| {
                pick(&compound.css).map(|css| CompoundVariant {
                    conditions: compound.conditions.clone(),
                    css,
                    class_name: compound.class_name.clone(),
                })
            })
            .collect(),
        default_variants: recipe.default_variants.clone(),
    }
}

/// Resolve `binding.raw(props)` for an inline `cva` or `sva` definition.
/// Variant props folded from an expression, as `resolve_inline_recipe_raw`
/// wants them. `None` if any value isn't a static scalar.
pub(crate) fn literal_variant_props(props: &Literal) -> Option<Vec<(String, String)>> {
    let Literal::Object(entries) = props else {
        return None;
    };
    let mut out = Vec::with_capacity(entries.len());
    for (key, value) in entries {
        let text = match value {
            Literal::String(text) => text.clone(),
            Literal::Bool(flag) => flag.to_string(),
            Literal::Number(number) => pandacss_shared::number_to_js_string(*number),
            // An explicitly absent variant falls back to `defaultVariants`.
            Literal::Null => continue,
            _ => return None,
        };
        upsert_prop(&mut out, key.clone(), text);
    }
    Some(out)
}

pub(crate) fn resolve_inline_recipe_raw(
    project: &Project,
    factory: &str,
    config: &Literal,
    props: &[(String, String)],
) -> Option<Literal> {
    if factory == "sva" {
        let recipe = SlotRecipe::from_literal(config)?;
        return resolve_sva_raw_styles(project, &recipe, props);
    }
    let recipe = if is_recipe_config(config) {
        Recipe::from_literal(config)?
    } else {
        Recipe {
            base: Some(config.clone()),
            ..Recipe::default()
        }
    };
    resolve_cva_raw_styles(project, &recipe, props)
}
