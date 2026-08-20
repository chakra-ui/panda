use crate::{CodegenContext, ImportDecl, Item, ItemNode, Module, RuntimeImport};

#[must_use]
pub fn module(ctx: CodegenContext<'_>) -> Module {
    let breakpoint_keys = serde_json::to_string(&ctx.config.theme.breakpoint_names())
        .expect("breakpoints should serialize");
    Module::new()
        .with_import(ImportDecl::value(
            ["withoutSpace"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_item(Item::runtime(ItemNode::RawStmt(format!(
            "export const breakpointKeys = {breakpoint_keys}"
        ))))
        .with_item(Item::runtime(ItemNode::RawStmt(
            CONDITIONS_LITERAL_RUNTIME.into(),
        )))
}

const CONDITIONS_LITERAL_RUNTIME: &str = r"export const isCondition = (val: string) => condRegex.test(val)

const condRegex = /^@|&|&$/
const selectorRegex = /&|@/

export const finalizeConditions = (paths: string[]) => {
  return paths.map((path) => selectorRegex.test(path) ? `[${withoutSpace(path.trim())}]` : path)
}

export function sortConditions(paths: string[]) {
  return [...paths].sort((a, b) => {
    const aa = isCondition(a)
    const bb = isCondition(b)
    if (aa && !bb) return 1
    if (!aa && bb) return -1
    return 0
  })
}";
