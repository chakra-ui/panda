//! The `conditions` artifact: the configured condition keys plus the
//! `isCondition` / `sortConditions` runtime helpers and their types.

use crate::{
    Artifact, ArtifactFile, ArtifactId, Block, CodegenContext, DependencySet, FunctionDecl,
    ImportDecl, Item, ItemNode, Module, Param, Stmt, TsType,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn module(ctx: CodegenContext<'_>) -> Module {
    let keys = ctx.condition_keys();
    runtime_module(&keys)
}

#[must_use]
pub fn declaration_module(keys: &[String]) -> Module {
    runtime_module(keys)
}

fn runtime_module(keys: &[String]) -> Module {
    Module::new()
        .with_import(ImportDecl::value(["withoutSpace"], "../helpers"))
        .with_item(Item::raw_stmt(&runtime_consts(keys)))
        .with_item(runtime_function(
            "isCondition",
            vec![Param::typed("v", TsType::Ref("string".into()))],
            TsType::Bool,
            "return conditions.has(v) || conditionRe.test(v)",
        ))
        .with_item(runtime_function(
            "finalizeConditions",
            vec![Param::typed("paths", TsType::Raw("string[]".into()))],
            TsType::Raw("string[]".into()),
            r"return paths.map((p) => {
  if (conditions.has(p)) {
    return p.replace(underscoreRe, '')
  }
  if (selectorRe.test(p)) {
    return `[${withoutSpace(p.trim())}]`
  }
  return p
})",
        ))
        .with_item(runtime_function(
            "sortConditions",
            vec![Param::typed("paths", TsType::Raw("string[]".into()))],
            TsType::Raw("string[]".into()),
            r"return paths.sort((a, b) => {
  const aa = isCondition(a)
  const bb = isCondition(b)
  return aa && !bb ? 1 : !aa && bb ? -1 : 0
})",
        ))
}

#[must_use]
pub fn files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    if !options.format.is_source_ts() {
        return emit_module_files(
            "css/conditions",
            &declaration_module(&ctx.condition_keys()),
            options.format,
            false,
            options.specifiers,
            dependencies,
        );
    }

    emit_module_files(
        "css/conditions",
        &module(ctx),
        options.format,
        false,
        options.specifiers,
        dependencies,
    )
}

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Conditions,
        dependencies,
        files: files(ctx, options, dependencies),
    }
}

fn runtime_consts(keys: &[String]) -> String {
    let conditions = keys.join(",");
    format!(
        r#"const conditions = new Set("{conditions}".split(','))
const conditionRe = /^@|&/
const underscoreRe = /^_/
const selectorRe = /&|@/"#
    )
}

fn runtime_function(name: &str, params: Vec<Param>, return_type: TsType, body: &str) -> Item {
    Item::both(ItemNode::Function(FunctionDecl {
        exported: true,
        declare: false,
        name: name.into(),
        generic_params: Vec::new(),
        params,
        return_type: Some(return_type),
        body: Some(Block::new(vec![Stmt::Raw(body.into())])),
        js_doc: None,
    }))
}
