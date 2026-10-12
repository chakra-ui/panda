use pandacss_encoder::{Atom, AtomValue, EncodedRecipesSnapshot};
use pandacss_shared::hyphenate_property;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use pandacss_utility::Utility;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

use super::{
    EmitContext, UsageMarks, atom_value_to_string, collect_css_var_refs, collect_keyframe_refs,
    collect_token_ref_vars, composition_style_object, is_composition_prop, merge_keyframes,
    raw_css_var_name, seed_static_theme_token_vars, static_theme_condition_filter, token_var_iter,
};
use crate::StyleRequirement;

/// A configured asset whose own styles or value can pull in more assets.
#[derive(Clone, PartialEq, Eq, Hash)]
enum Asset {
    Token(String),
    Keyframe(String),
    Composition(&'static str, String),
}

/// Records each asset once per place that references it directly. A config place
/// (`globalCss`, `recipes.button`) or a parent asset (`via colors.brand`).
struct RequirementGraph<'a, 'cx> {
    cx: &'cx EmitContext<'a>,
    dictionary: Option<&'cx TokenDictionary>,
    keyframes: Option<&'cx serde_json::Map<String, Value>>,
    tokens: FxHashMap<String, TokenNode>,
    /// Assets to expand, with the place to credit instead of `via` for inline keyframes.
    pending: Vec<(Asset, Option<String>)>,
    expanded: FxHashSet<Asset>,
    output: Vec<StyleRequirement>,
}

struct TokenNode {
    path: String,
    values: Vec<String>,
    animation: bool,
}

pub(crate) fn collect_style_requirements(
    input: &crate::StylesheetInput<'_>,
    utility: &Utility,
    dictionary: Option<&TokenDictionary>,
    generated: &[Atom],
) -> Vec<StyleRequirement> {
    let cx = EmitContext::new(input.config, utility, input.utility_styles, dictionary);
    let keyframes = merge_keyframes(&input.config.theme.keyframes, input.inline_keyframes);
    let mut graph = RequirementGraph::new(&cx, dictionary, keyframes.as_ref());

    let mut marks = UsageMarks::for_report();
    cx.collect_styles_usage(
        &input.config.global_css,
        dictionary,
        graph.keyframes,
        &mut marks,
    );
    graph.add("globalCss", marks);
    let mut marks = UsageMarks::for_report();
    cx.collect_global_vars_usage(dictionary, &mut marks);
    graph.add("globalVars", marks);

    for (place, atoms) in [
        ("sources", input.atoms),
        ("staticCss.css", generated),
        ("staticCss.patterns", input.static_pattern_atoms),
    ] {
        let mut marks = UsageMarks::for_report();
        for atom in atoms {
            cx.collect_atom_usage(atom, dictionary, graph.keyframes, &mut marks);
        }
        graph.add(place, marks);
    }
    graph.add_recipes("recipes", input.encoded_recipes, false);
    if let Some(recipes) = input.static_encoded_recipes {
        graph.add_recipes("staticCss.recipes", recipes, true);
    }
    let mut marks = UsageMarks::for_report();
    collect_token_ref_vars(input.token_refs, dictionary, &mut marks.token_vars);
    graph.add("sources", marks);
    let mut marks = UsageMarks::for_report();
    cx.collect_view_transitions_usage(
        input.view_transitions,
        dictionary,
        graph.keyframes,
        &mut marks,
    );
    graph.add("viewTransitions", marks);

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
        let mut marks = UsageMarks::for_report();
        marks.token_vars = seed_static_theme_token_vars(&vars, FxHashSet::default());
        graph.add("staticCss.themes", marks);
    }
    graph.finish()
}

impl<'a, 'cx> RequirementGraph<'a, 'cx> {
    fn new(
        cx: &'cx EmitContext<'a>,
        dictionary: Option<&'cx TokenDictionary>,
        keyframes: Option<&'cx serde_json::Map<String, Value>>,
    ) -> Self {
        let mut tokens = FxHashMap::<String, TokenNode>::default();
        if let Some(dictionary) = dictionary {
            // Keyed by variable, so a token defined only under a condition still has a node.
            for token in dictionary.iter() {
                if let Some(name) = raw_css_var_name(&token.var) {
                    tokens.entry(name.to_owned()).or_insert_with(|| TokenNode {
                        path: token.path.to_string(),
                        values: Vec::new(),
                        animation: token.category == TokenCategory::Animations,
                    });
                }
            }
            let vars = dictionary.css_vars_with_theme_filter(|_| true);
            for var in token_var_iter(&vars) {
                if let Some(node) = tokens.get_mut(var.name) {
                    node.values.push(var.value.to_owned());
                }
            }
        }
        Self {
            cx,
            dictionary,
            keyframes,
            tokens,
            pending: Vec::new(),
            expanded: FxHashSet::default(),
            output: Vec::new(),
        }
    }

