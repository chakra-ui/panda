//! The `splitProps` runtime helper: partition a props object by key lists,
//! used by recipes/patterns to peel variant props off the rest.

use indoc::indoc;

use crate::{Block, ConstDecl, Expr, FunctionDecl, Item, ItemNode, Param, Stmt, TsType};

pub(super) fn split_props_key_map_cache() -> Item {
    Item::runtime(ItemNode::Const(ConstDecl {
        exported: false,
        declare: false,
        name: "splitPropsKeyMapCache".into(),
        type_annotation: Some(TsType::Raw(
            "WeakMap<readonly string[], Record<string, true>>".into(),
        )),
        init: Some(Expr::Raw("new WeakMap()".into())),
        js_doc: None,
    }))
}

pub(super) fn split_props_key_map() -> Item {
    Item::runtime(ItemNode::Function(FunctionDecl {
        exported: false,
        declare: false,
        name: "getSplitPropsKeyMap".into(),
        generic_params: Vec::new(),
        params: vec![Param::typed(
            "keys",
            TsType::Raw("readonly string[]".into()),
        )],
        return_type: Some(TsType::Raw("Record<string, true>".into())),
        body: Some(Block::new(vec![Stmt::Raw(
            indoc! {r"
                let keyMap = splitPropsKeyMapCache.get(keys)
                if (keyMap) return keyMap
                keyMap = Object.create(null)
                for (let i = 0; i < keys.length; i++) keyMap[keys[i]] = true
                splitPropsKeyMapCache.set(keys, keyMap)
                return keyMap
            "}
            .trim()
            .into(),
        )])),
        js_doc: None,
    }))
}

pub(super) fn copy_split_prop() -> Item {
    Item::runtime(ItemNode::Function(FunctionDecl {
        exported: false,
        declare: false,
        name: "copySplitProp".into(),
        generic_params: Vec::new(),
        params: vec![
            Param::typed("source", TsType::Raw("Record<string, any>".into())),
            Param::typed("target", TsType::Raw("Record<string, any>".into())),
            Param::typed("key", TsType::Ref("string".into())),
        ],
        return_type: None,
        body: Some(Block::new(vec![Stmt::Raw(
            indoc! {r"
                const desc = Object.getOwnPropertyDescriptor(source, key)
                if (desc?.get || desc?.set) {
                  Object.defineProperty(target, key, desc)
                  return
                }
                target[key] = source[key]
            "}
            .trim()
            .into(),
        )])),
        js_doc: None,
    }))
}

pub(super) fn split_props() -> Item {
    helper_function(
        "splitProps",
        vec![
            Param::typed("props", TsType::Raw("T".into())),
            Param::typed(
                "...keys",
                TsType::Raw("Array<Array<keyof T> | ((key: keyof T) => boolean)>".into()),
            ),
        ],
        TsType::Raw("any[]".into()),
        indoc! {r#"
            const propKeys = Object.keys(props)
            const keyCount = keys.length

            if (keyCount === 1) {
              const matcher = keys[0]
              const picked: Record<string, any> = Object.create(null)
              const rest: Record<string, any> = Object.create(null)

              if (Array.isArray(matcher)) {
                const keyMap = getSplitPropsKeyMap(matcher as string[])
                for (let i = 0; i < propKeys.length; i++) {
                  const key = propKeys[i]
                  if (keyMap[key] === true) {
                    copySplitProp(props, picked, key)
                  } else {
                    copySplitProp(props, rest, key)
                  }
                }
                return [picked, rest]
              }

              for (let i = 0; i < propKeys.length; i++) {
                const key = propKeys[i]
                if (matcher(key)) {
                  copySplitProp(props, picked, key)
                } else {
                  copySplitProp(props, rest, key)
                }
              }
              return [picked, rest]
            }

            const matchers: Array<Record<string, true> | ((key: keyof T) => boolean)> = new Array(keyCount)
            for (let i = 0; i < keyCount; i++) {
              const matcher = keys[i]
              matchers[i] = Array.isArray(matcher) ? getSplitPropsKeyMap(matcher as string[]) : matcher
            }

            const out: any[] = new Array(keyCount + 1)
            for (let i = 0; i <= keyCount; i++) out[i] = Object.create(null)
            const rest = out[keyCount]

            for (let i = 0; i < propKeys.length; i++) {
              const key = propKeys[i]
              let matched = false
              for (let j = 0; j < keyCount; j++) {
                const matcher = matchers[j]
                if (typeof matcher === "function" ? matcher(key) : matcher[key] === true) {
                  copySplitProp(props, out[j], key)
                  matched = true
                  break
                }
              }
              if (!matched) copySplitProp(props, rest, key)
            }

            return out
        "#}
        .trim(),
        ["T extends Record<string, any>"],
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
