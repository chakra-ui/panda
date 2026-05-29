use indoc::indoc;

use crate::{Item, Param, TsType};

use super::shared::helper_function;

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
