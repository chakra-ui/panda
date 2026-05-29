use indoc::indoc;

use crate::{Item, Param, TsType};

use super::shared::helper_function;

pub(super) fn get_slot_recipes() -> Item {
    helper_function(
        "getSlotRecipes",
        vec![Param::optional(
            "recipe",
            TsType::Raw("Record<string, any>".into()),
        )],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r#"
            recipe ||= {}
            const out = Object.create(null)
            const slots = recipe.slots ?? []
            for (let i = 0; i < slots.length; i++) {
              const slot = slots[i]
              out[slot] = {
                className: recipe.className ? recipe.className + "__" + slot : slot,
                base: recipe.base?.[slot] ?? {},
                variants: {},
                defaultVariants: recipe.defaultVariants ?? {},
                compoundVariants: recipe.compoundVariants ? getSlotCompoundVariant(recipe.compoundVariants, slot) : []
              }
            }
            for (const variantsKey in recipe.variants ?? {}) {
              const variants = recipe.variants[variantsKey]
              for (const variantKey in variants) {
                for (let i = 0; i < slots.length; i++) {
                  const slot = slots[i]
                  out[slot].variants[variantsKey] ??= {}
                  out[slot].variants[variantsKey][variantKey] = variants[variantKey][slot] ?? {}
                }
              }
            }
            return out
        "#}
        .trim(),
        [],
    )
}

pub(super) fn get_slot_compound_variant() -> Item {
    helper_function(
        "getSlotCompoundVariant",
        vec![
            Param::typed(
                "compoundVariants",
                TsType::Raw("Array<Record<string, any>>".into()),
            ),
            Param::typed("slot", TsType::Ref("string".into())),
        ],
        TsType::Raw("Array<Record<string, any>>".into()),
        indoc! {r"
            const out: Array<Record<string, any>> = []
            if (!compoundVariants) return out
            for (let i = 0; i < compoundVariants.length; i++) {
              const cv = compoundVariants[i]
              if (cv.css?.[slot]) out.push({ ...cv, css: cv.css[slot] })
            }
            return out
        "}
        .trim(),
        [],
    )
}
