//! Inline `cva()` / `sva()` transforms to specialized functions or compact
//! string-branch configs when the complete recipe surface remains observable.

use pandacss_extractor::StyleTree;
use pandacss_literal::Literal;
use pandacss_recipes::{Recipe, SlotRecipe, SlotVariantOption, VariantOption};
use pandacss_system::System;
use pandacss_system::is_recipe_config;

use super::helper::{CX_HELPER_LOCAL, MEMO_HELPER_LOCAL, RECIPE_HELPER_LOCAL};
use super::js;
use super::plan::{RecipeUsage, Rewrite, TransformHelperFacts};
use super::resolve::is_static_style_literal;
use super::style_lower::{self, LowerTarget};

/// Compile `cva()` into a recipe-specific callable, attaching the lightweight
/// observable surface when the binding escapes.
pub(crate) fn rewrite_for_specialized_cva_call(
    system: &System,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    arg_spans: &[pandacss_shared::Span],
    style_args: &[Option<StyleTree>],
    usage: RecipeUsage,
) -> Option<Rewrite> {
    let definition = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_style_literal(definition) {
        return None;
    }
    let recipe = if is_recipe_config(definition) {
        Recipe::from_literal(definition)?
    } else {
        Recipe {
            base: Some(definition.clone()),
            ..Recipe::default()
        }
    };
    let variant_names = recipe
        .variants
        .iter()
        .map(|group| group.name.as_str())
        .collect::<Vec<_>>();
    if !compounds_select_declared_variants(
        &variant_names,
        recipe
            .compound_variants
            .iter()
            .map(|compound| &compound.conditions),
    ) {
        return None;
    }
    let style = style_args.first().and_then(|value| value.as_ref());
    let mut printed = print_specialized_cva(system, source, &recipe, style)?;
    let mut preserved = style
        .map(style_lower::preserved_source_spans)
        .unwrap_or_default();
    let attach_surface = usage == RecipeUsage::Escapes;
    let memo = usage == RecipeUsage::Called && !recipe.variants.is_empty();
    if attach_surface {
        let config_span = *arg_spans.first()?;
        let config = recipe_config_source(source, config_span, definition);
        printed.code = print_complete_cva_surface(&printed.code, &config, &recipe);
        preserved.push(config_span);
    } else if memo {
        printed.code = print_memo(
            &printed.code,
            &cva_variant_map(&recipe),
            !recipe.compound_variants.is_empty(),
        );
    }
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: printed.code,
        preserved,
        helper: recipe_helper_facts(printed.needs_cx, attach_surface, memo),
    })
}

/// Compile `sva()` into a per-slot callable, attaching metadata when it escapes.
pub(crate) fn rewrite_for_specialized_sva_call(
    system: &System,
    source: &str,
    span: pandacss_shared::Span,
    args: &[Option<Literal>],
    arg_spans: &[pandacss_shared::Span],
    usage: RecipeUsage,
) -> Option<Rewrite> {
    let definition = args.first().and_then(|arg| arg.as_ref())?;
    if !is_static_slot_config(definition) {
        return None;
    }
    let recipe = SlotRecipe::from_literal(definition)?;
    let variant_names = recipe
        .variants
        .iter()
        .map(|group| group.name.as_str())
        .collect::<Vec<_>>();
    if !compounds_select_declared_variants(
        &variant_names,
        recipe
            .compound_variants
            .iter()
            .map(|compound| &compound.conditions),
    ) {
        return None;
    }
    let mut printed = print_specialized_sva(system, &recipe)?;
    let mut preserved = Vec::new();
    let attach_surface = usage == RecipeUsage::Escapes;
    let memo = usage == RecipeUsage::Called && !recipe.variants.is_empty();
    if attach_surface {
        let config_span = *arg_spans.first()?;
        let config = super::resolve::span_slice(source, config_span)?;
        printed.code = print_complete_sva_surface(&printed.code, config, &recipe);
        preserved.push(config_span);
    } else if memo {
        printed.code = print_memo(
            &printed.code,
            &sva_variant_map(&recipe),
            !recipe.compound_variants.is_empty(),
        );
    }
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content: printed.code,
        preserved,
        helper: recipe_helper_facts(printed.needs_cx, attach_surface, memo),
    })
}

