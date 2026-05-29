use indoc::indoc;

use crate::{ConstDecl, Expr, Item, ItemNode, Param, TsType};

use super::shared::helper_function;

pub(super) fn is_css_function() -> Item {
    helper_function(
        "isCssFunction",
        vec![Param::typed("v", TsType::Unknown)],
        TsType::Bool,
        r#"return typeof v === "string" && /^(min|max|clamp|calc)\(.*\)/.test(v)"#,
        [],
    )
}

pub(super) fn is_css_var() -> Item {
    helper_function(
        "isCssVar",
        vec![Param::typed("v", TsType::Unknown)],
        TsType::Bool,
        r#"return typeof v === "string" && /^var\(--.+\)$/.test(v)"#,
        [],
    )
}

pub(super) fn is_css_unit() -> Item {
    helper_function(
        "isCssUnit",
        vec![Param::typed("v", TsType::Unknown)],
        TsType::Bool,
        r#"return typeof v === "string" && /^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?(?:cm|mm|Q|in|pc|pt|px|em|ex|ch|rem|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|%)$/.test(v)"#,
        [],
    )
}

pub(super) fn pattern_fns() -> Item {
    Item::both(ItemNode::Const(ConstDecl {
        exported: true,
        declare: false,
        name: "patternFns".into(),
        type_annotation: Some(TsType::Raw(
            "Record<string, (...args: any[]) => any>".into(),
        )),
        init: Some(Expr::Raw(
            "{ map: mapObject, isCssFunction, isCssVar, isCssUnit }".into(),
        )),
        js_doc: None,
    }))
}

pub(super) fn get_pattern_styles() -> Item {
    helper_function(
        "getPatternStyles",
        vec![
            Param::typed("pattern", TsType::Raw("Record<string, any>".into())),
            Param::typed("styles", TsType::Raw("Record<string, any>".into())),
        ],
        TsType::Raw("Record<string, any>".into()),
        indoc! {r#"
            if (!pattern?.defaultValues) return styles
            const defaults = typeof pattern.defaultValues === "function" ? pattern.defaultValues(styles) : pattern.defaultValues
            const out = Object.assign({}, defaults)
            for (const key in styles) {
              if (styles[key] !== void 0) out[key] = styles[key]
            }
            return out
        "#}
        .trim(),
        [],
    )
}
