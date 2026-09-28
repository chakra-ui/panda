//! Static `.raw(props)` and `(props)` resolution for inline `cva`/`sva` definitions, shared by
//! extraction and source transforms.

use pandacss_extractor::{ExpressionFacts, ExpressionKind};
use pandacss_literal::Literal;
use pandacss_recipes::{
    CompoundVariant, Recipe, SlotRecipe, VariantGroup, VariantOption, VariantValue,
};

use crate::{System, merge_style_props};

/// Static variant props from a `.raw({ … })` argument, typed like the literal they were written as.
///
/// `None` means the call can't be resolved at build time.
#[must_use]
pub fn raw_call_variant_props(args: &[Option<ExpressionFacts>]) -> Option<Literal> {
    if args.len() > 1 {
        return None;
    }
    let Some(arg) = args.first() else {
        return Some(Literal::Object(Vec::new()));
    };
    let facts = arg.as_ref()?;
    if facts.kind != ExpressionKind::Object {
        return None;
    }
    let object = facts.object.as_ref()?;

    let mut props: Vec<(String, Literal)> = Vec::with_capacity(object.properties.len());
    for prop in &object.properties {
        if prop.is_spread() || prop.is_accessor_or_method {
            return None;
        }
        let key = prop.key.as_ref()?;
        let value = scalar_literal(prop.value.as_ref()?)?;
        match props.iter_mut().find(|(name, _)| name == key) {
            Some(entry) => entry.1 = value,
            None => props.push((key.clone(), value)),
        }
    }
    Some(Literal::Object(props))
}

/// Strings carry `string_value`; `static_scalar_key` spells booleans and numbers as property keys.
fn scalar_literal(facts: &ExpressionFacts) -> Option<Literal> {
    if let Some(text) = &facts.string_value {
        return Some(Literal::String(text.clone()));
    }
    Some(match facts.static_scalar_key.as_deref()? {
        "true" => Literal::Bool(true),
        "false" => Literal::Bool(false),
        number => Literal::Number(number.parse().ok()?),
    })
}

/// Resolve `binding.raw(props)` for an inline `cva` or `sva` definition.
#[must_use]
pub fn resolve_inline_recipe_raw(
    system: &System,
    factory: &str,
    definition: &Literal,
    props: &Literal,
) -> Option<Literal> {
    let props = selected_props(props)?;
    if factory == "sva" {
        let recipe = SlotRecipe::from_literal(definition)?;
        let slots = recipe
            .slots
            .iter()
            .map(|slot| {
                let styles = raw_styles(system, &slot_recipe_for(&recipe, slot), &props)?;
                Some((slot.clone(), styles))
            })
            .collect::<Option<Vec<_>>>()?;
        return Some(Literal::Object(slots));
    }
    raw_styles(system, &cva_recipe(definition)?, &props)
}

/// Mirror of the generated `cva(...).raw`: base, then each selected variant in
/// `{ ...defaultVariants, ...props }` order, then compound css, merged by `mergeCss`.
fn raw_styles(system: &System, recipe: &Recipe, props: &[(String, Selected)]) -> Option<Literal> {
    let selection = Selection { recipe, props };
    let base = recipe
        .base
        .clone()
        .unwrap_or_else(|| Literal::Object(Vec::new()));
    let mut styles = vec![Some(base)];
    for name in selection.computed_names() {
        if let Some(group) = recipe.variants.iter().find(|group| group.name == name)
            && let Some(option) = selection.option(group)
        {
            styles.push(Some(option.style.clone()));
        }
    }

    let mut compounds: Vec<&Literal> = Vec::new();
    for compound in &recipe.compound_variants {
        if selection.matches(compound) {
            compounds.push(&compound.css);
        }
    }
    styles.push(Some(merge_style_props(&compounds)));

    system.merged_style_literal(&styles)
}

/// A `cva` argument as a recipe; a bare style object is its base.
fn cva_recipe(definition: &Literal) -> Option<Recipe> {
    if is_recipe_config(definition) {
        return Recipe::from_literal(definition);
    }
    Some(Recipe {
        base: Some(definition.clone()),
        ..Recipe::default()
    })
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

/// Whether an inline `cva` argument is a full recipe config rather than a bare style object.
#[must_use]
pub fn is_recipe_config(config: &Literal) -> bool {
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

/// What a static call on an inline recipe returns: a class string, or one per slot.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InlineRecipeClasses {
    Cva(String),
    Sva(Vec<(String, String)>),
}

/// A prop value as the compiled recipe sees it: strict for compounds, coerced for lookups.
#[derive(Debug, Clone, PartialEq)]
enum Selected {
    Missing,
    Null,
    Value(VariantValue),
}

impl Selected {
    fn from_literal(value: &Literal) -> Option<Self> {
        match value {
            Literal::Null => Some(Self::Null),
            value => VariantValue::from_literal(value).map(Self::Value),
        }
    }

    /// The property key a `{ …options }[value]` lookup coerces to.
    fn lookup_key(&self) -> Option<String> {
        match self {
            Self::Missing => None,
            Self::Null => Some("null".to_owned()),
            Self::Value(value) => Some(value.key()),
        }
    }
}

fn selected_props(props: &Literal) -> Option<Vec<(String, Selected)>> {
    let Literal::Object(entries) = props else {
        return None;
    };
    entries
        .iter()
        .map(|(key, value)| Some((key.clone(), Selected::from_literal(value)?)))
        .collect()
}

/// Props over `defaultVariants`, as `withDefaults` combines them.
struct Selection<'a> {
    recipe: &'a Recipe,
    props: &'a [(String, Selected)],
}

