use super::jsx_helper::{type_import, value_import};
use super::react_jsx::FACTORY_SOURCE;
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn module(
    ctx: CodegenContext<'_>,
    factory: &str,
    component: &str,
    upper: &str,
) -> Module {
    Module::new()
        .with_import(value_import(&["h"], "preact"))
        .with_import(value_import(&["forwardRef"], "preact/compat"))
        .with_import(ImportDecl::value(
            ["cx", "cva"],
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(ImportDecl::value(
            [
                "composeCvaFn",
                "composeShouldForwardProps",
                "getDisplayName",
                "serializeSplitStyles",
                "mergeDefaultProps",
                "splitJsxProps",
            ],
            "./helper",
        ))
        .with_import(ImportDecl::value(["isCssProperty"], "./is-valid-prop"))
        .with_import(type_import(
            &[
                "ElementType",
                "ForwardRefExoticComponent",
                "ReactNode",
                "RefAttributes",
            ],
            "preact/compat",
        ))
        .with_import(type_import(
            &["JsxRecipeFn", "ShouldForwardProp", "StyledMarkers"],
            "./helper",
        ))
        .with_import(type_import(&["RecipeDefinition"], "../types/recipe"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(Item::typed_source(
            FACTORY_SOURCE
                .replace("createElement", "h")
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component)
                .replace("__UPPER__", upper),
        ))
}
