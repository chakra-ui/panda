//! Recipe compilation, resolution, and the incremental encoded-recipe cache.
//!
//! Three layers:
//! - [`RecipeRegistry`] compiles config recipe/slot-recipe definitions into
//!   resolved nodes (`base`, `variants`, `compoundVariants` pre-encoded to
//!   atoms / style entries) and indexes them for JSX-name lookup.
//! - Usage resolution (`process_usage`) takes a call/JSX usage's props, picks
//!   the selected variants (with config defaults), and emits the matching
//!   style groups.
//! - `EncodedRecipesCache` keeps a refcounted union of encoded groups across
//!   files so watch-mode add/remove is O(changed), mirroring the atom cache.

use regex::RegexSet;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;
use smallvec::SmallVec;
use std::borrow::Cow;
use std::collections::BTreeMap;

use pandacss_config::UserConfig;
use pandacss_encoder::{
    Atom, AtomValue, ConditionMatcher, EncodedRecipesSnapshot, Encoder, RecipeStyleEntry,
    RecipeStyleGroup, RecipeStyleGroupSnapshot, atom_value_sort_key, compare_atoms_by_emit_order,
};
use pandacss_extractor::{Diagnostic, Literal};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{number_to_js_string, push_number_to_js_string, split_important};
use pandacss_utility::{StyleNormalizer, Utility};

use crate::config::{RecipeDefinition, SlotRecipeDefinition};
use crate::{ProjectConditionMatcher, literal_entries};

/// Compiled config recipes, indexed for resolution and JSX-tag lookup.
/// `jsx_to_recipes` handles exact tag matches; `regex_jsx_*` handle the
/// regex-specifier matches via a single combined [`RegexSet`].
#[derive(Debug, Clone, Default)]
pub(crate) struct RecipeRegistry {
    recipes: FxHashMap<Box<str>, RecipeNode>,
    slot_recipes: FxHashMap<Box<str>, SlotRecipeNode>,
    jsx_to_recipes: FxHashMap<Box<str>, Vec<Box<str>>>,
    regex_jsx_patterns: Vec<String>,
    regex_jsx_recipes: Vec<Box<str>>,
    regex_jsx_set: Option<RegexSet>,
}

#[derive(Debug, Clone)]
struct RecipeNode {
    name: Box<str>,
    variant_props: FxHashSet<Box<str>>,
    default_variants: FxHashMap<Box<str>, Box<str>>,
    base: Option<ResolvedRecipePart>,
    variants: Vec<ResolvedVariantGroup>,
    compounds: Vec<ResolvedCompoundVariant>,
}

#[derive(Debug, Clone)]
struct SlotRecipeNode {
    name: Box<str>,
    variant_props: FxHashSet<Box<str>>,
    slots: Vec<String>,
    default_variants: FxHashMap<Box<str>, Box<str>>,
    base: FxHashMap<Box<str>, ResolvedRecipePart>,
    variants: Vec<ResolvedSlotVariantGroup>,
    compounds: Vec<ResolvedCompoundVariant>,
}

/// A `base` block or one variant option, pre-resolved: its class name plus the
/// style entries it contributes. `Resolved*` types are the compiled form the
/// registry holds so usage resolution is a lookup, not a re-parse.
#[derive(Debug, Clone)]
struct ResolvedRecipePart {
    class_name: Box<str>,
    entries: FxHashSet<RecipeStyleEntry>,
}

#[derive(Debug, Clone)]
struct ResolvedVariantGroup {
    name: Box<str>,
    options: FxHashMap<Box<str>, ResolvedRecipePart>,
}

#[derive(Debug, Clone)]
struct ResolvedSlotVariantGroup {
    name: Box<str>,
    options: FxHashMap<Box<str>, Vec<(Box<str>, ResolvedRecipePart)>>,
}

#[derive(Debug, Clone)]
struct ResolvedCompoundVariant {
    conditions: Vec<(Box<str>, Vec<Box<str>>)>,
    atoms: FxHashSet<Atom>,
}

pub(crate) struct StyleResolver<'a> {
    pub(crate) utility: Option<&'a Utility>,
    pub(crate) conditions: &'a ProjectConditionMatcher,
    pub(crate) breakpoints: &'a [String],
}

impl StyleResolver<'_> {
    fn atoms(&self, style: &Literal) -> FxHashSet<Atom> {
        let style = self.normalize_style_object(style);
        let mut encoder = Encoder::with_conditions(self.conditions.clone());
        encoder.process_atomic(style.as_ref());
        encoder.into_atoms()
    }

    fn recipe_entries(&self, style: &Literal) -> FxHashSet<RecipeStyleEntry> {
        self.recipe_entries_with_conditions(style, &SmallVec::new())
    }

    fn recipe_entries_with_conditions(
        &self,
        style: &Literal,
        prefix_conditions: &SmallVec<[Box<str>; 2]>,
    ) -> FxHashSet<RecipeStyleEntry> {
        let style = self.normalize_style_object(style);
        let mut entries = FxHashSet::default();
        walk_style_object(style.as_ref(), self.conditions, |leaf| {
            let Some(value) = literal_to_recipe_value(leaf.value) else {
                return;
            };
            let mut conditions = prefix_conditions.clone();
            conditions.extend(leaf.conditions);
            entries.insert(RecipeStyleEntry {
                prop: leaf.prop.into(),
                value: value.value,
                conditions,
                important: value.important,
            });
        });
        entries
    }

    fn normalize_style_object<'a>(&self, style: &'a Literal) -> Cow<'a, Literal> {
        StyleNormalizer {
            utility: self.utility,
            breakpoints: self.breakpoints,
            shorthand: true,
        }
        .normalize(style)
    }
}

impl RecipeRegistry {
    pub(crate) fn from_definitions(
        recipe_definitions: &[RecipeDefinition],
        slot_recipe_definitions: &[SlotRecipeDefinition],
        resolver: &StyleResolver<'_>,
    ) -> Self {
        let mut recipes = Self::default();
        recipes.collect_recipes(recipe_definitions, resolver);
        recipes.collect_slot_recipes(slot_recipe_definitions, resolver);
        recipes.rebuild_regex_jsx_set();
        recipes
    }

