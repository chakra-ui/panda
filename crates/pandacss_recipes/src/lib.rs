//! Typed recipe / slot-recipe model and atomic decomposition. Mirrors the
//! cva / sva pipeline from `packages/parser` + `packages/core`: the extractor
//! produces a raw [`Literal::Object`] per `cva(...)` / `sva(...)` call, this
//! crate types it as [`Recipe`] / [`SlotRecipe`], and the encoder emits atomic
//! CSS from the typed shape.
//!
//! Variants keep source order for deterministic emit. Unknown keys are no-ops
//! (forward-compat); malformed shapes return `None`. `SlotRecipe::infer_slots`
//! mirrors the JS-side `Recipes.inferSlots`.

use rustc_hash::FxHashSet;
use serde::Serialize;
use serde_json::Value;

use pandacss_shared::{capitalize, number_to_js_string};

pub use pandacss_extractor::Literal;

#[must_use]
pub fn recipe_jsx_names(name: &str, recipe: &Value) -> Vec<String> {
    match recipe.get("jsx") {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(Value::as_str)
            .map(str::to_owned)
            .collect(),
        _ => vec![capitalize(name).into_owned()],
    }
}

#[must_use]
pub fn slot_recipe_jsx_names(name: &str, recipe: &Value) -> Vec<String> {
    let capitalized = capitalize(name);
    let mut names = recipe_jsx_names(name, recipe);
    names.push(format!("{capitalized}.Root"));
    names.push(format!("{capitalized}Root"));
    names
}

/// `cva({ base, variants, compoundVariants, defaultVariants })`.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Recipe {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base: Option<Literal>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub variants: Vec<VariantGroup>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub compound_variants: Vec<CompoundVariant>,
    /// Source-order `(variant_name, chosen_key)` pairs.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub default_variants: Vec<(String, String)>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct VariantGroup {
    pub name: String,
    pub options: Vec<VariantOption>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct VariantOption {
    pub key: String,
    pub style: Literal,
}

/// `{ size: 'sm', intent: 'danger', css: {…} }` — all `conditions` must match
/// for `css` to layer on top of base + per-variant styles.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CompoundVariant {
    pub conditions: Vec<(String, Vec<String>)>,
    pub css: Literal,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<String>,
}