    fn push(&mut self, kind: &'static str, name: String, place: &str) {
        self.output.push(StyleRequirement {
            kind,
            name,
            reason: place.to_owned(),
        });
    }

    /// Records what `marks` references directly and queues those assets for expansion.
    fn add(&mut self, place: &str, marks: UsageMarks) {
        let mut tokens = marks
            .token_vars
            .iter()
            .filter(|var| self.tokens.contains_key(*var))
            .cloned()
            .collect::<Vec<_>>();
        tokens.sort_unstable();
        for var in tokens {
            let path = self.tokens[&var].path.clone();
            self.push("token", path, place);
            self.pending.push((Asset::Token(var), None));
        }
        for name in marks.keyframes {
            if self.cx.config.theme.keyframes.get(&name).is_some() {
                self.push("keyframe", name.clone(), place);
                self.pending.push((Asset::Keyframe(name), None));
            } else {
                self.pending
                    .push((Asset::Keyframe(name), Some(place.to_owned())));
            }
        }
        let report = marks.report.unwrap_or_default();
        for (prop, value) in report.compositions {
            if self.cx.utility.property_keys(prop).contains(&value) {
                self.push("composition", format!("{prop}s.{value}"), place);
                self.pending.push((Asset::Composition(prop, value), None));
            }
        }
        for name in report.utilities {
            if let Some(utility) = self.utility_name(&name) {
                self.push("utility", utility, place);
            }
        }
    }

    fn add_recipes(&mut self, place: &str, recipes: &EncodedRecipesSnapshot, report_recipe: bool) {
        let cx = self.cx;
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
            let mut marks = UsageMarks::for_report();
            let mut entries = Vec::with_capacity(group.entries.len());
            for entry in &group.entries {
                marks.mark_utility(cx.utility.resolve_shorthand(&entry.prop));
                if is_composition_prop(&entry.prop) {
                    if let Some(value) = atom_value_to_string(&entry.value) {
                        marks.mark_composition(&entry.prop, &value);
                    }
                } else {
                    entries.push(entry.clone());
                }
            }
            for rule in cx.recipe_group_rules(&group.class_name, &group.conditions, &entries) {
                EmitContext::collect_declarations_usage(
                    &rule.declarations,
                    self.dictionary,
                    self.keyframes,
                    &mut marks,
                );
            }
            self.add(&place, marks);
        }
        let mut marks = UsageMarks::for_report();
        for atom in &recipes.atomic {
            cx.collect_atom_usage(atom, self.dictionary, self.keyframes, &mut marks);
        }
        self.add(place, marks);
    }

    fn finish(mut self) -> Vec<StyleRequirement> {
        while let Some((asset, inline_place)) = self.pending.pop() {
            if !self.expanded.insert(asset.clone()) {
                continue;
            }
            let (label, mut marks) = self.dependencies(&asset);
            if let Asset::Token(var) = &asset {
                marks.token_vars.remove(var);
            }
            let place = inline_place.unwrap_or_else(|| format!("via {label}"));
            self.add(&place, marks);
        }
        self.output
    }

    fn dependencies(&self, asset: &Asset) -> (String, UsageMarks) {
        let mut marks = UsageMarks::for_report();
        let label = match asset {
            Asset::Token(var) => {
                let node = &self.tokens[var];
                for value in &node.values {
                    collect_css_var_refs(value, &mut marks.token_vars);
                    if node.animation {
                        collect_keyframe_refs(value, None, self.keyframes, &mut marks.keyframes);
                    }
                }
                node.path.clone()
            }
            Asset::Keyframe(name) => {
                if let Some(steps) = self
                    .keyframes
                    .and_then(|frames| frames.get(name))
                    .and_then(Value::as_object)
                {
                    for step in steps.values() {
                        self.cx.collect_styles_usage(
                            step,
                            self.dictionary,
                            self.keyframes,
                            &mut marks,
                        );
                    }
                }
                format!("keyframes.{name}")
            }
            Asset::Composition(prop, value) => {
                let atom_value = AtomValue::String(value.as_str().into());
                let result = self.cx.transform_atom_styles(prop, value, &atom_value);
                if let Some(styles) = composition_style_object(prop, &result.styles) {
                    self.cx.collect_grouped_style_usage(
                        styles,
                        false,
                        self.dictionary,
                        self.keyframes,
                        &mut marks,
                    );
                }
                format!("{prop}s.{value}")
            }
        };
        (label, marks)
    }

    fn utility_name(&self, name: &str) -> Option<String> {
        let canonical = self.cx.utility.resolve_shorthand(name);
        if self.cx.utility.is_known(canonical) {
            return Some(canonical.to_owned());
        }
        self.cx
            .config
            .utilities
            .keys()
            .find(|key| hyphenate_property(key) == name)
            .cloned()
    }
}