    fn collect_recipes(&mut self, recipes: &[RecipeDefinition], resolver: &StyleResolver<'_>) {
        for recipe in recipes {
            self.collect_jsx_matchers(&recipe.name, &recipe.jsx_names, &recipe.jsx_regexes);
            self.recipes.insert(
                recipe.name.clone().into_boxed_str(),
                RecipeNode {
                    name: recipe.name.clone().into_boxed_str(),
                    variant_props: recipe
                        .variant_props
                        .iter()
                        .cloned()
                        .map(String::into_boxed_str)
                        .collect(),
                    default_variants: default_variant_map(&recipe.recipe.default_variants),
                    base: resolve_recipe_base(&recipe.class_name, &recipe.recipe, resolver),
                    variants: resolve_recipe_variants(&recipe.class_name, &recipe.recipe, resolver),
                    compounds: resolve_recipe_compounds(&recipe.recipe, resolver),
                },
            );
        }
    }

    fn collect_slot_recipes(
        &mut self,
        recipes: &[SlotRecipeDefinition],
        resolver: &StyleResolver<'_>,
    ) {
        for recipe in recipes {
            self.collect_jsx_matchers(&recipe.name, &recipe.jsx_names, &recipe.jsx_regexes);
            self.slot_recipes.insert(
                recipe.name.clone().into_boxed_str(),
                SlotRecipeNode {
                    name: recipe.name.clone().into_boxed_str(),
                    variant_props: recipe
                        .variant_props
                        .iter()
                        .cloned()
                        .map(String::into_boxed_str)
                        .collect(),
                    slots: recipe.recipe.slots.clone(),
                    default_variants: default_variant_map(&recipe.recipe.default_variants),
                    base: resolve_slot_recipe_base(&recipe.class_name, &recipe.recipe, resolver),
                    variants: resolve_slot_recipe_variants(
                        &recipe.class_name,
                        &recipe.recipe,
                        resolver,
                    ),
                    compounds: resolve_slot_recipe_compounds(&recipe.recipe, resolver),
                },
            );
        }
    }

    fn collect_jsx_matchers(
        &mut self,
        name: &str,
        jsx_names: &[String],
        jsx_regexes: &[regex::Regex],
    ) {
        for jsx_name in jsx_names {
            self.insert_exact_jsx_matcher(jsx_name.clone(), name);
        }
        for regex in jsx_regexes {
            self.regex_jsx_patterns.push(regex.as_str().to_owned());
            self.regex_jsx_recipes.push(name.into());
        }
    }

    fn rebuild_regex_jsx_set(&mut self) {
        if self.regex_jsx_patterns.is_empty() {
            return;
        }
        self.regex_jsx_set = RegexSet::new(&self.regex_jsx_patterns).ok();
    }

    fn insert_exact_jsx_matcher(&mut self, jsx_name: String, recipe_name: &str) {
        self.jsx_to_recipes
            .entry(jsx_name.into_boxed_str())
            .or_default()
            .push(recipe_name.into());
    }

    pub(crate) fn find_by_jsx<'a>(&'a self, tag: &str) -> SmallVec<[&'a str; 2]> {
        let mut out = SmallVec::new();
        if let Some(names) = self.jsx_to_recipes.get(tag) {
            out.extend(names.iter().map(AsRef::as_ref));
        }
        if let Some(regex_set) = &self.regex_jsx_set {
            out.extend(
                regex_set
                    .matches(tag)
                    .into_iter()
                    .filter_map(|index| self.regex_jsx_recipes.get(index).map(AsRef::as_ref)),
            );
        }
        out
    }

    pub(crate) fn style_props_for_recipes(
        &self,
        recipe_names: &[&str],
        props: &Literal,
    ) -> Option<Literal> {
        let entries = literal_entries(props)?;

        let mut recipe_props = FxHashSet::default();
        for recipe_name in recipe_names {
            if let Some(props) = self.variant_props(recipe_name) {
                recipe_props.extend(props.iter().cloned());
            }
        }

        let mut style_entries = Vec::new();
        for (key, value) in entries {
            if !recipe_props.contains(key.as_str()) {
                style_entries.push((key.clone(), value.clone()));
            }
        }

        (!style_entries.is_empty()).then_some(Literal::Object(style_entries))
    }

    fn variant_props(&self, recipe_name: &str) -> Option<&FxHashSet<Box<str>>> {
        self.recipes
            .get(recipe_name)
            .map(|node| &node.variant_props)
            .or_else(|| {
                self.slot_recipes
                    .get(recipe_name)
                    .map(|node| &node.variant_props)
            })
    }

    fn recipe(&self, name: &str) -> Option<&RecipeNode> {
        self.recipes.get(name)
    }

    fn slot_recipe(&self, name: &str) -> Option<&SlotRecipeNode> {
        self.slot_recipes.get(name)
    }

    fn slot_class_name(class_name: &str, slot: &str) -> String {
        format!("{class_name}__{slot}")
    }

    pub(crate) fn process_static_css(
        &self,
        encoded: &mut EncodedRecipes,
        config: &UserConfig,
        conditions: &ProjectConditionMatcher,
        breakpoints: &[String],
    ) {
        let Some(rules_by_recipe) = static_recipe_rules(config) else {
            return;
        };

        let responsive = breakpoints
            .iter()
            .filter(|key| key.as_str() != "base")
            .cloned()
            .collect::<Vec<_>>();

        for (name, rules) in rules_by_recipe {
            if !self.has_recipe(&name) {
                continue;
            }
            encoded.process_usage(self, &name, &Literal::Object(Vec::new()), conditions);
            self.extend_compound_atoms(&name, &mut encoded.atomic);
            let options = self.variant_options(&name);
            for rule in rules {
                for selected in Self::static_rule_selections(&rule, &responsive, &options) {
                    encoded.process_usage(self, &name, &selected, conditions);
                }
            }
        }
    }

    fn has_recipe(&self, name: &str) -> bool {
        self.recipes.contains_key(name) || self.slot_recipes.contains_key(name)
    }

    fn extend_compound_atoms(&self, name: &str, target: &mut FxHashSet<Atom>) {
        if let Some(node) = self.recipes.get(name) {
            target.extend(
                node.compounds
                    .iter()
                    .flat_map(|compound| compound.atoms.iter().cloned()),
            );
        }
        if let Some(node) = self.slot_recipes.get(name) {
            target.extend(
                node.compounds
                    .iter()
                    .flat_map(|compound| compound.atoms.iter().cloned()),
            );
        }
    }

    fn static_rule_selections(
        rule: &Literal,
        breakpoints: &[String],
        options: &FxHashMap<Box<str>, Vec<String>>,
    ) -> Vec<Literal> {
        if matches!(rule, Literal::String(value) if value == "*") {
            return options
                .iter()
                .flat_map(|(variant, values)| {
                    values.iter().map(move |value| {
                        Literal::Object(vec![(variant.to_string(), Literal::String(value.clone()))])
                    })
                })
                .collect();
        }

        let Literal::Object(entries) = rule else {
            return Vec::new();
        };
        let mut conditions = Vec::new();
        let mut responsive = false;
        for (key, value) in entries {
            match key.as_str() {
                "conditions" => conditions.extend(string_literals(value)),
                "responsive" => responsive = matches!(value, Literal::Bool(true)),
                _ => {}
            }
        }
        if responsive {
            conditions.extend(breakpoints.iter().cloned());
        }

        let mut out = Vec::new();
        for (variant, value) in entries {
            if matches!(variant.as_str(), "conditions" | "responsive") {
                continue;
            }
            let values = static_variant_values(value, options.get(variant.as_str()));
            out.extend(values.into_iter().map(|value| {
                let value = if conditions.is_empty() {
                    value
                } else {
                    conditional_static_value(&conditions, breakpoints, &value)
                };
                Literal::Object(vec![(variant.clone(), value)])
            }));
        }
        out
    }

    fn variant_options(&self, name: &str) -> FxHashMap<Box<str>, Vec<String>> {
        if let Some(node) = self.recipes.get(name) {
            return node
                .variants
                .iter()
                .map(|group| {
                    let mut values = group
                        .options
                        .keys()
                        .map(std::string::ToString::to_string)
                        .collect::<Vec<_>>();
                    values.sort();
                    (group.name.clone(), values)
                })
                .collect();
        }
        if let Some(node) = self.slot_recipes.get(name) {
            return node
                .variants
                .iter()
                .map(|group| {
                    let mut values = group
                        .options
                        .keys()
                        .map(std::string::ToString::to_string)
                        .collect::<Vec<_>>();
                    values.sort();
                    (group.name.clone(), values)
                })
                .collect();
        }
        FxHashMap::default()
    }
}

