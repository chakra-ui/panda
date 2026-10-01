use pandacss_encoder::Encoder;
use pandacss_extractor::{ExtractUsage, LineIndex, MatchCategory, Span};
use pandacss_literal::Literal;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_system::{System, is_recipe_config, literal_entries};
use pandacss_utility::ShorthandPolicy;

use crate::{TransformTargets, recipe_inline};

pub(super) fn nested_property_diagnostics(
    system: &System,
    source: &str,
    path: &str,
    extracted: &ExtractUsage,
    targets: &TransformTargets,
) -> Vec<Diagnostic> {
    if extracted.calls.is_empty() && (!targets.jsx_enabled() || extracted.jsx.is_empty()) {
        return Vec::new();
    }
    let mut diagnostics = Vec::new();
    let mut encoder = Encoder::with_conditions(system.conditions().clone());
    let mut line_index = None;

    for call in &extracted.calls {
        match call.category {
            MatchCategory::Css if targets.css_enabled() && !call.facts.raw => {
                match call.name.as_str() {
                    "css" => {
                        for arg in call.data.iter().flatten() {
                            system.process_css_arg(&mut encoder, arg);
                        }
                    }
                    "cva" => {
                        if let Some(recipe) = call
                            .data
                            .first()
                            .and_then(Option::as_ref)
                            .and_then(Recipe::from_literal)
                        {
                            system.process_recipe_atoms(&mut encoder, &recipe);
                        }
                    }
                    "sva" => {
                        if let Some(recipe) = call
                            .data
                            .first()
                            .and_then(Option::as_ref)
                            .and_then(SlotRecipe::from_literal)
                        {
                            system.process_slot_recipe_atoms(&mut encoder, &recipe);
                        }
                    }
                    _ => {}
                }
            }
            MatchCategory::Jsx if targets.jsx_enabled() => {
                if let Some(config) = recipe_inline::styled_config_arg(call) {
                    if is_recipe_config(config) {
                        if let Some(recipe) = Recipe::from_literal(config) {
                            system.process_recipe_atoms(&mut encoder, &recipe);
                        }
                    } else {
                        system.process_style_props(
                            &mut encoder,
                            config,
                            ShorthandPolicy::UserFacing,
                        );
                    }
                }
            }
            _ => continue,
        }
        push_diagnostic(
            system,
            &mut encoder,
            call.span,
            path,
            source,
            &mut line_index,
            &mut diagnostics,
        );
    }

    if targets.jsx_enabled() {
        for jsx in &extracted.jsx {
            let recipe_names = system.jsx_recipe_names(&jsx.name);
            if recipe_names.is_empty() {
                system.process_style_props(&mut encoder, &jsx.data, ShorthandPolicy::UserFacing);
            } else if let Some(entries) = literal_entries(&jsx.data) {
                for (key, value) in entries {
                    if key == "css" {
                        system.process_style_props(
                            &mut encoder,
                            &Literal::Object(vec![(key.clone(), value.clone())]),
                            ShorthandPolicy::UserFacing,
                        );
                    }
                }
            }
            push_diagnostic(
                system,
                &mut encoder,
                jsx.span,
                path,
                source,
                &mut line_index,
                &mut diagnostics,
            );
        }
    }

    diagnostics
}

fn push_diagnostic<'a>(
    system: &System,
    encoder: &mut Encoder<pandacss_encoder::ConditionSet>,
    span: Span,
    path: &str,
    source: &'a str,
    line_index: &mut Option<LineIndex<'a>>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    if let Some(nested) = encoder.take_nested_property() {
        let mut diagnostic = Diagnostic::warning(
            diagnostic_codes::NESTED_PROPERTY,
            system.nested_property_message(&nested),
        )
        .with_file(path)
        .with_span(span);
        diagnostic.location = Some(
            line_index
                .get_or_insert_with(|| LineIndex::new(source))
                .locate_range(span.start, span.end),
        );
        diagnostics.push(diagnostic);
    }
}
