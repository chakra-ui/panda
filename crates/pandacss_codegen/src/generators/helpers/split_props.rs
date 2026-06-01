//! The `splitProps` runtime helper: partition a props object by key lists,
//! used by recipes/patterns to peel variant props off the rest.

use indoc::indoc;

use crate::{Item, Param, TsType};

use super::shared::helper_function;

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
        indoc! {r"
            const desc = Object.getOwnPropertyDescriptors(props)
            const all = Object.keys(desc)
            const split = (ks: string[]) => {
              const out: Record<string, any> = Object.create(null)
              for (let i = 0; i < ks.length; i++) {
                const k = ks[i]
                if (desc[k]) {
                  Object.defineProperty(out, k, desc[k])
                  delete desc[k]
                }
              }
              return out
            }
            const out: any[] = []
            for (const key of keys) {
              if (Array.isArray(key)) {
                out.push(split(key as string[]))
                continue
              }
              const picked: string[] = []
              for (let i = 0; i < all.length; i++) {
                if (key(all[i])) picked.push(all[i])
              }
              out.push(split(picked))
            }
            out.push(split(all))
            return out
        "}
        .trim(),
        ["T extends Record<string, any>"],
    )
}