fn static_recipe_rules(config: &UserConfig) -> Option<BTreeMap<String, Vec<Literal>>> {
    let recipes = config.static_css.get("recipes");
    if recipes.is_none()
        && config
            .theme
            .recipes
            .values()
            .chain(config.theme.slot_recipes.values())
            .all(|recipe| recipe.static_css.is_null())
    {
        return None;
    }

    let use_all = matches!(recipes, Some(Value::String(value)) if value == "*");
    let mut out = BTreeMap::new();
    if let Some(Value::Object(entries)) = recipes {
        for (name, rules) in entries {
            out.insert(name.clone(), static_rule_array(rules));
        }
    }

    for (name, recipe) in config
        .theme
        .recipes
        .iter()
        .chain(config.theme.slot_recipes.iter())
    {
        if use_all {
            out.insert(name.clone(), vec![Literal::String("*".to_owned())]);
        } else if !recipe.static_css.is_null() {
            out.insert(name.clone(), static_rule_array(&recipe.static_css));
        }
    }

    Some(out)
}

fn static_rule_array(value: &Value) -> Vec<Literal> {
    match value {
        Value::Array(items) => items.iter().filter_map(json_value_to_literal).collect(),
        _ => json_value_to_literal(value).into_iter().collect(),
    }
}

fn json_value_to_literal(value: &Value) -> Option<Literal> {
    match value {
        Value::String(value) => Some(Literal::String(value.clone())),
        Value::Number(value) => value.as_f64().map(Literal::Number),
        Value::Bool(value) => Some(Literal::Bool(*value)),
        Value::Null => Some(Literal::Null),
        Value::Array(items) => Some(Literal::Array(
            items.iter().filter_map(json_value_to_literal).collect(),
        )),
        Value::Object(entries) => Some(Literal::Object(
            entries
                .iter()
                .filter_map(|(key, value)| Some((key.clone(), json_value_to_literal(value)?)))
                .collect(),
        )),
    }
}

fn string_literals(value: &Literal) -> Vec<String> {
    match value {
        Literal::Array(items) => items
            .iter()
            .filter_map(|item| match item {
                Literal::String(value) => Some(value.clone()),
                _ => None,
            })
            .collect(),
        Literal::String(value) => vec![value.clone()],
        _ => Vec::new(),
    }
}

fn static_variant_values(value: &Literal, wildcard_values: Option<&Vec<String>>) -> Vec<Literal> {
    match value {
        Literal::Array(items) => items
            .iter()
            .flat_map(|item| match item {
                Literal::String(value) if value == "*" => wildcard_values
                    .into_iter()
                    .flatten()
                    .cloned()
                    .map(Literal::String)
                    .collect(),
                _ => vec![item.clone()],
            })
            .collect(),
        Literal::String(value) if value == "*" => wildcard_values
            .into_iter()
            .flatten()
            .cloned()
            .map(Literal::String)
            .collect(),
        Literal::Bool(true) => vec![Literal::String("true".to_owned())],
        _ => vec![value.clone()],
    }
}

fn conditional_static_value(
    conditions: &[String],
    breakpoints: &[String],
    value: &Literal,
) -> Literal {
    let mut entries = vec![("base".to_owned(), value.clone())];
    entries.extend(conditions.iter().map(|condition| {
        let key = if condition.starts_with('_') || breakpoints.iter().any(|key| key == condition) {
            condition.clone()
        } else {
            format!("_{condition}")
        };
        (key, value.clone())
    }));
    Literal::Object(entries)
}

