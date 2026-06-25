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
use std::collections::BTreeMap;

use pandacss_config::UserConfig;
use pandacss_encoder::{
    Atom, AtomValue, ConditionMatcher, EncodedRecipesSnapshot, Encoder, RecipeStyleEntry,
    RecipeStyleGroup, RecipeStyleGroupSnapshot, atom_value_sort_key, compare_atoms_by_emit_order,
};
use pandacss_extractor::{Diagnostic, Literal};
use pandacss_recipes::{Recipe, SlotRecipe};
use pandacss_shared::{
    compound_class_name, diagnostic_codes, number_to_js_string, split_important,
};
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
enum CompoundTarget {
    Recipe(ResolvedRecipePart),
    Slots(Vec<(Box<str>, ResolvedRecipePart)>),
}

#[derive(Debug, Clone)]
struct ResolvedCompoundVariant {
    conditions: Vec<(Box<str>, Vec<Box<str>>)>,
    target: CompoundTarget,
}

pub(crate) struct StyleResolver<'a> {
    pub(crate) utility: Option<&'a Utility>,
    pub(crate) conditions: &'a ProjectConditionMatcher,
    pub(crate) breakpoints: &'a [String],
    pub(crate) separator: &'a str,
    pub(crate) hash_class_names: bool,
}

