//! Object-shaped runtime helpers: `isObject`/`hasOwn`/`compact`, deep
//! walk/map, prop merging, and the variant/compound-variant resolution used by
//! the recipe factories.

use indoc::indoc;

use crate::{Block, FunctionDecl, Item, ItemNode, Param, Stmt, TsType};

pub(super) fn is_object() -> Item {
    helper_function(
        "isObject",
        vec![Param::typed("v", TsType::Unknown)],
        TsType::Raw("v is Record<string, unknown>".into()),
        indoc! {r#"
            return typeof v === "object" && v != null && !Array.isArray(v)
        "#}
        .trim(),
        [],
    )
}

pub(super) fn has_own() -> Item {
    Item::raw_stmt("const HAS_OWN = Object.prototype.hasOwnProperty")
}

pub(super) fn compact() -> Item {
    helper_function(
        "compact",
        vec![Param::typed("v", TsType::Raw("T".into()))],
        TsType::Raw("Partial<T>".into()),
        indoc! {r"
            const out = Object.create(null)
            if (!v) return out
            for (const k in v) {
              if (v[k] !== void 0) out[k] = v[k]
            }
            return out
        "}
        .trim(),
        ["T extends Record<string, unknown>"],
    )
}

pub(super) fn with_defaults() -> Item {
    helper_function(
        "withDefaults",
        vec![
            Param::typed("defaults", TsType::Raw("Record<string, any>".into())),
            Param::typed("props", TsType::Raw("Record<string, any>".into())),
        ],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r"
            const result = compact(props)
            for (const key in defaults) if (result[key] === void 0) result[key] = defaults[key]
            return result
        "}
        .trim(),
        [],
    )
}

pub(super) fn to_variant_map() -> Item {
    helper_function(
        "toVariantMap",
        vec![Param::typed(
            "variants",
            TsType::Raw("Record<string, any>".into()),
        )],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r"
            const map: Record<string, any> = {}
            for (const key in variants) map[key] = Object.keys(variants[key])
            return map
        "}
        .trim(),
        [],
    )
}

pub(super) fn get_compound_variant_class_names() -> Item {
    helper_function(
        "getCompoundVariantClassNames",
        vec![
            Param::typed(
                "compoundVariants",
                TsType::Raw("Array<Record<string, any>>".into()),
            ),
            Param::typed("variants", TsType::Raw("Record<string, any>".into())),
            Param::optional(
                "formatClassName",
                TsType::Raw("(className: string) => string".into()),
            ),
        ],
        TsType::Ref("string".into()),
        indoc! {r#"
            const classes: string[] = []
            outer: for (const compound of compoundVariants) {
              for (const key in compound) {
                if (key === "css" || key === "className" || key === "classNames") continue
                const expected = compound[key]
                const actual = variants[key]
                if (Array.isArray(expected)) {
                  if (!expected.includes(actual)) continue outer
                } else if (actual !== expected) {
                  continue outer
                }
              }
              if (compound.className) classes.push(formatClassName ? formatClassName(compound.className) : compound.className)
            }
            return classes.join(" ")
        "#}
        .trim(),
        [],
    )
}

pub(super) fn get_compound_variant_css() -> Item {
    helper_function(
        "getCompoundVariantCss",
        vec![
            Param::typed(
                "compoundVariants",
                TsType::Raw("Array<Record<string, any>>".into()),
            ),
            Param::typed("variants", TsType::Raw("Record<string, any>".into())),
        ],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r#"
            let result = {}
            outer: for (const variant of compoundVariants) {
              for (const key in variant) {
                if (key === "css" || key === "className" || key === "classNames") continue
                const expected = variant[key]
                const actual = variants[key]
                if (Array.isArray(expected)) {
                  if (!expected.includes(actual)) continue outer
                } else if (actual !== expected) {
                  continue outer
                }
              }
              result = mergeProps(result, variant.css)
            }
            return result
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
        indoc! {r#"
            const result = []
            for (const variant of compoundVariants) {
              const css = variant.css?.[slot]
              const className = variant.classNames?.[slot] ?? variant.className
              if (!css && !className) continue
              const next: Record<string, any> = css ? { css } : {}
              for (const key in variant) {
                if (key === "css" || key === "className" || key === "classNames") continue
                next[key] = variant[key]
              }
              if (className) next.className = className
              result.push(next)
            }
            return result
        "#}
        .trim(),
        [],
    )
}

pub(super) fn get_slot_recipes() -> Item {
    helper_function(
        "getSlotRecipes",
        vec![Param::typed(
            "recipe",
            TsType::Raw("Record<string, any>".into()),
        )],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r#"
            const result: Record<string, any> = {}
            const slots = recipe.slots ?? []
            for (const slot of slots) {
              result[slot] = {
                className: recipe.className ? recipe.className + "__" + slot : slot,
                base: recipe.base?.[slot] ?? {},
                variants: {},
                defaultVariants: recipe.defaultVariants ?? {},
                compoundVariants: getSlotCompoundVariant(recipe.compoundVariants ?? [], slot),
              }
            }
            const variants = recipe.variants ?? {}
            for (const variantsKey in variants) {
              const variantGroup = variants[variantsKey]
              for (const slot of slots) {
                const group: Record<string, any> = result[slot].variants[variantsKey] = {}
                for (const variantKey in variantGroup) {
                  group[variantKey] = variantGroup[variantKey][slot] ?? {}
                }
              }
            }
            return result
        "#}
        .trim(),
        [],
    )
}

pub(super) fn walk_object() -> Item {
    helper_function(
        "walkObject",
        vec![
            Param::typed("target", TsType::Unknown),
            Param::typed(
                "fn",
                TsType::Raw("(value: any, path: string[]) => any".into()),
            ),
            Param::optional("options", TsType::Raw("Record<string, any>".into())),
        ],
        TsType::Raw("any".into()),
        indoc! {r#"
            options ||= {}
            const { stop, getKey } = options
            const inner = (value: any, path: string[] = []) => {
              if (!value || typeof value !== "object") return fn(value, path)
              if (stop?.(value, path)) return fn(value, path)
              const out: any = Array.isArray(value) ? [] : Object.create(null)
              for (const prop in value) {
                if (!HAS_OWN.call(value, prop)) continue
                const key = getKey?.(prop, value[prop]) ?? prop
                path.push(key)
                const next = inner(value[prop], path)
                path.pop()
                if (next != null) out[key] = next
              }
              return out
            }
            return inner(target)
        "#}
        .trim(),
        [],
    )
}

pub(super) fn map_object() -> Item {
    helper_function(
        "mapObject",
        vec![
            Param::typed("obj", TsType::Unknown),
            Param::typed("fn", TsType::Raw("(value: any) => any".into())),
        ],
        TsType::Raw("any".into()),
        r"return Array.isArray(obj) ? obj.map(fn) : isObject(obj) ? walkObject(obj, fn) : fn(obj)",
        [],
    )
}

pub(super) fn merge_props() -> Item {
    helper_function(
        "mergeProps",
        vec![Param::typed(
            "...src",
            TsType::Raw("Array<Record<string, any> | undefined>".into()),
        )],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r#"
            const out = Object.create(null)
            for (const obj of src) {
              if (!obj) continue
              for (const k in obj) {
                if (!HAS_OWN.call(obj, k) || k === "__proto__" || k === "constructor" || k === "prototype") continue
                const prev = out[k]
                const next = obj[k]
                out[k] = isObject(prev) && isObject(next) ? mergeProps(prev, next) : next
              }
            }
            return out
        "#}
        .trim(),
        [],
    )
}

fn helper_function<const N: usize>(
    name: &str,
    params: Vec<Param>,
    return_type: TsType,
    body: &str,
    generic_params: [&str; N],
) -> Item {
    Item::both(ItemNode::Function(FunctionDecl {
        exported: true,
        declare: false,
        name: name.into(),
        generic_params: generic_params
            .into_iter()
            .map(std::convert::Into::into)
            .collect(),
        params,
        return_type: Some(return_type),
        body: Some(Block::new(vec![Stmt::Raw(body.into())])),
        js_doc: None,
    }))
}