fn resolve_recipe_base(
    class_name: &str,
    recipe: &Recipe,
    resolver: &StyleResolver<'_>,
) -> Option<ResolvedRecipePart> {
    recipe.base.as_ref().map(|base| ResolvedRecipePart {
        class_name: class_name.to_owned().into_boxed_str(),
        entries: resolver.recipe_entries(base),
    })
}

fn default_variant_map(defaults: &[(String, String)]) -> FxHashMap<Box<str>, Box<str>> {
    defaults
        .iter()
        .map(|(name, value)| {
            (
                name.clone().into_boxed_str(),
                value.clone().into_boxed_str(),
            )
        })
        .collect()
}

fn resolve_recipe_variants(
    class_name: &str,
    recipe: &Recipe,
    resolver: &StyleResolver<'_>,
) -> Vec<ResolvedVariantGroup> {
    recipe
        .variants
        .iter()
        .map(|group| {
            let options = group
                .options
                .iter()
                .map(|option| {
                    let class_name =
                        recipe_variant_class_name(class_name, &group.name, &option.key);
                    (
                        option.key.clone().into_boxed_str(),
                        ResolvedRecipePart {
                            class_name: class_name.into_boxed_str(),
                            entries: resolver.recipe_entries(&option.style),
                        },
                    )
                })
                .collect();
            ResolvedVariantGroup {
                name: group.name.clone().into_boxed_str(),
                options,
            }
        })
        .collect()
}

fn resolve_recipe_compounds(
    recipe: &Recipe,
    resolver: &StyleResolver<'_>,
) -> Vec<ResolvedCompoundVariant> {
    recipe
        .compound_variants
        .iter()
        .map(|compound| ResolvedCompoundVariant {
            conditions: intern_variant_condition_values(&compound.conditions),
            atoms: resolver.atoms(&compound.css),
        })
        .collect()
}

fn resolve_slot_recipe_base(
    class_name: &str,
    recipe: &SlotRecipe,
    resolver: &StyleResolver<'_>,
) -> FxHashMap<Box<str>, ResolvedRecipePart> {
    let mut base = FxHashMap::default();
    for (slot, style) in &recipe.base {
        base.insert(
            slot.clone().into_boxed_str(),
            ResolvedRecipePart {
                class_name: RecipeRegistry::slot_class_name(class_name, slot).into_boxed_str(),
                entries: resolver.recipe_entries(style),
            },
        );
    }
    base
}

fn resolve_slot_recipe_variants(
    class_name: &str,
    recipe: &SlotRecipe,
    resolver: &StyleResolver<'_>,
) -> Vec<ResolvedSlotVariantGroup> {
    recipe
        .variants
        .iter()
        .map(|group| {
            let options = group
                .options
                .iter()
                .map(|option| {
                    let slots = option
                        .styles
                        .iter()
                        .map(|(slot, style)| {
                            let slot_class = RecipeRegistry::slot_class_name(class_name, slot);
                            let class_name =
                                recipe_variant_class_name(&slot_class, &group.name, &option.key);
                            (
                                slot.clone().into_boxed_str(),
                                ResolvedRecipePart {
                                    class_name: class_name.into_boxed_str(),
                                    entries: resolver.recipe_entries(style),
                                },
                            )
                        })
                        .collect();
                    (option.key.clone().into_boxed_str(), slots)
                })
                .collect();
            ResolvedSlotVariantGroup {
                name: group.name.clone().into_boxed_str(),
                options,
            }
        })
        .collect()
}

fn resolve_slot_recipe_compounds(
    recipe: &SlotRecipe,
    resolver: &StyleResolver<'_>,
) -> Vec<ResolvedCompoundVariant> {
    recipe
        .compound_variants
        .iter()
        .map(|compound| {
            let mut atoms = FxHashSet::default();
            for (_, style) in &compound.css {
                atoms.extend(resolver.atoms(style));
            }
            ResolvedCompoundVariant {
                conditions: intern_variant_condition_values(&compound.conditions),
                atoms,
            }
        })
        .collect()
}

fn intern_variant_condition_values(
    pairs: &[(String, Vec<String>)],
) -> Vec<(Box<str>, Vec<Box<str>>)> {
    pairs
        .iter()
        .map(|(name, values)| {
            (
                name.clone().into_boxed_str(),
                values
                    .iter()
                    .map(|value| value.clone().into_boxed_str())
                    .collect(),
            )
        })
        .collect()
}

#[derive(Debug, Clone, Default)]
pub struct EncodedRecipes {
    base: FxHashMap<RecipePartKey, RecipeStyleGroup>,
    variants: FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
    atomic: FxHashSet<Atom>,
}

#[derive(Debug, Default)]
pub(crate) struct EncodedRecipesCache {
    view: EncodedRecipes,
    base_counts: FxHashMap<RecipePartKey, CountedRecipeStyleGroup>,
    variant_counts: FxHashMap<RecipeVariantKey, CountedRecipeStyleGroup>,
    atomic_counts: FxHashMap<Atom, u32>,
}

