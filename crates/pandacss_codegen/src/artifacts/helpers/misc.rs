//! Miscellaneous runtime helpers: `memo`, `weakMemo`, `uniq`, `withoutSpace`, the JS
//! `toHash`, and base-condition filtering.

use indoc::indoc;

use crate::{Block, FunctionDecl, Item, ItemNode, Param, Stmt, TsType};

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
              if (cache.has(key)) {
                const out = cache.get(key) as ReturnType<T>
                cache.delete(key)
                cache.set(key, out)
                return out
              }
              const out = fn(...args)
              cache.set(key, out)
              if (cache.size > 500) cache.delete(cache.keys().next().value as string)
              return out
            }) as T
        "}
        .trim(),
        ["T extends (...args: any[]) => any"],
    )
}

pub(super) fn weak_memo() -> Item {
    helper_function(
        "weakMemo",
        vec![Param::typed("fn", TsType::Raw("T".into()))],
        TsType::Raw("T".into()),
        indoc! {r#"
            const cache: WeakMap<object, ReturnType<T>> = new WeakMap()
            return ((arg: Parameters<T>[0]) => {
              if (!arg || typeof arg !== "object") return fn(arg)
              if (cache.has(arg)) return cache.get(arg) as ReturnType<T>
              const out = fn(arg)
              cache.set(arg, out)
              return out
            }) as T
        "#}
        .trim(),
        ["T extends (arg: any) => any"],
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

pub(super) fn normalize_html_props() -> Item {
    Item::runtime(ItemNode::RawStmt(
        indoc! {r"
            const htmlProps = ['htmlSize', 'htmlTranslate', 'htmlWidth', 'htmlHeight']

            function convertHTMLProp(key: string) {
              return htmlProps.includes(key) ? key.replace('html', '').toLowerCase() : key
            }

            export function normalizeHTMLProps(props: Record<string, any>) {
              return Object.fromEntries(Object.entries(props).map(([key, value]) => [convertHTMLProp(key), value]))
            }

            normalizeHTMLProps.keys = htmlProps
        "}
        .trim()
        .into(),
    ))
}

pub(super) fn normalize_html_props_types() -> Item {
    Item::ty(ItemNode::RawStmt(
        indoc! {r"
            export declare function normalizeHTMLProps(props: Record<string, any>): Record<string, any>
            export declare namespace normalizeHTMLProps {
              export const keys: string[]
            }
        "}
        .trim()
        .into(),
    ))
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
