//! Typed recipe / slot-recipe model and atomic decomposition.
//!
//! Mirrors the cva / sva pipeline from `packages/parser` +
//! `packages/core` — the extractor produces a raw [`Literal::Object`]
//! for each `cva(...)` / `sva(...)` call, this crate turns that into a
//! typed [`Recipe`] / [`SlotRecipe`], and the future Rust encoder
//! consumes the typed shape to emit atomic CSS rules.
//!
//! ## Data model
//!
//! - [`Recipe`] — `cva({ base, variants, compoundVariants, defaultVariants })`.
//!   Variants are stored in *source order* so downstream emit is
//!   deterministic.
//! - [`SlotRecipe`] — `sva({ slots, base, variants, compoundVariants })`.
//!   `slots` is auto-inferred from `base` + variant keys when the
//!   user-supplied list is empty / missing, matching `Recipes.inferSlots`
//!   in the JS reference.
//! - [`VariantGroup`] / [`CompoundVariant`] — building blocks shared by
//!   both recipe shapes.
//!
//! ## Parsing
//!
//! [`Recipe::from_literal`] / [`SlotRecipe::from_literal`] accept the
//! single `Literal::Object` extracted from the call's first argument.
//! Unknown keys are ignored (forward-compat); malformed shapes return
//! `None` (atomic CSS emit can decide whether to surface a diagnostic
//! or fall back).
//!
//! ## Atomic decomposition
//!
//! [`Recipe::atomic_styles`] returns every style object the encoder
//! needs to hash: `base`, each `variant.option.style`, and each
//! `compoundVariant.css`. [`SlotRecipe::atomic_styles_per_slot`] does
//! the same keyed by slot. The encoder hashes each into an atomic
//! ruleset.

use rustc_hash::FxHashSet;
use serde::Serialize;

pub use extractor::Literal;

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
    /// Source-order list of `(variant_name, chosen_key)` pairs.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub default_variants: Vec<(String, String)>,
}

/// One named variant axis (`size`, `intent`, …) with its options.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct VariantGroup {
    pub name: String,
    pub options: Vec<VariantOption>,
}

/// One named choice within a variant axis (`size: 'sm'`).
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct VariantOption {
    pub key: String,
    pub style: Literal,
}

/// `{ size: 'sm', intent: 'danger', css: { … } }` — all `conditions`
/// must match for `css` to apply on top of the base + per-variant
/// styles.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CompoundVariant {
    pub conditions: Vec<(String, String)>,
    pub css: Literal,
}

/// `sva({ slots, base, variants, compoundVariants })`.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SlotRecipe {
    /// Final list of slot names. When the user omits `slots`, we
    /// infer from `base` keys + variant option styles' keys.
    pub slots: Vec<String>,
    /// `slot → style` for the unconditional base.
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
    /// `slot → style` for this variant option.
    pub styles: Vec<(String, Literal)>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SlotCompoundVariant {
    pub conditions: Vec<(String, String)>,
    /// `slot → style` for this compound match.
    pub css: Vec<(String, Literal)>,
}

// --- Parsing ---

impl Recipe {
    /// Parse a `cva()` argument literal into a typed `Recipe`. Returns
    /// `None` only when the argument isn't an object at all; partial
    /// shapes (missing `base` or `variants`) parse with `None` /
    /// empty fields so downstream consumers can decide how strict to
    /// be.
    #[must_use]
    pub fn from_literal(literal: &Literal) -> Option<Self> {
        let entries = object_entries(literal)?;
        let mut recipe = Recipe::default();
        for (key, value) in entries {
            match key.as_str() {
                "base" => recipe.base = Some(value.clone()),
                "variants" => recipe.variants = parse_variants(value),
                "compoundVariants" => recipe.compound_variants = parse_compound_variants(value),
                "defaultVariants" => recipe.default_variants = parse_string_map(value),
                // Unknown keys (e.g. `className`, `description`) are
                // ignored so future config fields don't break parsing.
                _ => {}
            }
        }
        Some(recipe)
    }

    /// Every style object the encoder should hash into an atomic rule:
    /// `base`, every `variant.option.style`, and every
    /// `compoundVariant.css`. Lazy iterator — no intermediate `Vec`
    /// allocation; the encoder consumes lazily.
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
    /// Parse an `sva()` argument literal. Like [`Recipe::from_literal`],
    /// partial shapes are tolerated. When the user-supplied `slots`
    /// list is absent, slots are inferred from `base` + variant option
    /// styles via [`Self::infer_slots`].
    #[must_use]
    pub fn from_literal(literal: &Literal) -> Option<Self> {
        let entries = object_entries(literal)?;
        let mut slots: Vec<String> = Vec::new();
        let mut base: Vec<(String, Literal)> = Vec::new();
        let mut variants: Vec<SlotVariantGroup> = Vec::new();
        let mut compound_variants: Vec<SlotCompoundVariant> = Vec::new();
        let mut default_variants: Vec<(String, String)> = Vec::new();

        for (key, value) in entries {
            match key.as_str() {
                "slots" => slots = parse_string_array(value),
                "base" => base = parse_slot_styles(value),
                "variants" => variants = parse_slot_variants(value),
                "compoundVariants" => {
                    compound_variants = parse_slot_compound_variants(value);
                }
                "defaultVariants" => default_variants = parse_string_map(value),
                _ => {}
            }
        }

        if slots.is_empty() {
            slots = Self::infer_slots(&base, &variants);
        }

        Some(SlotRecipe {
            slots,
            base,
            variants,
            compound_variants,
            default_variants,
        })
    }