/// `sva({ slots, base, variants, compoundVariants })`.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SlotRecipe {
    /// Slot names; inferred from `base` + variant option keys when omitted.
    pub slots: Vec<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub base: Vec<(String, Literal)>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub variants: Vec<SlotVariantGroup>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub compound_variants: Vec<SlotCompoundVariant>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub default_variants: Vec<(String, String)>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct SlotVariantGroup {
    pub name: String,
    pub options: Vec<SlotVariantOption>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SlotVariantOption {
    pub key: String,
    pub styles: Vec<(String, Literal)>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SlotCompoundVariant {
    pub conditions: Vec<(String, Vec<String>)>,
    pub css: Vec<(String, Literal)>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<String>,
}

impl Recipe {
    /// `None` only when `literal` isn't an object. A partial shape (missing
    /// `base` or `variants`) parses with empty fields instead of failing.
    #[must_use]
    pub fn from_literal(literal: &Literal) -> Option<Self> {
        Self::from_literal_owned(literal.clone())
    }

    #[must_use]
    pub fn from_literal_owned(literal: Literal) -> Option<Self> {
        let _span =
            tracing::trace_span!(target: "encode", "recipe_resolution", kind = "parse_recipe")
                .entered();
        let entries = object_entries_owned(literal)?;

        let mut recipe = Recipe::default();
        for (key, value) in entries {
            match key.as_str() {
                "base" => recipe.base = Some(value),
                "variants" => recipe.variants = parse_variants_owned(value),
                "compoundVariants" => {
                    recipe.compound_variants = parse_compound_variants_owned(value);
                }
                "defaultVariants" => recipe.default_variants = parse_string_map_owned(value),
                _ => {}
            }
        }

        Some(recipe)
    }

    /// Lazy iterator over every style object the encoder hashes: `base`, each
    /// variant option's style, each compound variant's `css`.
    pub fn atomic_styles(&self) -> impl Iterator<Item = &Literal> + '_ {
        self.base
            .as_ref()
            .into_iter()
            .chain(
                self.variants
                    .iter()
                    .flat_map(|g| g.options.iter().map(|o| &o.style)),
            )
            .chain(self.compound_variants.iter().map(|c| &c.css))
    }
}

impl SlotRecipe {
    #[must_use]
    pub fn from_literal(literal: &Literal) -> Option<Self> {
        Self::from_literal_owned(literal.clone())
    }

    #[must_use]
    pub fn from_literal_owned(literal: Literal) -> Option<Self> {
        let _span = tracing::trace_span!(
            target: "encode",
            "recipe_resolution",
            kind = "parse_slot_recipe"
        )
        .entered();
        let entries = object_entries_owned(literal)?;

        let mut slots: Vec<String> = Vec::new();
        let mut base: Vec<(String, Literal)> = Vec::new();
        let mut variants: Vec<SlotVariantGroup> = Vec::new();
        let mut compound_variants: Vec<SlotCompoundVariant> = Vec::new();
        let mut default_variants: Vec<(String, String)> = Vec::new();

        for (key, value) in entries {
            match key.as_str() {
                "slots" => slots = parse_string_array_owned(value),
                "base" => base = parse_slot_styles_owned(value),
                "variants" => variants = parse_slot_variants_owned(value),
                "compoundVariants" => {
                    compound_variants = parse_slot_compound_variants_owned(value);
                }
                "defaultVariants" => default_variants = parse_string_map_owned(value),
                _ => {}
            }
        }

        if slots.is_empty() {
            slots = Self::infer_slots(&base, &variants, &compound_variants);
        }

        Some(SlotRecipe {
            slots,
            base,
            variants,
            compound_variants,
            default_variants,
        })
    }

    /// Slot names in first-appearance order across `base`, variant options,
    /// and compound variants. Matches JS-side `Recipes.inferSlots`.
    #[must_use]
    pub fn infer_slots(
        base: &[(String, Literal)],
        variants: &[SlotVariantGroup],
        compound_variants: &[SlotCompoundVariant],
    ) -> Vec<String> {
        let mut seen: FxHashSet<String> = FxHashSet::default();
        let mut order: Vec<String> = Vec::new();

        let push = |name: &str, seen: &mut FxHashSet<String>, order: &mut Vec<String>| {
            if !seen.contains(name) {
                seen.insert(name.to_owned());
                order.push(name.to_owned());
            }
        };

        for (slot, _) in base {
            push(slot, &mut seen, &mut order);
        }

        for group in variants {
            for option in &group.options {
                for (slot, _) in &option.styles {
                    push(slot, &mut seen, &mut order);
                }
            }
        }

        for compound in compound_variants {
            for (slot, _) in &compound.css {
                push(slot, &mut seen, &mut order);
            }
        }

        order
    }

    /// `(slot_name, inner_iter)` per `self.slots`, each inner iterator in
    /// base → variants → compound order. Slots outside `self.slots` are dropped.
    // PERF(port): O(slots × styles) — rescans base/variants/compound per slot.
    // Deliberate: callers needing one slot pay only that cost. If multi-slot
    // consumers dominate, pre-bucketize into `FxHashMap<&str, Vec<&Literal>>`.
    pub fn atomic_styles_per_slot(
        &self,
    ) -> impl Iterator<Item = (&str, impl Iterator<Item = &Literal>)> + '_ {
        self.slots.iter().map(move |slot| {
            let slot = slot.as_str();
            let iter = self.styles_for_slot(slot);
            (slot, iter)
        })
    }

    fn styles_for_slot<'a>(&'a self, slot: &'a str) -> impl Iterator<Item = &'a Literal> + 'a {
        let from_base = self
            .base
            .iter()
            .filter_map(move |(s, lit)| (s == slot).then_some(lit));

        let from_variants = self.variants.iter().flat_map(move |g| {
            g.options.iter().flat_map(move |o| {
                o.styles
                    .iter()
                    .filter_map(move |(s, lit)| (s == slot).then_some(lit))
            })
        });

        let from_compounds = self.compound_variants.iter().flat_map(move |c| {
            c.css
                .iter()
                .filter_map(move |(s, lit)| (s == slot).then_some(lit))
        });

        from_base.chain(from_variants).chain(from_compounds)
    }
}

fn object_entries_owned(literal: Literal) -> Option<Vec<(String, Literal)>> {
    if let Literal::Object(entries) = literal {
        Some(entries)
    } else {
        None
    }
}

fn parse_variants_owned(literal: Literal) -> Vec<VariantGroup> {
    let Some(groups) = object_entries_owned(literal) else {
        return Vec::new();
    };

    let mut out: Vec<VariantGroup> = Vec::with_capacity(groups.len());
    for (name, options_lit) in groups {
        let mut options: Vec<VariantOption> = Vec::new();
        if let Some(option_entries) = object_entries_owned(options_lit) {
            options.reserve(option_entries.len());
            for (key, style) in option_entries {
                options.push(VariantOption { key, style });
            }
        }
        out.push(VariantGroup { name, options });
    }

    out
}