fn recipe_helper_facts(needs_cx: bool, attach_surface: bool, memo: bool) -> TransformHelperFacts {
    TransformHelperFacts {
        needs_cx,
        needs_attach_recipe: attach_surface,
        needs_memo_recipe: memo,
        ..TransformHelperFacts::none()
    }
}

/// The runtime memo keys on declared variants only, so a compound selecting on anything else
/// would return stale classes. Such configs stay on the runtime (`cva` types reject them anyway).
fn compounds_select_declared_variants<'a>(
    variant_names: &[&str],
    mut compounds: impl Iterator<Item = &'a Vec<(String, Vec<String>)>>,
) -> bool {
    compounds.all(|conditions| {
        conditions
            .iter()
            .all(|(name, _)| variant_names.contains(&name.as_str()))
    })
}

/// Call-only local recipes memoize directly; escaping ones memoize inside `attachRecipe`.
fn print_memo(callable: &str, variant_map: &str, has_compounds: bool) -> String {
    let compounds = if has_compounds { ", 1" } else { "" };
    format!("/* @__PURE__ */ {MEMO_HELPER_LOCAL}({callable}, {variant_map}{compounds})")
}

fn cva_variant_map(recipe: &Recipe) -> String {
    print_variant_map(recipe.variants.iter().map(|group| {
        (
            group.name.as_str(),
            group.options.iter().map(|option| option.key.as_str()),
        )
    }))
}

fn sva_variant_map(recipe: &SlotRecipe) -> String {
    print_variant_map(recipe.variants.iter().map(|group| {
        (
            group.name.as_str(),
            group.options.iter().map(|option| option.key.as_str()),
        )
    }))
}

struct SpecializedRecipePrint {
    code: String,
    needs_cx: bool,
}

fn recipe_config_source(source: &str, span: pandacss_shared::Span, definition: &Literal) -> String {
    let expression = super::resolve::span_slice(source, span).unwrap_or("{}");
    if is_recipe_config(definition) {
        expression.to_owned()
    } else {
        format!("{{ base: {expression} }}")
    }
}

fn print_complete_cva_surface(callable: &str, config: &str, recipe: &Recipe) -> String {
    let keys = print_variant_keys(recipe.variants.iter().map(|group| group.name.as_str()));
    let map = cva_variant_map(recipe);
    format!("/* @__PURE__ */ {RECIPE_HELPER_LOCAL}({callable}, {config}, {keys}, {map})")
}

fn print_complete_sva_surface(callable: &str, config: &str, recipe: &SlotRecipe) -> String {
    let slot_names = if recipe.slots.is_empty() {
        recipe.base.iter().map(|(slot, _)| slot).collect::<Vec<_>>()
    } else {
        recipe.slots.iter().collect::<Vec<_>>()
    };
    let keys = print_variant_keys(recipe.variants.iter().map(|group| group.name.as_str()));
    let map = sva_variant_map(recipe);
    let class_name_map = recipe.class_name.as_ref().map_or_else(
        || "{}".to_owned(),
        |class_name| {
            js::object(
                slot_names
                    .iter()
                    .map(|slot| js::field(slot, js::string(&format!("{class_name}__{slot}")))),
            )
        },
    );
    format!(
        "/* @__PURE__ */ {RECIPE_HELPER_LOCAL}({callable}, {config}, {keys}, {map}, {class_name_map})"
    )
}

fn print_variant_map<'a, O>(groups: impl Iterator<Item = (&'a str, O)>) -> String
where
    O: Iterator<Item = &'a str>,
{
    js::object(groups.map(|(name, options)| {
        let values = options.map(js::string).collect::<Vec<_>>().join(", ");
        js::field(name, format!("[{values}]"))
    }))
}