    /// Static slot inference: the JS-side `Recipes.inferSlots` reads
    /// every slot name that appears under `base.<slot>` or any
    /// variant option's per-slot map. Order: insertion of first
    /// appearance.
    #[must_use]
    pub fn infer_slots(base: &[(String, Literal)], variants: &[SlotVariantGroup]) -> Vec<String> {
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
        order
    }

    /// Atomic style objects grouped by slot. Each slot gets a lazy
    /// iterator over its base, variant-option, and compound-variant
    /// styles. Slots not in `self.slots` are silently dropped.
    ///
    /// The outer iterator yields `(slot_name, inner_iter)` in
    /// `self.slots` order; the inner iterator emits styles in
    /// base → variants → compound order. Zero intermediate Vec
    /// allocation either way.
    // PERF(port): the per-slot filter rescans base / variants /
    // compound for every slot, so total work is O(slots × styles).
    // The lazy iterator shape is deliberate — callers that only need
    // one slot pay only that slot's cost. If a future profile shows
    // multi-slot consumers dominating, pre-bucketize once into
    // `FxHashMap<&str, Vec<&Literal>>` during construction and let
    // this method hand out borrowed slices instead.
    pub fn atomic_styles_per_slot(
        &self,
    ) -> impl Iterator<Item = (&str, impl Iterator<Item = &Literal>)> + '_ {
        self.slots.iter().map(move |slot| {
            let slot = slot.as_str();
            let iter = self.styles_for_slot(slot);
            (slot, iter)
        })
    }

    /// Lazy iterator of every style object targeting a single slot.
    /// Visits base, every variant option's per-slot map, then every
    /// compound-variant css.
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

// --- helpers ---

fn object_entries(literal: &Literal) -> Option<&Vec<(String, Literal)>> {
    if let Literal::Object(entries) = literal {
        Some(entries)
    } else {
        None
    }
}

/// `variants: { size: { sm: {…}, lg: {…} } }` → ordered
/// `[VariantGroup{ "size", [option(sm), option(lg)] }]`.
fn parse_variants(literal: &Literal) -> Vec<VariantGroup> {
    let Some(groups) = object_entries(literal) else {
        return Vec::new();
    };
    let mut out: Vec<VariantGroup> = Vec::with_capacity(groups.len());
    for (name, options_lit) in groups {
        let mut options: Vec<VariantOption> = Vec::new();
        if let Some(option_entries) = object_entries(options_lit) {
            for (key, style) in option_entries {
                options.push(VariantOption {
                    key: key.clone(),
                    style: style.clone(),
                });
            }
        }
        out.push(VariantGroup {
            name: name.clone(),
            options,
        });
    }
    out
}

/// `compoundVariants: [{ size: 'sm', intent: 'danger', css: {…} }, …]`
/// → ordered list of `CompoundVariant`. Entries missing `css` drop;
/// non-string condition values drop.
fn parse_compound_variants(literal: &Literal) -> Vec<CompoundVariant> {
    let Literal::Array(items) = literal else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let entries = object_entries(item)?;
            let mut conditions: Vec<(String, String)> = Vec::new();
            let mut css: Option<Literal> = None;
            for (key, value) in entries {
                if key == "css" {
                    css = Some(value.clone());
                } else if let Literal::String(s) = value {
                    conditions.push((key.clone(), s.clone()));
                }
            }
            Some(CompoundVariant {
                conditions,
                css: css?,
            })
        })
        .collect()
}

/// `defaultVariants: { size: 'sm', intent: 'danger' }`.
fn parse_string_map(literal: &Literal) -> Vec<(String, String)> {
    let Some(entries) = object_entries(literal) else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|(k, v)| match v {
            Literal::String(s) => Some((k.clone(), s.clone())),
            _ => None,
        })
        .collect()
}

/// `slots: ['root', 'icon', 'label']`.
fn parse_string_array(literal: &Literal) -> Vec<String> {
    let Literal::Array(items) = literal else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|v| match v {
            Literal::String(s) => Some(s.clone()),
            _ => None,
        })
        .collect()
}

/// `base: { root: {...}, icon: {...} }` → ordered `(slot, style)` list.
fn parse_slot_styles(literal: &Literal) -> Vec<(String, Literal)> {
    let Some(entries) = object_entries(literal) else {
        return Vec::new();
    };
    entries
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect()
}

/// `variants: { size: { sm: { root: {...}, icon: {...} } } }` →
/// [`SlotVariantGroup`] structure.
fn parse_slot_variants(literal: &Literal) -> Vec<SlotVariantGroup> {
    let Some(groups) = object_entries(literal) else {
        return Vec::new();
    };
    let mut out: Vec<SlotVariantGroup> = Vec::with_capacity(groups.len());
    for (name, options_lit) in groups {
        let mut options: Vec<SlotVariantOption> = Vec::new();
        if let Some(option_entries) = object_entries(options_lit) {
            for (key, slot_styles) in option_entries {
                let styles = parse_slot_styles(slot_styles);
                options.push(SlotVariantOption {
                    key: key.clone(),
                    styles,
                });
            }
        }
        out.push(SlotVariantGroup {
            name: name.clone(),
            options,
        });
    }
    out
}

/// `compoundVariants: [{ size: 'sm', css: { root: {...} } }, …]`.
fn parse_slot_compound_variants(literal: &Literal) -> Vec<SlotCompoundVariant> {
    let Literal::Array(items) = literal else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let entries = object_entries(item)?;
            let mut conditions: Vec<(String, String)> = Vec::new();
            let mut css: Vec<(String, Literal)> = Vec::new();
            for (key, value) in entries {
                if key == "css" {
                    css = parse_slot_styles(value);
                } else if let Literal::String(s) = value {
                    conditions.push((key.clone(), s.clone()));
                }
            }
            if css.is_empty() {
                None
            } else {
                Some(SlotCompoundVariant { conditions, css })
            }
        })
        .collect()
}