impl StyleResolver<'_> {
    fn recipe_entries(&self, style: &Literal) -> FxHashSet<RecipeStyleEntry> {
        self.recipe_entries_with_conditions(style, &SmallVec::new())
    }

    fn recipe_entries_with_conditions(
        &self,
        style: &Literal,
        prefix_conditions: &SmallVec<[Box<str>; 2]>,
    ) -> FxHashSet<RecipeStyleEntry> {
        let normalizer = self.normalizer();
        let mut encoder = Encoder::with_conditions(self.conditions.clone());
        encoder.process_atomic_with(style, &normalizer);

        encoder
            .into_atoms()
            .into_iter()
            .map(|atom| {
                let mut entry = RecipeStyleEntry::from(atom);
                if !prefix_conditions.is_empty() {
                    let mut conditions = prefix_conditions.clone();
                    conditions.extend(entry.conditions.iter().cloned());
                    entry.conditions = conditions;
                }
                entry
            })
            .collect()
    }

    fn normalizer(&self) -> StyleNormalizer<'_> {
        StyleNormalizer::internal(self.utility, self.breakpoints)
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
                    compounds: resolve_recipe_compounds(
                        &recipe.class_name,
                        &recipe.recipe,
                        resolver,
                    ),
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
                    compounds: resolve_slot_recipe_compounds(
                        &recipe.class_name,
                        &recipe.recipe,
                        resolver,
                    ),
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

    pub(crate) fn slot_for_jsx<'a>(&'a self, recipe_name: &str, tag: &str) -> Option<&'a str> {
        let recipe = self.slot_recipe(recipe_name)?;
        let tag_slot = tag.rsplit('.').next().unwrap_or(tag).to_ascii_lowercase();
        let tag_compact = tag.replace('.', "").to_ascii_lowercase();

        recipe.slots.iter().map(String::as_str).find(|slot| {
            let slot_lower = slot.to_ascii_lowercase();
            tag_slot == slot_lower || tag_compact.ends_with(&slot_lower)
        })
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
            encoded.process_usage(
                self,
                &name,
                &Literal::Object(Vec::new()),
                conditions,
                breakpoints,
            );
            let options = self.variant_options(&name);
            for rule in rules {
                for selected in Self::static_rule_selections(config, &rule, &responsive, &options) {
                    encoded.process_usage(self, &name, &selected, conditions, breakpoints);
                }
            }
        }
    }

    fn has_recipe(&self, name: &str) -> bool {
        self.recipes.contains_key(name) || self.slot_recipes.contains_key(name)
    }

    fn static_rule_selections(
        config: &UserConfig,
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
                    conditional_static_value(config, &conditions, &value)
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
    config: &UserConfig,
    conditions: &[String],
    value: &Literal,
) -> Literal {
    let mut entries = vec![("base".to_owned(), value.clone())];
    entries.extend(conditions.iter().map(|condition| {
        let key = if config.is_condition_key(condition) {
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
                    let class_name = recipe_variant_class_name(
                        class_name,
                        &group.name,
                        resolver.separator,
                        &option.key,
                    );
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
    base_class: &str,
    recipe: &Recipe,
    resolver: &StyleResolver<'_>,
) -> Vec<ResolvedCompoundVariant> {
    recipe
        .compound_variants
        .iter()
        .map(|compound| {
            let conditions = intern_variant_condition_values(&compound.conditions);
            let pairs = canonical_compound_pairs(&conditions);
            let class_name = compound_class_name(
                base_class,
                &pairs,
                compound.class_name.as_deref(),
                resolver.separator,
                resolver.hash_class_names,
            );
            ResolvedCompoundVariant {
                conditions,
                target: CompoundTarget::Recipe(ResolvedRecipePart {
                    class_name: class_name.into_boxed_str(),
                    entries: resolver.recipe_entries(&compound.css),
                }),
            }
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
                            let class_name = recipe_variant_class_name(
                                &slot_class,
                                &group.name,
                                resolver.separator,
                                &option.key,
                            );
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
    base_class: &str,
    recipe: &SlotRecipe,
    resolver: &StyleResolver<'_>,
) -> Vec<ResolvedCompoundVariant> {
    recipe
        .compound_variants
        .iter()
        .map(|compound| {
            let conditions = intern_variant_condition_values(&compound.conditions);
            let pairs = canonical_compound_pairs(&conditions);
            let slots = compound
                .css
                .iter()
                .map(|(slot, style)| {
                    let slot_class = RecipeRegistry::slot_class_name(base_class, slot);
                    let class_name = compound_class_name(
                        &slot_class,
                        &pairs,
                        compound.class_name.as_deref(),
                        resolver.separator,
                        resolver.hash_class_names,
                    );
                    (
                        slot.clone().into_boxed_str(),
                        ResolvedRecipePart {
                            class_name: class_name.into_boxed_str(),
                            entries: resolver.recipe_entries(style),
                        },
                    )
                })
                .collect();
            ResolvedCompoundVariant {
                conditions,
                target: CompoundTarget::Slots(slots),
            }
        })
        .collect()
}

fn canonical_compound_pairs(conditions: &[(Box<str>, Vec<Box<str>>)]) -> Vec<(String, String)> {
    let mut pairs = conditions
        .iter()
        .map(|(name, values)| {
            let value = values
                .iter()
                .map(std::convert::AsRef::as_ref)
                .collect::<Vec<_>>()
                .join("|");
            (name.to_string(), value)
        })
        .collect::<Vec<_>>();
    pairs.sort_by_key(|(name, _)| name.clone());
    pairs
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

#[derive(Debug, Clone)]
pub struct EncodedRecipes {
    base: FxHashMap<RecipePartKey, RecipeStyleGroup>,
    variants: FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
    compounds: FxHashMap<RecipeVariantKey, RecipeStyleGroup>,
    atomic: FxHashSet<Atom>,
    smart_compound_variants: bool,
    compounds_emitted: FxHashSet<Box<str>>,
}

impl Default for EncodedRecipes {
    fn default() -> Self {
        Self::new(false)
    }
}

#[derive(Debug, Default)]
pub(crate) struct EncodedRecipesCache {
    view: EncodedRecipes,
    base_counts: FxHashMap<RecipePartKey, CountedRecipeStyleGroup>,
    variant_counts: FxHashMap<RecipeVariantKey, CountedRecipeStyleGroup>,
    compound_counts: FxHashMap<RecipeVariantKey, CountedRecipeStyleGroup>,
    atomic_counts: FxHashMap<Atom, u32>,
}

#[derive(Debug, Default)]
struct CountedRecipeStyleGroup {
    class_name: Box<str>,
    conditions: SmallVec<[Box<str>; 2]>,
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
    conditions: SmallVec<[Box<str>; 2]>,
}

impl EncodedRecipes {
    pub(crate) fn new(smart_compound_variants: bool) -> Self {
        Self {
            base: FxHashMap::default(),
            variants: FxHashMap::default(),
            compounds: FxHashMap::default(),
            atomic: FxHashSet::default(),
            smart_compound_variants,
            compounds_emitted: FxHashSet::default(),
        }
    }

    pub(crate) fn clear(&mut self) {
        self.base.clear();
        self.variants.clear();
        self.compounds.clear();
        self.atomic.clear();
        self.compounds_emitted.clear();
    }

    pub(crate) fn is_empty(&self) -> bool {
        self.base.is_empty()
            && self.variants.is_empty()
            && self.compounds.is_empty()
            && self.atomic.is_empty()
    }

    pub(crate) fn extend_missing_from(&mut self, source: &Self) -> Self {
        let mut missing = Self::default();
        extend_missing_recipe_groups(&mut self.base, &mut missing.base, &source.base);
        extend_missing_recipe_groups(&mut self.variants, &mut missing.variants, &source.variants);
        extend_missing_recipe_groups(
            &mut self.compounds,
            &mut missing.compounds,
            &source.compounds,
        );
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
        breakpoints: &[String],
    ) {
        if let Some(node) = recipes.recipe(recipe_name) {
            self.process_recipe(node, selected, conditions, breakpoints);
        } else if let Some(node) = recipes.slot_recipe(recipe_name) {
            self.process_slot_recipe(node, selected, conditions, breakpoints);
        }
    }

    fn process_recipe(
        &mut self,
        node: &RecipeNode,
        selected: &Literal,
        conditions: &ProjectConditionMatcher,
        breakpoints: &[String],
    ) {
        if let Some(base) = node.base.as_ref() {
            let key = recipe_part_key(&node.name, None);
            self.base.entry(key).or_insert_with(|| RecipeStyleGroup {
                class_name: base.class_name.clone(),
                conditions: SmallVec::new(),
                entries: base.entries.clone(),
            });
        }

        let selected = selected_variants(&node.default_variants, selected, conditions, breakpoints);
        for group in &node.variants {
            let Some(selected_values) = selected.get(group.name.as_ref()) else {
                continue;
            };
            for selected_value in selected_values {
                let Some(option) = group.options.get(selected_value.key.as_ref()) else {
                    continue;
                };
                let key = recipe_variant_key(
                    &node.name,
                    None,
                    &option.class_name,
                    &selected_value.conditions,
                );
                self.variants
                    .entry(key)
                    .or_insert_with(|| RecipeStyleGroup {
                        class_name: option.class_name.clone(),
                        conditions: selected_value.conditions.clone(),
                        entries: FxHashSet::default(),
                    })
                    .entries
                    .extend(option.entries.iter().cloned());
            }
        }

        self.process_compounds(&node.name, &node.compounds, &selected);
    }

    fn process_slot_recipe(
        &mut self,
        node: &SlotRecipeNode,
        selected: &Literal,
        conditions: &ProjectConditionMatcher,
        breakpoints: &[String],
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
                    conditions: SmallVec::new(),
                    entries: part.entries.clone(),
                },
            );
        }

        let selected = selected_variants(&node.default_variants, selected, conditions, breakpoints);
        for group in &node.variants {
            let Some(selected_values) = selected.get(group.name.as_ref()) else {
                continue;
            };
            for selected_value in selected_values {
                let Some(slots) = group.options.get(selected_value.key.as_ref()) else {
                    continue;
                };
                for (slot, part) in slots {
                    let key = recipe_variant_key(
                        &node.name,
                        Some(slot),
                        &part.class_name,
                        &selected_value.conditions,
                    );
                    self.variants
                        .entry(key)
                        .or_insert_with(|| RecipeStyleGroup {
                            class_name: part.class_name.clone(),
                            conditions: selected_value.conditions.clone(),
                            entries: FxHashSet::default(),
                        })
                        .entries
                        .extend(part.entries.iter().cloned());
                }
            }
        }

        self.process_compounds(&node.name, &node.compounds, &selected);
    }

    fn process_compounds(
        &mut self,
        recipe_name: &str,
        compounds: &[ResolvedCompoundVariant],
        selected: &FxHashMap<Box<str>, Vec<SelectedVariantValue>>,
    ) {
        if self.smart_compound_variants {
            self.process_matching_compounds(recipe_name, compounds, selected);
        } else {
            self.emit_eager_compounds(recipe_name, compounds);
        }
    }

    fn emit_eager_compounds(&mut self, recipe_name: &str, compounds: &[ResolvedCompoundVariant]) {
        if !self.compounds_emitted.insert(recipe_name.into()) {
            return;
        }
        for compound in compounds {
            self.emit_compound_parts(recipe_name, compound, &SmallVec::new());
        }
    }

    fn process_matching_compounds(
        &mut self,
        recipe_name: &str,
        compounds: &[ResolvedCompoundVariant],
        selected: &FxHashMap<Box<str>, Vec<SelectedVariantValue>>,
    ) {
        for compound in compounds {
            let Some(conditions) = compound_conditions(compound, selected) else {
                continue;
            };
            self.emit_compound_parts(recipe_name, compound, &conditions);
        }
    }

    fn emit_compound_parts(
        &mut self,
        recipe_name: &str,
        compound: &ResolvedCompoundVariant,
        extra_conditions: &SmallVec<[Box<str>; 2]>,
    ) {
        match &compound.target {
            CompoundTarget::Recipe(part) => {
                self.insert_compound_group(recipe_name, None, part, extra_conditions);
            }
            CompoundTarget::Slots(slots) => {
                for (slot, part) in slots {
                    self.insert_compound_group(
                        recipe_name,
                        Some(slot.as_ref()),
                        part,
                        extra_conditions,
                    );
                }
            }
        }
    }

    fn insert_compound_group(
        &mut self,
        recipe_name: &str,
        slot: Option<&str>,
        part: &ResolvedRecipePart,
        extra_conditions: &SmallVec<[Box<str>; 2]>,
    ) {
        let key = recipe_variant_key(recipe_name, slot, &part.class_name, extra_conditions);
        let group = self
            .compounds
            .entry(key)
            .or_insert_with(|| RecipeStyleGroup {
                class_name: part.class_name.clone(),
                conditions: extra_conditions.clone(),
                entries: FxHashSet::default(),
            });
        group.entries.extend(part.entries.iter().cloned());
    }

    #[must_use]
    pub fn snapshot(&self) -> EncodedRecipesSnapshot {
        EncodedRecipesSnapshot {
            base: sorted_recipe_part_group_snapshots(&self.base),
            variants: sorted_recipe_variant_group_snapshots(&self.variants),
            compounds: sorted_recipe_variant_group_snapshots(&self.compounds),
            atomic: sorted_atoms_vec(&self.atomic),
        }
    }

    pub(crate) fn transform_utilities(
        &mut self,
        utility: Option<&Utility>,
        conditions: &ProjectConditionMatcher,
        breakpoints: &[String],
        transform: &mut crate::UtilityTransformFn<'_>,
        diagnostics: &mut Vec<Diagnostic>,
    ) {
        let ctx = RecipeTransformCtx {
            utility,
            conditions,
            breakpoints,
        };
        transform_recipe_groups(&mut self.base, &ctx, transform, diagnostics);
        transform_recipe_groups(&mut self.variants, &ctx, transform, diagnostics);
        transform_recipe_groups(&mut self.compounds, &ctx, transform, diagnostics);
        self.atomic = transform_atoms(
            std::mem::take(&mut self.atomic),
            &ctx,
            transform,
            diagnostics,
        );
    }
}

/// Context for re-encoding a recipe utility transform's style object into atoms.
struct RecipeTransformCtx<'a> {
    utility: Option<&'a Utility>,
    conditions: &'a ProjectConditionMatcher,
    breakpoints: &'a [String],
}

impl RecipeTransformCtx<'_> {
    /// Encode a transform's style object into atoms via the normal encoder path,
    /// so nested conditions/selectors resolve instead of becoming junk props.
    fn encode(&self, styles: &Literal) -> FxHashSet<Atom> {
        let normalizer = StyleNormalizer::internal(self.utility, self.breakpoints);
        let mut encoder = Encoder::with_conditions(self.conditions.clone());
        encoder.process_atomic_with(styles, &normalizer);
        encoder.into_atoms()
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
                conditions: group.conditions.clone(),
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
                    conditions: group.conditions.clone(),
                    entries: missing_entries,
                },
            );
        }
    }
}