#[derive(Debug, Default)]
struct CountedRecipeStyleGroup {
    class_name: Box<str>,
    entries: FxHashMap<RecipeStyleEntry, u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct RecipePartKey {
    recipe: Box<str>,
    slot: Option<Box<str>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct RecipeVariantKey {
    recipe: Box<str>,
    slot: Option<Box<str>>,
    class_name: Box<str>,
}

impl EncodedRecipes {
    pub(crate) fn clear(&mut self) {
        self.base.clear();
        self.variants.clear();
        self.atomic.clear();
    }

    pub(crate) fn is_empty(&self) -> bool {
        self.base.is_empty() && self.variants.is_empty() && self.atomic.is_empty()
    }

    pub(crate) fn extend_missing_from(&mut self, source: &Self) -> Self {
        let mut missing = Self::default();
        extend_missing_recipe_groups(&mut self.base, &mut missing.base, &source.base);
        extend_missing_recipe_groups(&mut self.variants, &mut missing.variants, &source.variants);
        for atom in &source.atomic {
            if self.atomic.insert(atom.clone()) {
                missing.atomic.insert(atom.clone());
            }
        }
        missing
    }

    /// Record the style groups one recipe usage contributes: its `base` plus
    /// every selected variant option (and matching compound variants). Dispatches
    /// to the recipe vs slot-recipe path; unknown names are no-ops.
    pub(crate) fn process_usage(
        &mut self,
        recipes: &RecipeRegistry,
        recipe_name: &str,
        selected: &Literal,
        conditions: &ProjectConditionMatcher,
    ) {
        if let Some(node) = recipes.recipe(recipe_name) {
            self.process_recipe(node, selected, conditions);
        } else if let Some(node) = recipes.slot_recipe(recipe_name) {
            self.process_slot_recipe(node, selected, conditions);
        }
    }

    fn process_recipe(
        &mut self,
        node: &RecipeNode,
        selected: &Literal,
        conditions: &ProjectConditionMatcher,
    ) {
        if let Some(base) = node.base.as_ref() {
            let key = recipe_part_key(&node.name, None);
            self.base.entry(key).or_insert_with(|| RecipeStyleGroup {
                class_name: base.class_name.clone(),
                entries: base.entries.clone(),
            });
        }

        let selected = selected_variants(&node.default_variants, selected, conditions);
        for group in &node.variants {
            let Some(selected_values) = selected.get(group.name.as_ref()) else {
                continue;
            };
            for selected_value in selected_values {
                let Some(option) = group.options.get(selected_value.key.as_ref()) else {
                    continue;
                };
                let key = recipe_variant_key(&node.name, None, &option.class_name);
                let entries = with_entry_conditions(&option.entries, &selected_value.conditions);
                self.variants
                    .entry(key)
                    .or_insert_with(|| RecipeStyleGroup {
                        class_name: option.class_name.clone(),
                        entries: FxHashSet::default(),
                    })
                    .entries
                    .extend(entries);
            }
        }

        self.process_matching_compounds(&node.compounds, &selected);
    }

    fn process_slot_recipe(
        &mut self,
        node: &SlotRecipeNode,
        selected: &Literal,
        conditions: &ProjectConditionMatcher,
    ) {
        for slot in &node.slots {
            let key = recipe_part_key(&node.name, Some(slot));
            if self.base.contains_key(&key) {
                continue;
            }
            let Some(part) = node.base.get(slot.as_str()) else {
                continue;
            };
            self.base.insert(
                key,
                RecipeStyleGroup {
                    class_name: part.class_name.clone(),
                    entries: part.entries.clone(),
                },
            );
        }

        let selected = selected_variants(&node.default_variants, selected, conditions);
        for group in &node.variants {
            let Some(selected_values) = selected.get(group.name.as_ref()) else {
                continue;
            };
            for selected_value in selected_values {
                let Some(slots) = group.options.get(selected_value.key.as_ref()) else {
                    continue;
                };
                for (slot, part) in slots {
                    let key = recipe_variant_key(&node.name, Some(slot), &part.class_name);
                    let entries = with_entry_conditions(&part.entries, &selected_value.conditions);
                    self.variants
                        .entry(key)
                        .or_insert_with(|| RecipeStyleGroup {
                            class_name: part.class_name.clone(),
                            entries: FxHashSet::default(),
                        })
                        .entries
                        .extend(entries);
                }
            }
        }

        self.process_matching_compounds(&node.compounds, &selected);
    }

    fn process_matching_compounds(
        &mut self,
        compounds: &[ResolvedCompoundVariant],
        selected: &FxHashMap<Box<str>, Vec<SelectedVariantValue>>,
    ) {
        for compound in compounds {
            let Some(conditions) = compound_conditions(compound, selected) else {
                continue;
            };
            if conditions.is_empty() {
                self.atomic.extend(compound.atoms.iter().cloned());
            } else {
                self.atomic
                    .extend(with_atom_conditions(&compound.atoms, &conditions));
            }
        }
    }

    #[must_use]
    pub fn snapshot(&self) -> EncodedRecipesSnapshot {
        EncodedRecipesSnapshot {
            base: sorted_recipe_part_group_snapshots(&self.base),
            variants: sorted_recipe_variant_group_snapshots(&self.variants),
            atomic: sorted_atoms_vec(&self.atomic),
        }
    }

    pub(crate) fn transform_utilities(
        &mut self,
        transform: &mut crate::UtilityTransformFn<'_>,
        diagnostics: &mut Vec<Diagnostic>,
    ) {
        transform_recipe_groups(&mut self.base, transform, diagnostics);
        transform_recipe_groups(&mut self.variants, transform, diagnostics);
        self.atomic = transform_atoms(std::mem::take(&mut self.atomic), transform, diagnostics);
    }
}

fn extend_missing_recipe_groups<K>(
    target: &mut FxHashMap<K, RecipeStyleGroup>,
    missing: &mut FxHashMap<K, RecipeStyleGroup>,
    source: &FxHashMap<K, RecipeStyleGroup>,
) where
    K: Clone + Eq + std::hash::Hash,
{
    for (key, group) in source {
        let target_group = target
            .entry(key.clone())
            .or_insert_with(|| RecipeStyleGroup {
                class_name: group.class_name.clone(),
                entries: FxHashSet::default(),
            });
        let mut missing_entries = FxHashSet::default();
        for entry in &group.entries {
            if target_group.entries.insert(entry.clone()) {
                missing_entries.insert(entry.clone());
            }
        }
        if !missing_entries.is_empty() {
            missing.insert(
                key.clone(),
                RecipeStyleGroup {
                    class_name: group.class_name.clone(),
                    entries: missing_entries,
                },
            );
        }
    }
}

fn transform_atoms(
    atoms: FxHashSet<Atom>,
    transform: &mut crate::UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) -> FxHashSet<Atom> {
    let mut out = FxHashSet::default();
    for atom in atoms {
        match transform(atom.prop(), atom.value()) {
            Ok(Some(transformed)) => {
                let conditions: SmallVec<[Box<str>; 2]> =
                    atom.conditions().iter().cloned().collect();
                out.extend(
                    transformed
                        .into_iter()
                        .map(|next| next.with_prefixed_conditions(&conditions)),
                );
            }
            Ok(None) => {
                out.insert(atom);
            }
            Err(diagnostic) => diagnostics.push(diagnostic),
        }
    }
    out
}

fn transform_recipe_groups<K: Eq + std::hash::Hash>(
    groups: &mut FxHashMap<K, RecipeStyleGroup>,
    transform: &mut crate::UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    for group in groups.values_mut() {
        group.entries =
            transform_recipe_entries(std::mem::take(&mut group.entries), transform, diagnostics);
    }
}

fn transform_recipe_entries(
    entries: FxHashSet<RecipeStyleEntry>,
    transform: &mut crate::UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) -> FxHashSet<RecipeStyleEntry> {
    let mut out = FxHashSet::default();
    for entry in entries {
        match transform(entry.prop.as_ref(), &entry.value) {
            Ok(Some(transformed)) => {
                for atom in transformed {
                    let mut conditions = entry.conditions.clone();
                    conditions.extend(atom.conditions().iter().cloned());
                    out.insert(RecipeStyleEntry {
                        prop: atom.prop().into(),
                        value: atom.value().clone(),
                        conditions,
                        important: entry.important || atom.important(),
                    });
                }
            }
            Ok(None) => {
                out.insert(entry);
            }
            Err(diagnostic) => diagnostics.push(diagnostic),
        }
    }
    out
}

impl EncodedRecipesCache {
    pub(crate) fn clear(&mut self) {
        self.view.clear();
        self.base_counts.clear();
        self.variant_counts.clear();
        self.atomic_counts.clear();
    }

    pub(crate) fn is_empty(&self) -> bool {
        self.view.is_empty()
    }

    pub(crate) fn view(&self) -> &EncodedRecipes {
        &self.view
    }

    pub(crate) fn add_from(&mut self, recipes: &EncodedRecipes) {
        add_recipe_part_groups(&mut self.view.base, &mut self.base_counts, &recipes.base);
        add_recipe_variant_groups(
            &mut self.view.variants,
            &mut self.variant_counts,
            &recipes.variants,
        );
        for atom in &recipes.atomic {
            let count = self.atomic_counts.entry(atom.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                self.view.atomic.insert(atom.clone());
            }
        }
    }

    pub(crate) fn remove_from(&mut self, recipes: &EncodedRecipes) {
        remove_recipe_part_groups(&mut self.view.base, &mut self.base_counts, &recipes.base);
        remove_recipe_variant_groups(
            &mut self.view.variants,
            &mut self.variant_counts,
            &recipes.variants,
        );
        for atom in &recipes.atomic {
            if let Some(count) = self.atomic_counts.get_mut(atom) {
                *count -= 1;
                if *count == 0 {
                    self.atomic_counts.remove(atom);
                    self.view.atomic.remove(atom);
                }
            }
        }
    }
}

fn add_recipe_part_groups(
    view: &mut FxHashMap<RecipePartKey, RecipeStyleGroup>,
    counts: &mut FxHashMap<RecipePartKey, CountedRecipeStyleGroup>,
    source: &FxHashMap<RecipePartKey, RecipeStyleGroup>,
) {
    for (key, group) in source {
        let counted = counts
            .entry(key.clone())
            .or_insert_with(|| CountedRecipeStyleGroup {
                class_name: group.class_name.clone(),
                entries: FxHashMap::default(),
            });
        let view_group = view.entry(key.clone()).or_insert_with(|| RecipeStyleGroup {
            class_name: counted.class_name.clone(),
            entries: FxHashSet::default(),
        });
        for entry in &group.entries {
            let count = counted.entries.entry(entry.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                view_group.entries.insert(entry.clone());
            }
        }
    }
}

fn add_recipe_variant_groups(
    view: &mut FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
    counts: &mut FxHashMap<RecipeVariantKey, CountedRecipeStyleGroup>,
    source: &FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
) {
    for (key, group) in source {
        let counted = counts
            .entry(key.clone())
            .or_insert_with(|| CountedRecipeStyleGroup {
                class_name: group.class_name.clone(),
                entries: FxHashMap::default(),
            });
        let view_group = view.entry(key.clone()).or_insert_with(|| RecipeStyleGroup {
            class_name: counted.class_name.clone(),
            entries: FxHashSet::default(),
        });
        for entry in &group.entries {
            let count = counted.entries.entry(entry.clone()).or_insert(0);
            *count += 1;
            if *count == 1 {
                view_group.entries.insert(entry.clone());
            }
        }
    }
}

fn remove_recipe_part_groups(
    view: &mut FxHashMap<RecipePartKey, RecipeStyleGroup>,
    counts: &mut FxHashMap<RecipePartKey, CountedRecipeStyleGroup>,
    source: &FxHashMap<RecipePartKey, RecipeStyleGroup>,
) {
    for (key, group) in source {
        let Some(counted) = counts.get_mut(key) else {
            continue;
        };
        let Some(view_group) = view.get_mut(key) else {
            continue;
        };
        for entry in &group.entries {
            if let Some(count) = counted.entries.get_mut(entry) {
                *count -= 1;
                if *count == 0 {
                    counted.entries.remove(entry);
                    view_group.entries.remove(entry);
                }
            }
        }
        if counted.entries.is_empty() {
            counts.remove(key);
            view.remove(key);
        }
    }
}

fn remove_recipe_variant_groups(
    view: &mut FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
    counts: &mut FxHashMap<RecipeVariantKey, CountedRecipeStyleGroup>,
    source: &FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
) {
    for (key, group) in source {
        let Some(counted) = counts.get_mut(key) else {
            continue;
        };
        let Some(view_group) = view.get_mut(key) else {
            continue;
        };
        for entry in &group.entries {
            if let Some(count) = counted.entries.get_mut(entry) {
                *count -= 1;
                if *count == 0 {
                    counted.entries.remove(entry);
                    view_group.entries.remove(entry);
                }
            }
        }
        if counted.entries.is_empty() {
            counts.remove(key);
            view.remove(key);
        }
    }
}

fn recipe_part_key(recipe: &str, slot: Option<&str>) -> RecipePartKey {
    RecipePartKey {
        recipe: recipe.into(),
        slot: slot.map(Into::into),
    }
}

fn recipe_variant_key(recipe: &str, slot: Option<&str>, class_name: &str) -> RecipeVariantKey {
    RecipeVariantKey {
        recipe: recipe.into(),
        slot: slot.map(Into::into),
        class_name: class_name.into(),
    }
}

fn recipe_variant_class_name(class_name: &str, variant: &str, value: &str) -> String {
    format!("{class_name}--{variant}_{value}")
}

fn with_entry_conditions(
    entries: &FxHashSet<RecipeStyleEntry>,
    prefix_conditions: &SmallVec<[Box<str>; 2]>,
) -> FxHashSet<RecipeStyleEntry> {
    if prefix_conditions.is_empty() {
        return entries.clone();
    }
    entries
        .iter()
        .cloned()
        .map(|mut entry| {
            let mut conditions = prefix_conditions.clone();
            conditions.extend(entry.conditions.iter().cloned());
            entry.conditions = conditions;
            entry
        })
        .collect()
}

fn with_atom_conditions(
    atoms: &FxHashSet<Atom>,
    prefix_conditions: &SmallVec<[Box<str>; 2]>,
) -> FxHashSet<Atom> {
    if prefix_conditions.is_empty() {
        return atoms.clone();
    }
    atoms
        .iter()
        .map(|atom| atom.with_prefixed_conditions(prefix_conditions))
        .collect()
}

fn compound_conditions(
    compound: &ResolvedCompoundVariant,
    selected: &FxHashMap<Box<str>, Vec<SelectedVariantValue>>,
) -> Option<SmallVec<[Box<str>; 2]>> {
    let mut out = SmallVec::new();
    for (name, values) in &compound.conditions {
        let selected_values = selected.get(name.as_ref())?;
        let selected_value = selected_values.iter().find(|selected| {
            values
                .iter()
                .any(|value| selected.key.as_ref() == value.as_ref())
        })?;
        extend_unique_conditions(&mut out, &selected_value.conditions);
    }
    Some(out)
}

fn extend_unique_conditions(
    target: &mut SmallVec<[Box<str>; 2]>,
    source: &SmallVec<[Box<str>; 2]>,
) {
    for condition in source {
        if !target.iter().any(|existing| existing == condition) {
            target.push(condition.clone());
        }
    }
}

#[derive(Debug, Clone)]
struct SelectedVariantValue {
    key: Box<str>,
    conditions: SmallVec<[Box<str>; 2]>,
}

/// Resolve which variant value(s) a usage selects per variant prop, starting
/// from the recipe's `defaultVariants` and overriding with the usage's props.
/// A value may be responsive/conditional (`size={{ base: 'sm', md: 'lg' }}`),
/// so each selection carries the conditions under which it applies.
fn selected_variants(
    defaults: &FxHashMap<Box<str>, Box<str>>,
    selected: &Literal,
    conditions: &ProjectConditionMatcher,
) -> FxHashMap<Box<str>, Vec<SelectedVariantValue>> {
    let mut out: FxHashMap<Box<str>, Vec<SelectedVariantValue>> = defaults
        .iter()
        .map(|(key, value)| {
            (
                key.clone(),
                vec![SelectedVariantValue {
                    key: value.clone(),
                    conditions: SmallVec::new(),
                }],
            )
        })
        .collect();
    let Some(entries) = literal_entries(selected) else {
        return out;
    };
    for (key, value) in entries {
        let mut values = Vec::new();
        let mut path = SmallVec::<[Box<str>; 2]>::new();
        collect_selected_variant_values(value, conditions, &mut path, &mut values);
        if !values.is_empty() {
            out.insert(key.clone().into_boxed_str(), values);
        }
    }
    out
}

/// Walk a variant value, descending through condition keys (`base`, `md`, …)
/// while accumulating the condition `path`, and record each leaf variant key
/// with the conditions it was found under.
fn collect_selected_variant_values(
    value: &Literal,
    conditions: &ProjectConditionMatcher,
    path: &mut SmallVec<[Box<str>; 2]>,
    out: &mut Vec<SelectedVariantValue>,
) {
    match value {
        Literal::Object(entries) => {
            for (key, value) in entries {
                let is_condition = key == "base" || conditions.is_condition(key);
                if is_condition && key != "base" {
                    path.push(key.clone().into_boxed_str());
                }
                if is_condition {
                    collect_selected_variant_values(value, conditions, path, out);
                }
                if is_condition && key != "base" {
                    path.pop();
                }
            }
        }
        Literal::Conditional(branches) => {
            for branch in branches {
                collect_selected_variant_values(branch, conditions, path, out);
            }
        }
        _ => {
            if let Some(key) = literal_to_variant_key(value) {
                out.push(SelectedVariantValue {
                    key: key.into_boxed_str(),
                    conditions: path.clone(),
                });
            }
        }
    }
}

fn literal_to_variant_key(value: &Literal) -> Option<String> {
    match value {
        Literal::String(value) => Some(value.clone()),
        Literal::Number(value) => Some(number_to_js_string(*value)),
        Literal::Bool(true) => Some("true".to_owned()),
        Literal::Bool(false) => Some("false".to_owned()),
        Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}

#[derive(Debug, Clone)]
struct StylePathSegment {
    name: Box<str>,
    is_condition: bool,
}

struct StyleLeaf<'a> {
    prop: &'a str,
    value: &'a Literal,
    conditions: SmallVec<[Box<str>; 2]>,
}

/// Visit each leaf of a recipe style object, handing the callback the property
/// name (first non-condition segment) and the condition chain *below* it.
/// Recipe-specific cousin of the encoder's atom walker, emitting
/// [`RecipeStyleEntry`] rather than atoms.
fn walk_style_object<F>(value: &Literal, conditions: &ProjectConditionMatcher, mut visit: F)
where
    F: FnMut(StyleLeaf<'_>),
{
    let mut path = SmallVec::<[StylePathSegment; 8]>::new();
    walk_style_object_inner(value, conditions, &mut path, &mut visit);
}

fn walk_style_object_inner<F>(
    value: &Literal,
    conditions: &ProjectConditionMatcher,
    path: &mut SmallVec<[StylePathSegment; 8]>,
    visit: &mut F,
) where
    F: FnMut(StyleLeaf<'_>),
{
    if let Literal::Object(children) = value {
        for (key, child) in children {
            path.push(StylePathSegment {
                name: key.clone().into_boxed_str(),
                is_condition: key == "base" || conditions.is_condition(key),
            });
            walk_style_object_inner(child, conditions, path, visit);
            path.pop();
        }
        return;
    }

    let Some(prop) = path.iter().find(|segment| !segment.is_condition) else {
        return;
    };
    let conditions = path
        .iter()
        .skip_while(|segment| segment.name.as_ref() != prop.name.as_ref())
        .skip(1)
        .filter(|segment| segment.is_condition && &*segment.name != "base")
        .map(|segment| segment.name.clone())
        .collect();

    visit(StyleLeaf {
        prop: prop.name.as_ref(),
        value,
        conditions,
    });
}

struct RecipeValue {
    value: AtomValue,
    important: bool,
}

fn literal_to_recipe_value(value: &Literal) -> Option<RecipeValue> {
    match value {
        Literal::String(value) => {
            if is_absolute_url(value) {
                return None;
            }
            let (value, important) = split_important(value);
            Some(RecipeValue {
                value: AtomValue::String(value.into_owned().into_boxed_str()),
                important,
            })
        }
        Literal::Number(value) => Some(RecipeValue {
            value: AtomValue::Number(number_to_js_string(*value).into_boxed_str()),
            important: false,
        }),
        Literal::Bool(value) => Some(RecipeValue {
            value: AtomValue::Bool(*value),
            important: false,
        }),
        Literal::Null => Some(RecipeValue {
            value: AtomValue::Null,
            important: false,
        }),
        Literal::Array(items) => {
            let value = format!("[{}]", literal_join(items, ","));
            let (value, important) = split_important(&value);
            Some(RecipeValue {
                value: AtomValue::String(value.into_owned().into_boxed_str()),
                important,
            })
        }
        Literal::Conditional(branches) => {
            let value = format!("?({})", literal_join(branches, "|"));
            let (value, important) = split_important(&value);
            Some(RecipeValue {
                value: AtomValue::String(value.into_owned().into_boxed_str()),
                important,
            })
        }
        Literal::Object(_) => None,
    }
}

fn is_absolute_url(value: &str) -> bool {
    value.starts_with("http://") || value.starts_with("https://")
}

fn literal_join(items: &[Literal], separator: &str) -> String {
    let mut out = String::new();
    for (index, item) in items.iter().enumerate() {
        if index > 0 {
            out.push_str(separator);
        }
        push_literal_repr(&mut out, item);
    }
    out
}

fn push_literal_repr(out: &mut String, value: &Literal) {
    match value {
        Literal::String(value) => out.push_str(value),
        Literal::Number(value) => {
            push_number_to_js_string(out, *value);
        }
        Literal::Bool(true) => out.push_str("true"),
        Literal::Bool(false) => out.push_str("false"),
        Literal::Null => out.push_str("null"),
        Literal::Object(_) => out.push_str("{...}"),
        Literal::Array(_) => out.push_str("[...]"),
        Literal::Conditional(_) => out.push_str("?(...)"),
    }
}

fn sorted_recipe_part_group_snapshots(
    groups: &FxHashMap<RecipePartKey, RecipeStyleGroup>,
) -> Vec<RecipeStyleGroupSnapshot> {
    let mut out: Vec<_> = groups
        .iter()
        .map(|(key, group)| RecipeStyleGroupSnapshot {
            recipe: key.recipe.clone(),
            slot: key.slot.as_ref().map_or(serde_json::Value::Null, |slot| {
                serde_json::Value::String(slot.to_string())
            }),
            class_name: group.class_name.clone(),
            entries: sorted_recipe_entries(&group.entries),
        })
        .collect();
    out.sort_by(|a, b| {
        a.recipe
            .cmp(&b.recipe)
            .then_with(|| slot_sort_key(&a.slot).cmp(slot_sort_key(&b.slot)))
            .then_with(|| a.class_name.cmp(&b.class_name))
    });
    out
}

fn sorted_recipe_variant_group_snapshots(
    groups: &FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
) -> Vec<RecipeStyleGroupSnapshot> {
    let mut out: Vec<_> = groups
        .iter()
        .map(|(key, group)| RecipeStyleGroupSnapshot {
            recipe: key.recipe.clone(),
            slot: key.slot.as_ref().map_or(serde_json::Value::Null, |slot| {
                serde_json::Value::String(slot.to_string())
            }),
            class_name: group.class_name.clone(),
            entries: sorted_recipe_entries(&group.entries),
        })
        .collect();
    out.sort_by(|a, b| {
        a.recipe
            .cmp(&b.recipe)
            .then_with(|| slot_sort_key(&a.slot).cmp(slot_sort_key(&b.slot)))
            .then_with(|| a.class_name.cmp(&b.class_name))
    });
    out
}

fn slot_sort_key(slot: &serde_json::Value) -> &str {
    slot.as_str().unwrap_or("")
}

fn sorted_atoms_vec(atoms: &FxHashSet<Atom>) -> Vec<Atom> {
    let mut out: Vec<_> = atoms.iter().cloned().collect();
    out.sort_by(compare_atoms_by_emit_order);
    out
}

fn sorted_recipe_entries(entries: &FxHashSet<RecipeStyleEntry>) -> Vec<RecipeStyleEntry> {
    let mut out: Vec<_> = entries.iter().cloned().collect();
    out.sort_by(|a, b| {
        a.conditions
            .cmp(&b.conditions)
            .then_with(|| a.prop.cmp(&b.prop))
            .then_with(|| atom_value_sort_key(&a.value).cmp(&atom_value_sort_key(&b.value)))
    });
    out
}