fn print_variant_keys<'a>(keys: impl Iterator<Item = &'a str>) -> String {
    format!("[{}]", keys.map(js::string).collect::<Vec<_>>().join(", "))
}

struct ClassFragment {
    code: String,
    optional: bool,
}

impl ClassFragment {
    fn static_value(code: String) -> Self {
        Self {
            code,
            optional: false,
        }
    }

    fn optional(code: String) -> Self {
        Self {
            code,
            optional: true,
        }
    }
}

fn print_specialized_cva(
    system: &System,
    source: &str,
    recipe: &Recipe,
    style: Option<&StyleTree>,
) -> Option<SpecializedRecipePrint> {
    let selections = selection_names(
        recipe.variants.iter().map(|group| group.name.as_str()),
        recipe
            .compound_variants
            .iter()
            .flat_map(|compound| compound.conditions.iter().map(|(name, _)| name.as_str())),
        &recipe.default_variants,
    );
    let setup = print_selection_setup(&selections, &recipe.default_variants);
    let mut fragments = Vec::new();

    if let Some(base) = &recipe.base {
        let base_tree = style.and_then(|tree| style_lower::style_tree_object_entry(tree, "base"));
        match print_recipe_base(system, source, base, base_tree) {
            Some(base) => fragments.push(ClassFragment::static_value(base)),
            // An empty base has no classes; any other base the encoder can't print stays on the runtime.
            None if matches!(base, Literal::Object(entries) if entries.is_empty()) => {}
            None => return None,
        }
    }

    for group in &recipe.variants {
        let index = selection_index(&selections, &group.name)?;
        if let VariantLookupPrint::Code(lookup) =
            print_variant_lookup(system, &group.options, index)?
        {
            fragments.push(ClassFragment::optional(lookup));
        }
    }

    for compound in &recipe.compound_variants {
        let classes = if let Some(class_name) = &compound.class_name {
            class_name.clone()
        } else {
            system
                .class_names_for_style_literal(&compound.css)?
                .join(" ")
        };
        if classes.is_empty() {
            continue;
        }
        let condition = print_compound_condition(&compound.conditions, &selections)?;
        fragments.push(ClassFragment::optional(format!(
            "{condition} && {}",
            js::string(&classes)
        )));
    }

    Some(print_specialized_function(&setup, &fragments))
}

fn print_specialized_sva(system: &System, recipe: &SlotRecipe) -> Option<SpecializedRecipePrint> {
    let selections = selection_names(
        recipe.variants.iter().map(|group| group.name.as_str()),
        recipe
            .compound_variants
            .iter()
            .flat_map(|compound| compound.conditions.iter().map(|(name, _)| name.as_str())),
        &recipe.default_variants,
    );
    let setup = print_selection_setup(&selections, &recipe.default_variants);
    let mut needs_cx = false;
    let mut slots = Vec::with_capacity(recipe.slots.len());

    for slot in &recipe.slots {
        let mut fragments = Vec::new();
        if let Some((_, base)) = recipe.base.iter().find(|(name, _)| name == slot) {
            let classes = system.class_names_for_style_literal(base)?.join(" ");
            if !classes.is_empty() {
                fragments.push(ClassFragment::static_value(js::string(&classes)));
            }
        }
        if let Some(class_name) = &recipe.class_name {
            fragments.push(ClassFragment::static_value(js::string(&format!(
                "{class_name}__{slot}"
            ))));
        }

        for group in &recipe.variants {
            let index = selection_index(&selections, &group.name)?;
            if let VariantLookupPrint::Code(lookup) =
                print_slot_variant_lookup(system, &group.options, slot, index)?
            {
                fragments.push(ClassFragment::optional(lookup));
            }
        }

        for compound in &recipe.compound_variants {
            let classes = if let Some(class_name) = &compound.class_name {
                class_name.clone()
            } else if let Some((_, style)) = compound.css.iter().find(|(name, _)| name == slot) {
                system.class_names_for_style_literal(style)?.join(" ")
            } else {
                continue;
            };
            if classes.is_empty() {
                continue;
            }
            let condition = print_compound_condition(&compound.conditions, &selections)?;
            fragments.push(ClassFragment::optional(format!(
                "{condition} && {}",
                js::string(&classes)
            )));
        }

        let value = print_class_fragments(&fragments);
        needs_cx |= value.needs_cx;
        slots.push(js::field(slot, value.code));
    }

    let result = js::object(slots);
    let body = if setup.is_empty() {
        format!("(p = {{}}) => ({result})")
    } else {
        format!("(p = {{}}) => {{ p ??= {{}}; {setup} return {result}; }}")
    };
    Some(SpecializedRecipePrint {
        code: body,
        needs_cx,
    })
}