fn transform_atoms(
    atoms: FxHashSet<Atom>,
    ctx: &RecipeTransformCtx<'_>,
    transform: &mut crate::UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) -> FxHashSet<Atom> {
    let mut out = FxHashSet::default();
    for atom in atoms {
        let resolved = crate::resolved_atom_value(ctx.utility, atom.prop(), atom.value());
        match transform(atom.prop(), &resolved, atom.value()) {
            // Empty result drops the carrier atom (parity with node).
            Ok(Some(styles)) if crate::is_empty_style_object(&styles) => {}
            Ok(Some(styles)) => {
                // Recipe atomic has no per-utility class: re-encode into atoms
                // and prefix the carrier atom's conditions.
                let conditions: SmallVec<[Box<str>; 2]> =
                    atom.conditions().iter().cloned().collect();
                out.extend(
                    ctx.encode(&styles)
                        .into_iter()
                        .map(|next| next.with_prefixed_conditions(&conditions)),
                );
            }
            Ok(None) => {
                out.insert(atom);
            }
            Err(diagnostic) => diagnostics.push(with_callback_target(
                diagnostic,
                atom.prop(),
                Some(&atom_value_summary(atom.value())),
            )),
        }
    }
    out
}

fn transform_recipe_groups<K: Eq + std::hash::Hash>(
    groups: &mut FxHashMap<K, RecipeStyleGroup>,
    ctx: &RecipeTransformCtx<'_>,
    transform: &mut crate::UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    for group in groups.values_mut() {
        group.entries = transform_recipe_entries(
            std::mem::take(&mut group.entries),
            ctx,
            transform,
            diagnostics,
        );
    }
}

