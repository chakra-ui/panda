use indoc::indoc;

use crate::{Item, Param, TsType};

use super::shared::helper_function;

pub(super) fn is_base_condition() -> Item {
    helper_function(
        "isBaseCondition",
        vec![Param::typed("v", TsType::Ref("string".into()))],
        TsType::Bool,
        r#"return v === "base""#,
        [],
    )
}

pub(super) fn filter_base_conditions() -> Item {
    helper_function(
        "filterBaseConditions",
        vec![Param::typed("c", TsType::Raw("string[]".into()))],
        TsType::Raw("string[]".into()),
        indoc! {r"
            const out = []
            for (let i = 0; i < c.length; i++) {
              if (!isBaseCondition(c[i])) out.push(c[i])
            }
            return out
        "}
        .trim(),
        [],
    )
}

pub(super) fn to_hash() -> Item {
    helper_function(
        "toHash",
        vec![Param::typed("v", TsType::Ref("string".into()))],
        TsType::Ref("string".into()),
        indoc! {r"
            let h = 5381
            for (let i = v.length; i; ) h = (h * 33) ^ v.charCodeAt(--i)
            let x = h >>> 0, out = ''
            for (; x > 52; x = (x / 52) | 0) {
              const c = x % 52
              out = String.fromCharCode(c + (c > 25 ? 39 : 97)) + out
            }
            const c = x % 52
            return String.fromCharCode(c + (c > 25 ? 39 : 97)) + out
        "}
        .trim(),
        [],
    )
}

pub(super) fn memo() -> Item {
    helper_function(
        "memo",
        vec![Param::typed("fn", TsType::Raw("T".into()))],
        TsType::Raw("T".into()),
        indoc! {r"
            const cache = new Map<string, ReturnType<T>>()
            return ((...args: Parameters<T>) => {
              const key = JSON.stringify(args)
              if (cache.has(key)) return cache.get(key)
              const out = fn(...args)
              cache.set(key, out)
              return out
            }) as T
        "}
        .trim(),
        ["T extends (...args: any[]) => any"],
    )
}

pub(super) fn uniq() -> Item {
    helper_function(
        "uniq",
        vec![Param::typed(
            "...items",
            TsType::Raw("Array<T[] | undefined>".into()),
        )],
        TsType::Raw("T[]".into()),
        indoc! {r"
            const set = new Set<T>()
            for (const values of items) {
              if (!values) continue
              for (let i = 0; i < values.length; i++) set.add(values[i])
            }
            return Array.from(set)
        "}
        .trim(),
        ["T"],
    )
}

pub(super) fn without_space() -> Item {
    helper_function(
        "withoutSpace",
        vec![Param::typed("str", TsType::Ref("T".into()))],
        TsType::Ref("T".into()),
        indoc! {r#"
            return (typeof str === "string" && str.indexOf(" ") >= 0 ? str.replaceAll(" ", "_") : str) as T
        "#}
        .trim(),
        ["T extends string | number | boolean"],
    )
}
