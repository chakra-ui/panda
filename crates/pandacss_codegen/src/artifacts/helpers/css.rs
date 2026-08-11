//! CSS-related runtime helpers: style-object normalize/merge, responsive-array
//! expansion, property hyphenation, and the `css` runtime factory.

use indoc::indoc;

use crate::{Block, FunctionDecl, Item, ItemNode, Param, Stmt, TsType};

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

pub(super) fn sanitize_style_value() -> Item {
    Item::runtime(ItemNode::RawStmt(
        indoc! {r#"
            const WHITESPACE_REGEX = /[\n\s]+/g
            const sanitizeStyleValue = (value: any) => typeof value === "string" ? value.replace(WHITESPACE_REGEX, " ") : value
        "#}
        .trim()
        .into(),
    ))
}

// Four separate factories rather than one that returns all of them: each call
// site binds a plain `const`, so a bundle that only uses `mergeCss` (recipes,
// pattern JSX) drops the serializer, and `assignCss` drops wherever it is dead.
pub(super) fn resolve_style_args() -> Item {
    helper_function(
        "resolveStyleArgs",
        vec![
            Param::typed("styles", TsType::Raw("Array<any> | IArguments".into())),
            Param::typed("context", TsType::Raw("Record<string, any>".into())),
        ],
        TsType::Raw("any[]".into()),
        indoc! {r"
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
        "}
        .trim(),
        [],
    )
}

pub(super) fn create_serialize_css() -> Item {
    helper_function(
        "createSerializeCss",
        vec![Param::typed("context", TsType::Raw("Record<string, any>".into()))],
        TsType::Raw("(...styles: any[]) => string".into()),
        indoc! {r#"
            const u = context.utility
            const c = context.conditions
            const hash = context.hash
            const fmt = (s: string) => u.prefix ? u.prefix + "-" + s : s
            const toClass = (paths: string[], name: string) => {
              const parts = c.finalize(paths)
              parts.push(hash ? name : fmt(name))
              return hash ? fmt(u.toHash(parts, toHash)) : parts.join(":")
            }
            return weakMemo(memo(function serializeCss({ base, ...styles }: Record<string, any> = {}) {
              const obj = normalizeStyleObject(base ? Object.assign(styles, base) : styles, context)
              const set = new Set<string>()
              walkObject(obj, (value: any, paths: string[]) => {
                if (value == null) return
                const important = isImportant(value)
                const [prop, ...all] = c.shift(paths)
                const cond = filterBaseConditions(all)
                const res = u.transform(prop, withoutSpace(withoutImportant(sanitizeStyleValue(value))))
                let name = toClass(cond, res.className)
                if (important) name += "!"
                set.add(name)
              })
              let out = ""
              for (const name of set) out += out ? " " + name : name
              return out
            }))
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
        TsType::Raw("(...styles: any[]) => any".into()),
        indoc! {r"
            return function mergeCss() {
              return mergeProps(...resolveStyleArgs(arguments, context))
            }
        "}
        .trim(),
        [],
    )
}

pub(super) fn create_serialize_css_args() -> Item {
    helper_function(
        "createSerializeCssArgs",
        vec![
            Param::typed(
                "serializeCss",
                TsType::Raw("(...styles: any[]) => string".into()),
            ),
            Param::typed("mergeCss", TsType::Raw("(...styles: any[]) => any".into())),
        ],
        TsType::Raw("(...styles: any[]) => string".into()),
        indoc! {r"
            return memo(function serializeCssArgs(...styles: any[]) {
              return serializeCss(mergeCss(...styles))
            })
        "}
        .trim(),
        [],
    )
}

pub(super) fn create_assign_css() -> Item {
    helper_function(
        "createAssignCss",
        vec![Param::typed(
            "context",
            TsType::Raw("Record<string, any>".into()),
        )],
        TsType::Raw("(...styles: any[]) => any".into()),
        indoc! {r"
            return function assignCss() {
              const out: Record<string, any> = {}
              const resolved = resolveStyleArgs(arguments, context)
              for (let i = 0; i < resolved.length; i++) Object.assign(out, resolved[i])
              return out
            }
        "}
        .trim(),
        [],
    )
}

pub(super) fn hypenate_property_regexes() -> Item {
    Item::runtime(ItemNode::RawStmt(
        indoc! {r"
            const HYPHENATE_PROPERTY_REGEX = /[A-Z]/g
            const MS_PROPERTY_REGEX = /^ms-/
        "}
        .trim()
        .into(),
    ))
}

pub(super) fn hypenate_property() -> Item {
    helper_function(
        "hypenateProperty",
        vec![Param::typed("property", TsType::Ref("string".into()))],
        TsType::Ref("string".into()),
        r#"return property.startsWith("--") ? property : property.replace(HYPHENATE_PROPERTY_REGEX, "-$&").replace(MS_PROPERTY_REGEX, "-ms-").toLowerCase()"#,
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