fn transform_recipe_entries(
    entries: FxHashSet<RecipeStyleEntry>,
    ctx: &RecipeTransformCtx<'_>,
    transform: &mut crate::UtilityTransformFn<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) -> FxHashSet<RecipeStyleEntry> {
    let mut out = FxHashSet::default();
    for entry in entries {
        let resolved = crate::resolved_atom_value(ctx.utility, entry.prop.as_ref(), &entry.value);
        match transform(entry.prop.as_ref(), &resolved, &entry.value) {
            Ok(Some(styles)) if crate::is_empty_style_object(&styles) => {}
            Ok(Some(styles)) => {
                if let Some(entries) =
                    flat_transform_recipe_entries(&styles, &entry.conditions, entry.important)
                {
                    out.extend(entries);
                } else {
                    // Re-encode nested transform output into entries,
                    // prefixing the originating entry's conditions /
                    // important.
                    for atom in ctx.encode(&styles) {
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
            }
            Ok(None) => {
                out.insert(entry);
            }
            Err(diagnostic) => diagnostics.push(with_callback_target(
                diagnostic,
                entry.prop.as_ref(),
                Some(&atom_value_summary(&entry.value)),
            )),
        }
    }
    out
}

fn flat_transform_recipe_entries(
    styles: &Literal,
    base_conditions: &SmallVec<[Box<str>; 2]>,
    inherited_important: bool,
) -> Option<FxHashSet<RecipeStyleEntry>> {
    let Literal::Object(entries) = styles else {
        return None;
    };

    let mut out = FxHashSet::default();
    for (prop, value) in entries {
        let (value, important) = flat_transform_recipe_value(value)?;
        out.insert(RecipeStyleEntry {
            prop: prop.clone().into_boxed_str(),
            value,
            conditions: base_conditions.clone(),
            important: inherited_important || important,
        });
    }
    Some(out)
}

fn flat_transform_recipe_value(value: &Literal) -> Option<(AtomValue, bool)> {
    match value {
        Literal::String(value) => {
            let (value, important) = split_important(value);
            Some((
                AtomValue::String(value.into_owned().into_boxed_str()),
                important,
            ))
        }
        Literal::Token { path, value } => {
            let (value, important) = split_important(value);
            Some((
                AtomValue::Token {
                    path: path.clone().into_boxed_str(),
                    value: value.into_owned().into_boxed_str(),
                },
                important,
            ))
        }
        Literal::Number(value) => Some((
            AtomValue::Number(number_to_js_string(*value).into_boxed_str()),
            false,
        )),
        Literal::Bool(value) => Some((AtomValue::Bool(*value), false)),
        Literal::Null => Some((AtomValue::Null, false)),
        Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}

fn with_callback_target(mut diagnostic: Diagnostic, prop: &str, value: Option<&str>) -> Diagnostic {
    if diagnostic.code != diagnostic_codes::TRANSFORM_CALLBACK_FAILED {
        return diagnostic;
    }
    let target = value.map_or_else(
        || format!("utility `{prop}`"),
        |value| format!("utility `{prop}` with value `{value}`"),
    );
    diagnostic.message = format!("{} ({target})", diagnostic.message);
    diagnostic
}

fn atom_value_summary(value: &AtomValue) -> String {
    match value {
        AtomValue::String(value) | AtomValue::Number(value) | AtomValue::Token { value, .. } => {
            value.to_string()
        }
        AtomValue::Bool(value) => value.to_string(),
        AtomValue::Null => "null".to_owned(),
    }
}

impl EncodedRecipesCache {
    pub(crate) fn clear(&mut self) {
        self.view.clear();
        self.base_counts.clear();
        self.variant_counts.clear();
        self.compound_counts.clear();
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
        add_recipe_variant_groups(
            &mut self.view.compounds,
            &mut self.compound_counts,
            &recipes.compounds,
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
        remove_recipe_variant_groups(
            &mut self.view.compounds,
            &mut self.compound_counts,
            &recipes.compounds,
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
                conditions: group.conditions.clone(),
                entries: FxHashMap::default(),
            });
        let view_group = view.entry(key.clone()).or_insert_with(|| RecipeStyleGroup {
            class_name: counted.class_name.clone(),
            conditions: counted.conditions.clone(),
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
                conditions: group.conditions.clone(),
                entries: FxHashMap::default(),
            });
        let view_group = view.entry(key.clone()).or_insert_with(|| RecipeStyleGroup {
            class_name: counted.class_name.clone(),
            conditions: counted.conditions.clone(),
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

fn recipe_variant_key(
    recipe: &str,
    slot: Option<&str>,
    class_name: &str,
    conditions: &SmallVec<[Box<str>; 2]>,
) -> RecipeVariantKey {
    RecipeVariantKey {
        recipe: recipe.into(),
        slot: slot.map(Into::into),
        class_name: class_name.into(),
        conditions: conditions.clone(),
    }
}

fn recipe_variant_class_name(
    class_name: &str,
    variant: &str,
    separator: &str,
    value: &str,
) -> String {
    format!("{class_name}--{variant}{separator}{value}")
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
    breakpoints: &[String],
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
        collect_selected_variant_values(value, conditions, breakpoints, &mut path, &mut values);
        // An explicitly-provided key overrides its default even when the value
        // yields no usable variant (`size: []` / `{}` / `null`) — matching JS
        // destructuring, where a default applies only to an *absent* key.
        // (`size: undefined` is dropped upstream, so it never reaches here.)
        if values.is_empty() {
            out.remove(key.as_str());
        } else {
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
    breakpoints: &[String],
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
                    collect_selected_variant_values(value, conditions, breakpoints, path, out);
                }
                if is_condition && key != "base" {
                    path.pop();
                }
            }
        }
        Literal::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                if matches!(item, Literal::Null) {
                    continue;
                }
                let Some(condition) = breakpoints.get(index) else {
                    continue;
                };
                if condition != "base" {
                    path.push(condition.clone().into_boxed_str());
                }
                collect_selected_variant_values(item, conditions, breakpoints, path, out);
                if condition != "base" {
                    path.pop();
                }
            }
        }
        Literal::Conditional(branches) => {
            for branch in branches {
                collect_selected_variant_values(branch, conditions, breakpoints, path, out);
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
        Literal::String(value) | Literal::Token { value, .. } => Some(value.clone()),
        Literal::Number(value) => Some(number_to_js_string(*value)),
        Literal::Bool(true) => Some("true".to_owned()),
        Literal::Bool(false) => Some("false".to_owned()),
        Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
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
            conditions: group.conditions.clone(),
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
            conditions: group.conditions.clone(),
            entries: sorted_recipe_entries(&group.entries),
        })
        .collect();
    out.sort_by(|a, b| {
        a.recipe
            .cmp(&b.recipe)
            .then_with(|| slot_sort_key(&a.slot).cmp(slot_sort_key(&b.slot)))
            .then_with(|| a.conditions.cmp(&b.conditions))
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

#[cfg(test)]
mod compound_tests {
    use super::*;
    use pandacss_encoder::{Atom, AtomValue};

    fn test_atom(prop: &str, value: &str) -> Atom {
        Atom::new(
            prop.into(),
            AtomValue::String(value.into()),
            SmallVec::new(),
            false,
        )
    }

    fn compound(
        class_name: &str,
        conditions: Vec<(&str, Vec<&str>)>,
        props: &[(&str, &str)],
    ) -> ResolvedCompoundVariant {
        let entries = props
            .iter()
            .map(|(prop, value)| RecipeStyleEntry::from(test_atom(prop, value)))
            .collect();
        ResolvedCompoundVariant {
            conditions: conditions
                .into_iter()
                .map(|(name, values)| (name.into(), values.into_iter().map(Into::into).collect()))
                .collect(),
            target: CompoundTarget::Recipe(ResolvedRecipePart {
                class_name: class_name.into(),
                entries,
            }),
        }
    }

    fn selected(size: &str) -> FxHashMap<Box<str>, Vec<SelectedVariantValue>> {
        let mut out = FxHashMap::default();
        out.insert(
            "size".into(),
            vec![SelectedVariantValue {
                key: size.into(),
                conditions: SmallVec::new(),
            }],
        );
        out
    }

    #[test]
    fn eager_mode_emits_all_compound_groups_on_first_recipe_touch() {
        let compounds = vec![
            compound(
                "badge--cmp-sm",
                vec![("size", vec!["sm"])],
                &[("color", "red")],
            ),
            compound(
                "badge--cmp-md",
                vec![("size", vec!["md"])],
                &[("color", "blue")],
            ),
        ];
        let mut encoded = EncodedRecipes::new(false);
        let empty = FxHashMap::default();

        encoded.process_compounds("badge", &compounds, &empty);
        assert_eq!(encoded.compounds.len(), 2);

        encoded.process_compounds("badge", &compounds, &empty);
        assert_eq!(encoded.compounds.len(), 2);
    }

    #[test]
    fn smart_mode_emits_only_matching_compound_groups() {
        let compounds = vec![
            compound(
                "badge--cmp-sm",
                vec![("size", vec!["sm"])],
                &[("color", "red")],
            ),
            compound(
                "badge--cmp-md",
                vec![("size", vec!["md"])],
                &[("color", "blue")],
            ),
        ];
        let mut encoded = EncodedRecipes::new(true);

        encoded.process_compounds("badge", &compounds, &selected("sm"));
        assert_eq!(encoded.compounds.len(), 1);
        let group = encoded.compounds.values().next().expect("one group");
        assert_eq!(group.class_name.as_ref(), "badge--cmp-sm");
        let entry = group.entries.iter().next().expect("one entry");
        assert_eq!(entry.prop.as_ref(), "color");
        assert_eq!(entry.value, AtomValue::String("red".into()));
    }

    #[test]
    fn smart_mode_compound_array_selection_matches_any_value() {
        let compounds = vec![compound(
            "badge--compound__size_sm|md",
            vec![("size", vec!["sm", "md"])],
            &[("color", "red")],
        )];
        let mut encoded = EncodedRecipes::new(true);

        encoded.process_compounds("badge", &compounds, &selected("md"));
        assert_eq!(encoded.compounds.len(), 1);
        let group = encoded.compounds.values().next().expect("one group");
        assert_eq!(group.class_name.as_ref(), "badge--compound__size_sm|md");

        let mut encoded = EncodedRecipes::new(true);
        encoded.process_compounds("badge", &compounds, &selected("lg"));
        assert!(encoded.compounds.is_empty());
    }

    #[test]
    fn smart_mode_skips_non_matching_compounds() {
        let compounds = vec![compound(
            "badge--cmp-sm",
            vec![("size", vec!["sm"])],
            &[("color", "red")],
        )];
        let mut encoded = EncodedRecipes::new(true);

        encoded.process_compounds("badge", &compounds, &selected("md"));
        assert!(encoded.compounds.is_empty());
    }
}
