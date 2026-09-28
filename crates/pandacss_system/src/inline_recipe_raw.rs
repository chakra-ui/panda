//! Static `.raw(props)` resolution for inline `cva`/`sva` definitions, shared by
//! extraction and source transforms.

use pandacss_extractor::{ExpressionFacts, ExpressionKind};
use pandacss_literal::Literal;
use pandacss_recipes::{CompoundVariant, Recipe, SlotRecipe, VariantGroup, VariantOption};

use crate::{System, merge_style_props};

// ---------------------------------------------------------------------------
// `binding.raw(props)` on an inline cva/sva — folds to the resolved styles.
// ---------------------------------------------------------------------------

/// Static variant selection from a `.raw({ … })` argument.
///
/// `None` means the call can't be resolved at build time, which also blocks the
/// string-branch desugar of the definition — the runtime `raw` returns style
/// objects and the desugared one returns class strings.
#[must_use]
pub fn raw_call_variant_props(args: &[Option<ExpressionFacts>]) -> Option<Vec<(String, String)>> {
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
        let value = value.static_scalar_key.clone()?;
        upsert_prop(&mut props, key.clone(), value);
    }
    Some(props)
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
    config: &System,
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
    styles.push(Some(merge_style_props(&compounds)));

    config.merged_style_literal(&styles)
}

/// Mirror of the generated `sva(...).raw` — one resolved style object per slot.
pub(crate) fn resolve_sva_raw_styles(
    config: &System,
    recipe: &SlotRecipe,
    props: &[(String, String)],
) -> Option<Literal> {
    let mut slots = Vec::with_capacity(recipe.slots.len());
    for slot in &recipe.slots {
        let per_slot = slot_recipe_for(recipe, slot);
        slots.push((
            slot.clone(),
            resolve_cva_raw_styles(config, &per_slot, props)?,
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
#[must_use]
pub fn literal_variant_props(props: &Literal) -> Option<Vec<(String, String)>> {
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

#[must_use]
pub fn resolve_inline_recipe_raw(
    config: &System,
    factory: &str,
    definition: &Literal,
    props: &[(String, String)],
) -> Option<Literal> {
    if factory == "sva" {
        let recipe = SlotRecipe::from_literal(definition)?;
        return resolve_sva_raw_styles(config, &recipe, props);
    }
    let recipe = if is_recipe_config(definition) {
        Recipe::from_literal(definition)?
    } else {
        Recipe {
            base: Some(definition.clone()),
            ..Recipe::default()
        }
    };
    resolve_cva_raw_styles(config, &recipe, props)
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

// ---------------------------------------------------------------------------
// `binding(props)` on an inline cva/sva — folds to the classes the compiled
// recipe returns at runtime.
// ---------------------------------------------------------------------------

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
    Bool(bool),
    Number(String),
    String(String),
}

impl Selected {
    fn from_literal(value: &Literal) -> Option<Self> {
        Some(match value {
            Literal::String(text) => Self::String(text.clone()),
            Literal::Bool(flag) => Self::Bool(*flag),
            Literal::Number(number) => Self::Number(pandacss_shared::number_to_js_string(*number)),
            Literal::Null => Self::Null,
            _ => return None,
        })
    }

    /// Defaults and compound values print `"true"`/`"false"` as booleans, everything else as strings.
    fn from_config(value: &str) -> Self {
        match value {
            "true" => Self::Bool(true),
            "false" => Self::Bool(false),
            other => Self::String(other.to_owned()),
        }
    }

    /// The property key a `{ …options }[value]` lookup coerces to.
    fn lookup_key(&self) -> Option<String> {
        match self {
            Self::Missing => None,
            Self::Null => Some("null".to_owned()),
            Self::Bool(flag) => Some(flag.to_string()),
            Self::Number(text) | Self::String(text) => Some(text.clone()),
        }
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
    let Literal::Object(entries) = props else {
        return None;
    };
    let props = entries
        .iter()
        .map(|(key, value)| Some((key.clone(), Selected::from_literal(value)?)))
        .collect::<Option<Vec<_>>>()?;

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

    let recipe = if is_recipe_config(definition) {
        Recipe::from_literal(definition)?
    } else {
        Recipe {
            base: Some(definition.clone()),
            ..Recipe::default()
        }
    };
    let classes = recipe_fragments(system, &recipe, &props)?;
    Some(InlineRecipeClasses::Cva(merge_classes(system, classes)))
}

/// Classes of every fragment the compiled recipe joins, in its order.
fn recipe_fragments(
    system: &System,
    recipe: &Recipe,
    props: &[(String, Selected)],
) -> Option<Vec<String>> {
    let selected = |name: &str| match props.iter().find(|(key, _)| key == name) {
        Some((_, value)) => value.clone(),
        None => recipe
            .default_variants
            .iter()
            .find(|(key, _)| key == name)
            .map_or(Selected::Missing, |(_, value)| Selected::from_config(value)),
    };
    let mut classes = Vec::new();
    if let Some(base) = &recipe.base {
        add_style_classes(system, &mut classes, base)?;
    }
    for group in &recipe.variants {
        let Some(key) = selected(&group.name).lookup_key() else {
            continue;
        };
        if let Some(option) = group.options.iter().find(|option| option.key == key) {
            add_style_classes(system, &mut classes, &option.style)?;
        }
    }
    for compound in &recipe.compound_variants {
        let matches = compound.conditions.iter().all(|(name, values)| {
            let actual = selected(name);
            values
                .iter()
                .any(|value| Selected::from_config(value) == actual)
        });
        if matches {
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