impl<'a> Selection<'a> {
    fn get(&self, name: &str) -> Selected {
        match self.props.iter().find(|(key, _)| key == name) {
            Some((_, value)) => value.clone(),
            None => self
                .recipe
                .default_variants
                .iter()
                .find(|(key, _)| key == name)
                .map_or(Selected::Missing, |(_, value)| {
                    Selected::Value(value.clone())
                }),
        }
    }

    /// Keys of `{ ...defaultVariants, ...props }` in insertion order.
    fn computed_names(&self) -> impl Iterator<Item = &'a str> {
        let defaults = &self.recipe.default_variants;
        let added = self
            .props
            .iter()
            .filter(|(key, _)| !defaults.iter().any(|(name, _)| name == key));
        defaults
            .iter()
            .map(|(name, _)| name.as_str())
            .chain(added.map(|(key, _)| key.as_str()))
    }

    fn option<'g>(&self, group: &'g VariantGroup) -> Option<&'g VariantOption> {
        let key = self.get(&group.name).lookup_key()?;
        group.options.iter().find(|option| option.key == key)
    }

    fn matches(&self, compound: &CompoundVariant) -> bool {
        compound.conditions.iter().all(|(name, values)| {
            let Selected::Value(actual) = self.get(name) else {
                return false;
            };
            values.contains(&actual)
        })
    }
}

/// Mirror of the compiled recipe for static props: defaults fill `undefined`, each variant
/// group adds its option's classes in declared order, then matching compounds, and the
/// fragments merge like `cx` (first position keeps the slot, the last class for a key wins).
#[must_use]
pub fn inline_recipe_classes(
    system: &System,
    factory: &str,
    definition: &Literal,
    props: &Literal,
) -> Option<InlineRecipeClasses> {
    let props = selected_props(props)?;
    if factory == "sva" {
        let recipe = SlotRecipe::from_literal(definition)?;
        let slots = if recipe.slots.is_empty() {
            recipe.base.iter().map(|(slot, _)| slot.clone()).collect()
        } else {
            recipe.slots.clone()
        };
        let classes = slots
            .iter()
            .map(|slot| {
                let mut classes =
                    recipe_fragments(system, &slot_recipe_for(&recipe, slot), &props)?;
                if let Some(prefix) = &recipe.class_name {
                    classes.push(format!("{prefix}__{slot}"));
                }
                Some((slot.clone(), merge_classes(system, classes)))
            })
            .collect::<Option<Vec<_>>>()?;
        return Some(InlineRecipeClasses::Sva(classes));
    }
    let classes = recipe_fragments(system, &cva_recipe(definition)?, &props)?;
    Some(InlineRecipeClasses::Cva(merge_classes(system, classes)))
}

/// Classes of every fragment the compiled recipe joins, in its order.
fn recipe_fragments(
    system: &System,
    recipe: &Recipe,
    props: &[(String, Selected)],
) -> Option<Vec<String>> {
    let selection = Selection { recipe, props };
    let mut classes = Vec::new();
    if let Some(base) = &recipe.base {
        add_style_classes(system, &mut classes, base)?;
    }
    for group in &recipe.variants {
        if let Some(option) = selection.option(group) {
            add_style_classes(system, &mut classes, &option.style)?;
        }
    }
    for compound in &recipe.compound_variants {
        if selection.matches(compound) {
            match &compound.class_name {
                Some(class_name) => classes.push(class_name.clone()),
                None => add_style_classes(system, &mut classes, &compound.css)?,
            }
        }
    }
    Some(classes)
}

/// An empty style adds nothing; anything the encoder can't handle keeps the call on the runtime.
fn add_style_classes(system: &System, classes: &mut Vec<String>, style: &Literal) -> Option<()> {
    if !matches!(style, Literal::Object(entries) if entries.is_empty()) {
        classes.extend(system.class_names_for_style_literal(style)?);
    }
    Some(())
}

/// `cx`: a class keyed by its conditions and property keeps the first position and the last value.
fn merge_classes(system: &System, classes: Vec<String>) -> String {
    let separator = system
        .utility()
        .map_or("_", pandacss_utility::Utility::separator);
    let mut out: Vec<String> = Vec::with_capacity(classes.len());
    let mut slots: Vec<(String, usize)> = Vec::new();
    for class in classes {
        let Some(key) = merge_key(&class, separator) else {
            out.push(class);
            continue;
        };
        if let Some((_, slot)) = slots.iter().find(|(existing, _)| *existing == key) {
            out[*slot] = class;
        } else {
            slots.push((key.to_owned(), out.len()));
            out.push(class);
        }
    }
    out.join(" ")
}

/// Conditions and property: the prefix up to the separator after the last top-level `:`.
fn merge_key<'a>(class: &'a str, separator: &str) -> Option<&'a str> {
    let end = class.strip_suffix('!').unwrap_or(class).len();
    if end == 0 {
        return None;
    }
    let mut depth = 0i32;
    let mut property_start = 0;
    for (index, byte) in class.bytes().enumerate().take(end) {
        match byte {
            b'[' => depth += 1,
            b']' => depth -= 1,
            b':' if depth == 0 => property_start = index + 1,
            _ => {}
        }
    }
    let separator_at = property_start + class[property_start..end].find(separator)?;
    (separator_at > property_start).then(|| &class[..separator_at])
}
