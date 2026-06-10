//! The `sva` artifact: the slot-recipe-creator factory `sva()`. Like `cva`,
//! a fixed runtime impl independent of config.

use pandacss_config::CssSyntaxKind;

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConstDecl, DependencySet, Expr, ImportDecl,
    Item, ItemNode, Module, TsType,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Sva,
        dependencies,
        files: files(ctx, options, dependencies),
    }
}

#[must_use]
pub fn files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        return Vec::new();
    }

    emit_module_files(
        "css/sva",
        &module(),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

fn module() -> Module {
    Module::new()
        .with_import(ImportDecl::value(
            [
                "getSlotRecipes",
                "memo",
                "splitProps",
                "toVariantMap",
                "withDefaults",
            ],
            "../helpers",
        ))
        .with_import(ImportDecl::value(["cva"], "./cva"))
        .with_import(ImportDecl::value(["cx"], "./cx"))
        .with_import(ImportDecl::ty(["SlotRecipeCreatorFn"], "../types/recipe"))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "sva".into(),
            type_annotation: Some(TsType::Ref("SlotRecipeCreatorFn".into())),
            init: Some(Expr::Raw(SVA_IMPL.into())),
            js_doc: None,
        })))
}

const SVA_IMPL: &str = r"(config) => {
  const slotRecipes = getSlotRecipes(config)
  const slots: Array<[string, any]> = []
  for (const slot in slotRecipes) slots.push([slot, cva(slotRecipes[slot])])

  const defaultVariants = config.defaultVariants ?? {}

  const classNameMap: Record<string, any> = {}
  if (config.className) {
    for (const [slot, slotFn] of slots) classNameMap[slot] = slotFn.config.className
  }

  const variants = config.variants ?? {}
  const variantKeys = Object.keys(variants)
  const variantMap = toVariantMap(variants)

  const svaFn = (props: Record<string, any>) => {
    const result: Record<string, any> = {}
    for (const [slot, slotFn] of slots) result[slot] = cx(slotFn(props), classNameMap[slot])
    return result
  }

  const raw = (props: Record<string, any>) => {
    const result: Record<string, any> = {}
    for (const [slot, slotFn] of slots) result[slot] = slotFn.raw(props)
    return result
  }

  return Object.assign(memo(svaFn), {
    __cva__: false,
    raw,
    config,
    variantMap,
    variantKeys,
    classNameMap,
    splitVariantProps(props: Record<string, any>) {
      return splitProps(props, variantKeys)
    },
    getVariantProps(props: Record<string, any>) {
      return withDefaults(defaultVariants, props)
    },
  })
}";
