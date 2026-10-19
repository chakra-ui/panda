use pandacss_encoder::{Atom, EncodedRecipesSnapshot};
use pandacss_tokens::TokenDictionary;
use pandacss_utility::Utility;
use rustc_hash::FxHashSet;
use serde_json::Value;

use super::references::{StyleReference, StyleReferences};
use super::{
    merge_keyframes, raw_css_var_name, seed_static_theme_token_vars, static_theme_condition_filter,
};
use crate::StyleRequirement;

/// Records each reference once per place that reads it directly: a config place
/// (`globalCss`, `recipes.button`) or a parent asset (`via colors.brand`).
struct RequirementGraph<'r, 'a> {
    references: &'r StyleReferences<'a>,
    /// Assets to expand, with the place to credit instead of `via` for inline keyframes.
    pending: Vec<(StyleReference, Option<String>)>,
    expanded: FxHashSet<StyleReference>,
    output: Vec<StyleRequirement>,
}

pub(crate) fn collect_style_requirements(
    input: &crate::StylesheetInput<'_>,
    utility: &Utility,
    dictionary: Option<&TokenDictionary>,
    generated: &[Atom],
) -> Vec<StyleRequirement> {
    let keyframes = merge_keyframes(&input.config.theme.keyframes, input.inline_keyframes);
    let references = StyleReferences::with_overrides(
        input.config,
        utility,
        dictionary,
        input.utility_styles,
        keyframes.as_ref(),
    );
    let mut graph = RequirementGraph {
        references: &references,
        pending: Vec::new(),
        expanded: FxHashSet::default(),
        output: Vec::new(),
    };

    graph.add(
        "globalCss",
        references.style_object(&input.config.global_css),
    );
    graph.add("globalVars", references.global_vars());
    for (place, atoms) in [
        ("sources", input.atoms),
        ("staticCss.css", generated),
        ("staticCss.patterns", input.static_pattern_atoms),
    ] {
        for atom in atoms {
            graph.add(place, references.atom(atom));
        }
    }
    graph.add_recipes("recipes", input.encoded_recipes, false);
    if let Some(recipes) = input.static_encoded_recipes {
        graph.add_recipes("staticCss.recipes", recipes, true);
    }
    graph.add(
        "sources",
        references.values(input.token_refs.iter().map(String::as_str)),
    );
    for style in input.view_transitions {
        for body in style.slot_bodies().into_iter().filter_map(|(_, body)| body) {
            graph.add("viewTransitions", references.style_object(body));
        }
    }

    if let Some(patterns) = input
        .config
        .static_css
        .get("patterns")
        .and_then(Value::as_object)
    {
        for name in patterns.keys() {
            graph.push(
                "pattern",
                name.clone(),
                &format!("staticCss.patterns.{name}"),
            );
        }
    }
    if let Some(dictionary) = dictionary
        && let Some(filter) = static_theme_condition_filter(input.config)
    {
        let vars = dictionary.css_vars_with_theme_filter(|condition| filter.includes(condition));
        let seeded = seed_static_theme_token_vars(&vars, FxHashSet::default());
        let mut paths = dictionary
            .iter()
            .filter(|token| raw_css_var_name(&token.var).is_some_and(|name| seeded.contains(name)))
            .map(|token| StyleReference::Token(token.path.to_string()))
            .collect::<Vec<_>>();
        paths.sort_unstable();
        paths.dedup();
        graph.add("staticCss.themes", paths);
    }
    graph.finish()
}

impl RequirementGraph<'_, '_> {
    fn push(&mut self, kind: &'static str, name: String, place: &str) {
        self.output.push(StyleRequirement {
            kind,
            name,
            reason: place.to_owned(),
        });
    }

    /// Records direct references and queues the expandable ones.
    fn add(&mut self, place: &str, references: Vec<StyleReference>) {
        for reference in references {
            match &reference {
                StyleReference::Token(path) => self.push("token", path.clone(), place),
                StyleReference::Composition(path) => self.push("composition", path.clone(), place),
                StyleReference::Utility(name) => {
                    self.push("utility", name.clone(), place);
                    continue;
                }
                StyleReference::Keyframe(name) => {
                    // Inline keyframes from source aren't configured: credit what they use to this place.
                    if !self.references.is_configured_keyframe(name) {
                        self.pending.push((reference, Some(place.to_owned())));
                        continue;
                    }
                    self.push("keyframe", name.clone(), place);
                }
            }
            self.pending.push((reference, None));
        }
    }

    fn add_recipes(&mut self, place: &str, recipes: &EncodedRecipesSnapshot, report_recipe: bool) {
        for group in recipes
            .base
            .iter()
            .chain(&recipes.variants)
            .chain(&recipes.compounds)
        {
            let place = format!("{place}.{}", group.recipe);
            if report_recipe {
                self.push("recipe", group.recipe.to_string(), &place);
            }
            self.add(&place, self.references.recipe_group(group));
        }
        for atom in &recipes.atomic {
            self.add(place, self.references.atom(atom));
        }
    }

    fn finish(mut self) -> Vec<StyleRequirement> {
        while let Some((reference, inline_place)) = self.pending.pop() {
            if !self.expanded.insert(reference.clone()) {
                continue;
            }
            let place = inline_place.unwrap_or_else(|| format!("via {}", label(&reference)));
            self.add(&place, self.references.dependencies(&reference));
        }
        self.output
    }
}

fn label(reference: &StyleReference) -> String {
    match reference {
        StyleReference::Token(path) | StyleReference::Composition(path) => path.clone(),
        StyleReference::Keyframe(name) => format!("keyframes.{name}"),
        StyleReference::Utility(name) => name.clone(),
    }
}
