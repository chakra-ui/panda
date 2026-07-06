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

/// Cheap cache-key hash for `memo`'s common case (flat args of primitives);
/// returns `null` on anything nested so `memo` can fall back to `JSON.stringify`.
pub(super) fn flat_hash_or_null() -> Item {
    Item::runtime(ItemNode::Function(FunctionDecl {
        exported: false,
        declare: false,
        name: "flatHashOrNull".into(),
        generic_params: Vec::new(),
        params: vec![Param::typed("args", TsType::Raw("readonly any[]".into()))],
        return_type: Some(TsType::Raw("number | null".into())),
        body: Some(Block::new(vec![Stmt::Raw(
            indoc! {r#"
                let h = 5381
                for (let a = 0; a < args.length; a++) {
                  const obj = args[a]
                  if (obj === null || typeof obj !== "object") { h = (h * 33) ^ 1; continue }
                  for (const k in obj) {
                    const v = obj[k]
                    const tv = typeof v
                    if (v !== null && tv === "object") return null
                    for (let i = 0; i < k.length; i++) h = (h * 33) ^ k.charCodeAt(i)
                    if (tv === "string") { for (let i = 0; i < v.length; i++) h = (h * 33) ^ v.charCodeAt(i) }
                    else if (tv === "number") h = (h * 33) ^ (v | 0)
                    else if (tv === "boolean") h = (h * 33) ^ (v ? 991 : 997)
                    else h = (h * 33) ^ 2
                  }
                }
                return h >>> 0
            "#}
            .trim()
            .into(),
        )])),
        js_doc: None,
    }))
}

/// Exact-match check to resolve `flatHashOrNull` collisions before trusting a cache hit.
pub(super) fn flat_args_equal() -> Item {
    Item::runtime(ItemNode::Function(FunctionDecl {
        exported: false,
        declare: false,
        name: "flatArgsEqual".into(),
        generic_params: Vec::new(),
        params: vec![
            Param::typed("a", TsType::Raw("readonly any[]".into())),
            Param::typed("b", TsType::Raw("readonly any[]".into())),
        ],
        return_type: Some(TsType::Bool),
        body: Some(Block::new(vec![Stmt::Raw(
            indoc! {r#"
                if (a.length !== b.length) return false
                for (let i = 0; i < a.length; i++) {
                  const oa = a[i]
                  const ob = b[i]
                  if (oa === ob) continue
                  if (oa === null || ob === null || typeof oa !== "object" || typeof ob !== "object") return false
                  let n = 0
                  for (const k in oa) {
                    if (oa[k] !== ob[k]) return false
                    n++
                  }
                  if (n !== Object.keys(ob).length) return false
                }
                return true
            "#}
            .trim()
            .into(),
        )])),
        js_doc: None,
    }))
}

pub(super) fn memo() -> Item {
    helper_function(
        "memo",
        vec![Param::typed("fn", TsType::Raw("T".into()))],
        TsType::Raw("T".into()),
        indoc! {r"
            const cache = new Map<number, Array<{ args: Parameters<T>; out: ReturnType<T> }>>()
            const stringCache = new Map<string, ReturnType<T>>()
            let lastHash: number | undefined
            let lastIsFlat = false
            let lastKey: Parameters<T> | string | undefined
            let lastValue: ReturnType<T>
            let hasLast = false
            return ((...args: Parameters<T>) => {
              const hash = flatHashOrNull(args)
              if (hash !== null) {
                if (hasLast && lastIsFlat && hash === lastHash && flatArgsEqual(args, lastKey as Parameters<T>)) return lastValue
                let bucket = cache.get(hash)
                if (bucket) {
                  for (let i = 0; i < bucket.length; i++) {
                    if (flatArgsEqual(args, bucket[i].args)) {
                      lastHash = hash
                      lastIsFlat = true
                      lastKey = args
                      lastValue = bucket[i].out
                      hasLast = true
                      return bucket[i].out
                    }
                  }
                }
                const out = fn(...args)
                if (!bucket) {
                  bucket = []
                  cache.set(hash, bucket)
                }
                bucket.push({ args, out })
                if (bucket.length > 8) bucket.shift()
                if (cache.size > 500) cache.delete(cache.keys().next().value as number)
                lastHash = hash
                lastIsFlat = true
                lastKey = args
                lastValue = out
                hasLast = true
                return out
              }
              const key = JSON.stringify(args)
              if (hasLast && !lastIsFlat && key === lastKey) return lastValue
              if (stringCache.has(key)) {
                const out = stringCache.get(key) as ReturnType<T>
                lastIsFlat = false
                lastKey = key
                lastValue = out
                hasLast = true
                return out
              }
              const out = fn(...args)
              stringCache.set(key, out)
              if (stringCache.size > 500) stringCache.delete(stringCache.keys().next().value as string)
              lastIsFlat = false
              lastKey = key
              lastValue = out
              hasLast = true
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

pub(super) fn is_important() -> Item {
    helper_function(
        "isImportant",
        vec![Param::typed("value", TsType::Ref("unknown".into()))],
        TsType::Bool,
        r#"return typeof value === "string" ? /\s*!(important)?/i.test(value) : false"#,
        [],
    )
}

pub(super) fn without_important() -> Item {
    helper_function(
        "withoutImportant",
        vec![Param::typed("value", TsType::Ref("T".into()))],
        TsType::Ref("T".into()),
        indoc! {r#"
            return (typeof value === "string" ? value.replace(/\s*!(important)?/i, "").trim() : value) as T
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