/// Parsed compound-variant entries, before `css` is projected into shape `C`.
struct CompoundVariantEntries<C> {
    conditions: Vec<(String, Vec<String>)>,
    css: Option<C>,
    class_name: Option<String>,
}

/// Splits a compound-variant entry list into conditions/css/className.
/// Conditions accept `"sm"` or `["sm", "md"]`. `parse_css` shapes the raw
/// `css` value: a [`Literal`] for [`Recipe`], a per-slot map for [`SlotRecipe`].
fn parse_compound_variant_entries<C>(
    entries: Vec<(String, Literal)>,
    parse_css: impl Fn(Literal) -> C,
) -> CompoundVariantEntries<C> {
    let mut conditions: Vec<(String, Vec<String>)> = Vec::new();
    let mut css: Option<C> = None;
    let mut class_name: Option<String> = None;

    for (key, value) in entries {
        if key == "css" {
            css = Some(parse_css(value));
        } else if key == "className" {
            if let Literal::String(name) = value {
                class_name = Some(name);
            }
        } else if let Some(value) = variant_condition_values(&value) {
            conditions.push((key, value));
        }
    }

    CompoundVariantEntries {
        conditions,
        css,
        class_name,
    }
}

/// Entries missing `css` drop.
fn parse_compound_variants_owned(literal: Literal) -> Vec<CompoundVariant> {
    let Literal::Array(items) = literal else {
        return Vec::new();
    };
    items
        .into_iter()
        .filter_map(|item| {
            let entries = object_entries_owned(item)?;
            let parsed = parse_compound_variant_entries(entries, std::convert::identity);
            Some(CompoundVariant {
                conditions: parsed.conditions,
                css: parsed.css?,
                class_name: parsed.class_name,
            })
        })
        .collect()
}

fn parse_string_map_owned(literal: Literal) -> Vec<(String, String)> {
    let Some(entries) = object_entries_owned(literal) else {
        return Vec::new();
    };
    entries
        .into_iter()
        .filter_map(|(k, v)| match v {
            Literal::String(s) => Some((k, s)),
            _ => None,
        })
        .collect()
}

fn parse_string_array_owned(literal: Literal) -> Vec<String> {
    let Literal::Array(items) = literal else {
        return Vec::new();
    };
    items
        .into_iter()
        .filter_map(|v| match v {
            Literal::String(s) => Some(s),
            _ => None,
        })
        .collect()
}

fn parse_slot_styles_owned(literal: Literal) -> Vec<(String, Literal)> {
    object_entries_owned(literal).unwrap_or_default()
}

fn parse_slot_variants_owned(literal: Literal) -> Vec<SlotVariantGroup> {
    let Some(groups) = object_entries_owned(literal) else {
        return Vec::new();
    };

    let mut out: Vec<SlotVariantGroup> = Vec::with_capacity(groups.len());
    for (name, options_lit) in groups {
        let mut options: Vec<SlotVariantOption> = Vec::new();
        if let Some(option_entries) = object_entries_owned(options_lit) {
            options.reserve(option_entries.len());
            for (key, slot_styles) in option_entries {
                let styles = parse_slot_styles_owned(slot_styles);
                options.push(SlotVariantOption { key, styles });
            }
        }
        out.push(SlotVariantGroup { name, options });
    }

    out
}

fn parse_slot_compound_variants_owned(literal: Literal) -> Vec<SlotCompoundVariant> {
    let Literal::Array(items) = literal else {
        return Vec::new();
    };
    items
        .into_iter()
        .filter_map(|item| {
            let entries = object_entries_owned(item)?;
            let parsed = parse_compound_variant_entries(entries, parse_slot_styles_owned);
            let css = parsed.css.unwrap_or_default();
            if css.is_empty() {
                None
            } else {
                Some(SlotCompoundVariant {
                    conditions: parsed.conditions,
                    css,
                    class_name: parsed.class_name,
                })
            }
        })
        .collect()
}

fn variant_condition_values(value: &Literal) -> Option<Vec<String>> {
    match value {
        Literal::Array(values) => {
            let values = values
                .iter()
                .map(variant_condition_value)
                .collect::<Option<Vec<_>>>()?;
            (!values.is_empty()).then_some(values)
        }
        value => variant_condition_value(value).map(|value| vec![value]),
    }
}

fn variant_condition_value(value: &Literal) -> Option<String> {
    match value {
        Literal::String(value) | Literal::Token { value, .. } => Some(value.clone()),
        Literal::Number(value) => Some(number_to_js_string(*value)),
        Literal::Bool(true) => Some("true".to_owned()),
        Literal::Bool(false) => Some("false".to_owned()),
        Literal::Null | Literal::Object(_) | Literal::Array(_) | Literal::Conditional(_) => None,
    }
}