fn selection_names<'a>(
    variants: impl Iterator<Item = &'a str>,
    compounds: impl Iterator<Item = &'a str>,
    defaults: &'a [(String, String)],
) -> Vec<String> {
    let mut names = Vec::new();
    for name in variants
        .chain(compounds)
        .chain(defaults.iter().map(|(name, _)| name.as_str()))
    {
        if !names.iter().any(|existing| existing == name) {
            names.push(name.to_owned());
        }
    }
    names
}

fn selection_index(selections: &[String], name: &str) -> Option<usize> {
    selections.iter().position(|selection| selection == name)
}

fn print_selection_setup(selections: &[String], defaults: &[(String, String)]) -> String {
    selections
        .iter()
        .enumerate()
        .map(|(index, name)| {
            let read = format!("p[{}]", js::string(name));
            let default = defaults
                .iter()
                .find(|(default_name, _)| default_name == name)
                .map_or_else(
                    || "void 0".to_owned(),
                    |(_, value)| format_variant_value(value),
                );
            format!(
                "const _p{index} = {read}, v{index} = _p{index} === void 0 ? {default} : _p{index};"
            )
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn print_variant_lookup(
    system: &System,
    options: &[VariantOption],
    selection: usize,
) -> Option<VariantLookupPrint> {
    let entries = options
        .iter()
        .map(|option| {
            let classes = system
                .class_names_for_style_literal(&option.style)?
                .join(" ");
            Some((!classes.is_empty()).then(|| js::field(&option.key, js::string(&classes))))
        })
        .collect::<Option<Vec<_>>>()?;
    let entries = entries.into_iter().flatten().collect::<Vec<_>>();
    if entries.is_empty() {
        return Some(VariantLookupPrint::Empty);
    }
    Some(VariantLookupPrint::Code(format!(
        "{}[v{selection}]",
        js::object(entries)
    )))
}

fn print_slot_variant_lookup(
    system: &System,
    options: &[SlotVariantOption],
    slot: &str,
    selection: usize,
) -> Option<VariantLookupPrint> {
    let entries = options
        .iter()
        .filter_map(|option| {
            option
                .styles
                .iter()
                .find(|(name, _)| name == slot)
                .map(|(_, style)| (option, style))
        })
        .map(|(option, style)| {
            let classes = system.class_names_for_style_literal(style)?.join(" ");
            Some((!classes.is_empty()).then(|| js::field(&option.key, js::string(&classes))))
        })
        .collect::<Option<Vec<_>>>()?;
    let entries = entries.into_iter().flatten().collect::<Vec<_>>();
    if entries.is_empty() {
        return Some(VariantLookupPrint::Empty);
    }
    Some(VariantLookupPrint::Code(format!(
        "{}[v{selection}]",
        js::object(entries)
    )))
}

enum VariantLookupPrint {
    Empty,
    Code(String),
}

fn print_compound_condition(
    conditions: &[(String, Vec<String>)],
    selections: &[String],
) -> Option<String> {
    if conditions.is_empty() {
        return Some("true".to_owned());
    }
    conditions
        .iter()
        .map(|(name, values)| {
            let index = selection_index(selections, name)?;
            if values.is_empty() {
                return Some("false".to_owned());
            }
            let comparisons = values
                .iter()
                .map(|value| format!("v{index} === {}", format_variant_value(value)))
                .collect::<Vec<_>>();
            Some(if comparisons.len() == 1 {
                comparisons[0].clone()
            } else {
                format!("({})", comparisons.join(" || "))
            })
        })
        .collect::<Option<Vec<_>>>()
        .map(|conditions| conditions.join(" && "))
}

fn print_specialized_function(setup: &str, fragments: &[ClassFragment]) -> SpecializedRecipePrint {
    let result = print_class_fragments(fragments);
    let code = if setup.is_empty() {
        format!("(p = {{}}) => {}", result.code)
    } else {
        format!(
            "(p = {{}}) => {{ p ??= {{}}; {setup} return {}; }}",
            result.code
        )
    };
    SpecializedRecipePrint {
        code,
        needs_cx: result.needs_cx,
    }
}

struct ClassFragmentsPrint {
    code: String,
    needs_cx: bool,
}

fn print_class_fragments(fragments: &[ClassFragment]) -> ClassFragmentsPrint {
    match fragments {
        [] => ClassFragmentsPrint {
            code: "''".to_owned(),
            needs_cx: false,
        },
        [only] => ClassFragmentsPrint {
            code: if only.optional {
                format!("({}) || ''", only.code)
            } else {
                only.code.clone()
            },
            needs_cx: false,
        },
        many => ClassFragmentsPrint {
            code: format!(
                "{CX_HELPER_LOCAL}({})",
                many.iter()
                    .map(|fragment| fragment.code.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            needs_cx: true,
        },
    }
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

/// Booleans stay booleans so the runtime's strict compound matching sees the prop value.
fn format_variant_value(value: &str) -> String {
    match value {
        "true" | "false" => value.to_owned(),
        other => format!("'{}'", js::escape(other)),
    }
}

/// `styled('tag', config)` / `styled.tag(config)`: mark the factory call pure so a component whose
/// every use folded away can be dropped. The config stays a plain object for styled-system's `cva`.
pub(crate) fn rewrite_for_styled_call(
    source: &str,
    call: &pandacss_extractor::ExtractedCall,
) -> Option<Rewrite> {
    if call.category != pandacss_extractor::MatchCategory::Jsx || call.jsx_recipe_ident.is_some() {
        return None;
    }
    if !is_jsx_factory_call(call) || !styled_config_arg(call).is_some_and(is_static_style_literal) {
        return None;
    }
    let callee_span = call.facts.callee_span;
    let callee = super::resolve::span_slice(source, callee_span)?;
    Some(Rewrite {
        start: callee_span.start,
        end: callee_span.end,
        content: format!("/* @__PURE__ */ {callee}"),
        // The replacement re-emits the original callee. Keep its resolved
        // import reference live during dead-import cleanup.
        preserved: vec![callee_span],
        helper: TransformHelperFacts::none(),
    })
}

fn is_jsx_factory_call(call: &pandacss_extractor::ExtractedCall) -> bool {
    matches!(
        call.facts.callee_kind,
        pandacss_extractor::CallCalleeKind::Direct
            | pandacss_extractor::CallCalleeKind::StaticMember
    )
}

fn styled_config_arg(call: &pandacss_extractor::ExtractedCall) -> Option<&Literal> {
    match call.facts.callee_kind {
        pandacss_extractor::CallCalleeKind::Direct => {
            let tag = call.data.first().and_then(|arg| arg.as_ref())?;
            if !matches!(tag, Literal::String(_)) {
                return None;
            }
            call.data.get(1).and_then(|arg| arg.as_ref())
        }
        pandacss_extractor::CallCalleeKind::StaticMember => {
            call.data.first().and_then(|arg| arg.as_ref())
        }
    }
}
