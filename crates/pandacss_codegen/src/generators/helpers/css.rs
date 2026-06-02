//! CSS-related runtime helpers: style-object normalize/merge, responsive-array
//! expansion, property hyphenation, and the `css`/`mergeCss` factories.

use indoc::indoc;

use crate::{Item, Param, TsType};

use super::shared::helper_function;

pub(super) fn to_responsive_object() -> Item {
    helper_function(
        "toResponsiveObject",
        vec![
            Param::typed("values", TsType::Raw("any[]".into())),
            Param::typed("breakpoints", TsType::Raw("string[]".into())),
        ],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r"
            const out = Object.create(null)
            for (let i = 0; i < values.length; i++) {
              if (values[i] != null) out[breakpoints[i]] = values[i]
            }
            return out
        "}
        .trim(),
        [],
    )
}

pub(super) fn normalize_style_object() -> Item {
    helper_function(
        "normalizeStyleObject",
        vec![
            Param::typed("styles", TsType::Raw("Record<string, any>".into())),
            Param::typed("context", TsType::Raw("Record<string, any>".into())),
            Param::optional("shorthand", TsType::Bool),
        ],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r"
            const { utility, conditions } = context
            const { hasShorthand, resolveShorthand } = utility
            shorthand = shorthand !== false
            return walkObject(styles, (value: any) => {
              if (Array.isArray(value)) return toResponsiveObject(value, conditions.breakpoints.keys)
              return value
            }, {
              stop: Array.isArray,
              getKey: shorthand ? (prop: string) => hasShorthand ? resolveShorthand(prop) : prop : void 0
            })
        "}
        .trim(),
        [],
    )
}

pub(super) fn create_css() -> Item {
    helper_function(
        "createCss",
        vec![Param::typed("context", TsType::Raw("Record<string, any>".into()))],
        TsType::Raw("(...styles: any[]) => string".into()),
        indoc! {r#"
            const { utility: u, hash, conditions: c = { shift: (v: any) => v, finalize: (v: any[]) => v, breakpoints: { keys: [] } } } = context
            const fmt = (s: string) => u.prefix ? u.prefix + "-" + s : s
            const toClass = (paths: string[], name: string) => {
              const parts = c.finalize(paths)
              parts.push(hash ? name : fmt(name))
              return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
            }
            return memo(({ base, ...styles }: Record<string, any> = {}) => {
              const obj = mapObject(base ? Object.assign(styles, base) : styles, (v: any) => Array.isArray(v) ? toResponsiveObject(v, c.breakpoints.keys) : v)
              const set = new Set<string>()
              walkObject(obj, (value: any, paths: string[]) => {
                if (value == null) return
                const [prop, ...all] = c.shift(paths)
                const cond = filterBaseConditions(all)
                const res = u.transform(prop, withoutSpace(value))
                set.add(toClass(cond, res.className))
              })
              let out = ""
              for (const name of set) out += out ? " " + name : name
              return out
            })
        "#}
        .trim(),
        [],
    )
}

pub(super) fn create_merge_css() -> Item {
    helper_function(
        "createMergeCss",
        vec![Param::typed(
            "context",
            TsType::Raw("Record<string, any>".into()),
        )],
        TsType::Raw(
            "{ mergeCss: (...styles: any[]) => any; assignCss: (...styles: any[]) => any }".into(),
        ),
        indoc! {r"
            const resolve = (styles: Array<any> | IArguments) => {
              const out: any[] = []
              const visit = (items: Array<any> | IArguments) => {
                for (let i = 0; i < items.length; i++) {
                  const style = items[i]
                  if (Array.isArray(style)) {
                    visit(style)
                    continue
                  }
                  if (!isObject(style)) continue
                  for (const key in style) {
                    if (style[key] !== void 0) {
                      out.push(style)
                      break
                    }
                  }
                }
              }
              visit(styles)
              if (out.length < 2) return out
              for (let i = 0; i < out.length; i++) out[i] = normalizeStyleObject(out[i], context)
              return out
            }
            const mergeCss: (...styles: any[]) => any = function() {
              return mergeProps(...resolve(arguments))
            }
            const assignCss: (...styles: any[]) => any = function() {
              const out: Record<string, any> = {}
              const resolved = resolve(arguments)
              for (let i = 0; i < resolved.length; i++) Object.assign(out, resolved[i])
              return out
            }
            return { mergeCss: memo(mergeCss), assignCss }
        "}
        .trim(),
        [],
    )
}

pub(super) fn hypenate_property() -> Item {
    helper_function(
        "hypenateProperty",
        vec![Param::typed("property", TsType::Ref("string".into()))],
        TsType::Ref("string".into()),
        r#"return property.startsWith("--") ? property : property.replace(/[A-Z]/g, "-$&").replace(/^ms-/, "-ms-").toLowerCase()"#,
        [],
    )
}
