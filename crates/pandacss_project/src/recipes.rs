use regex::RegexSet;
use rustc_hash::{FxHashMap, FxHashSet};
use serde::Serialize;
use smallvec::SmallVec;
use std::borrow::Cow;

use pandacss_encoder::{Atom, AtomValue, ConditionMatcher, Encoder};
use pandacss_extractor::Literal;
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{number_to_js_string, push_number_to_js_string};
use pandacss_utility::Utility;

use crate::config::{RecipeDefinition, SlotRecipeDefinition};
use crate::{ProjectConditionMatcher, literal_entries};

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
    conditions: Vec<(Box<str>, Box<str>)>,
    atoms: FxHashSet<Atom>,
}

pub(crate) struct StyleResolver<'a> {
    pub(crate) utility: Option<&'a Utility>,
    pub(crate) conditions: &'a ProjectConditionMatcher,
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
            let Some(value) = literal_to_atom_value(leaf.value) else {
                return;
            };
            let mut conditions = prefix_conditions.clone();
            conditions.extend(leaf.conditions);
            entries.insert(RecipeStyleEntry {
                prop: leaf.prop.into(),
                value,
                conditions,
            });
        });
        entries
    }

    fn normalize_style_object<'a>(&self, style: &'a Literal) -> Cow<'a, Literal> {
        self.utility.map_or_else(
            || Cow::Borrowed(style),
            |utility| Cow::Owned(utility.normalize_style_object(style)),
        )
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
        let Some(entries) = literal_entries(props) else {
            return None;
        };

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
            conditions: intern_variant_pairs(&compound.conditions),
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
                conditions: intern_variant_pairs(&compound.conditions),
                atoms,
            }
        })
        .collect()
}

fn intern_variant_pairs(pairs: &[(String, String)]) -> Vec<(Box<str>, Box<str>)> {
    pairs
        .iter()
        .map(|(name, value)| {
            (
                name.clone().into_boxed_str(),
                value.clone().into_boxed_str(),
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

#[derive(Debug, Clone, Default)]
pub struct RecipeStyleGroup {
    pub class_name: Box<str>,
    pub entries: FxHashSet<RecipeStyleEntry>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeStyleEntry {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub conditions: SmallVec<[Box<str>; 2]>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodedRecipesSnapshot {
    pub base: Vec<RecipeStyleGroupSnapshot>,
    pub variants: Vec<RecipeStyleGroupSnapshot>,
    pub atomic: Vec<Atom>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeStyleGroupSnapshot {
    pub recipe: Box<str>,
    pub slot: serde_json::Value,
    pub class_name: Box<str>,
    pub entries: Vec<RecipeStyleEntry>,
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
            if !self.base.contains_key(&key) {
                self.base.insert(
                    key,
                    RecipeStyleGroup {
                        class_name: base.class_name.clone(),
                        entries: base.entries.clone(),
                    },
                );
            }
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
    for (name, value) in &compound.conditions {
        let selected_values = selected.get(name.as_ref())?;
        let selected_value = selected_values
            .iter()
            .find(|selected| selected.key.as_ref() == value.as_ref())?;
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

fn literal_to_atom_value(value: &Literal) -> Option<AtomValue> {
    match value {
        Literal::String(value) => Some(AtomValue::String(value.clone().into_boxed_str())),
        Literal::Number(value) => Some(AtomValue::Number(
            number_to_js_string(*value).into_boxed_str(),
        )),
        Literal::Bool(value) => Some(AtomValue::Bool(*value)),
        Literal::Null => Some(AtomValue::Null),
        Literal::Array(items) => Some(AtomValue::String(
            format!("[{}]", literal_join(items, ",")).into_boxed_str(),
        )),
        Literal::Conditional(branches) => Some(AtomValue::String(
            format!("?({})", literal_join(branches, "|")).into_boxed_str(),
        )),
        Literal::Object(_) => None,
    }
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
        .map(|(key, group)| {
            let mut entries: Vec<_> = group.entries.iter().cloned().collect();
            entries.sort_by(|a, b| {
                a.prop
                    .cmp(&b.prop)
                    .then_with(|| a.conditions.cmp(&b.conditions))
                    .then_with(|| format!("{:?}", a.value).cmp(&format!("{:?}", b.value)))
            });
            RecipeStyleGroupSnapshot {
                recipe: key.recipe.clone(),
                slot: key.slot.as_ref().map_or(serde_json::Value::Null, |slot| {
                    serde_json::Value::String(slot.to_string())
                }),
                class_name: group.class_name.clone(),
                entries,
            }
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
        .map(|(key, group)| {
            let mut entries: Vec<_> = group.entries.iter().cloned().collect();
            entries.sort_by(|a, b| {
                a.prop
                    .cmp(&b.prop)
                    .then_with(|| a.conditions.cmp(&b.conditions))
                    .then_with(|| format!("{:?}", a.value).cmp(&format!("{:?}", b.value)))
            });
            RecipeStyleGroupSnapshot {
                recipe: key.recipe.clone(),
                slot: key.slot.as_ref().map_or(serde_json::Value::Null, |slot| {
                    serde_json::Value::String(slot.to_string())
                }),
                class_name: group.class_name.clone(),
                entries,
            }
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
    out.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| a.conditions().cmp(b.conditions()))
            .then_with(|| format!("{:?}", a.value()).cmp(&format!("{:?}", b.value())))
    });
    out
}
