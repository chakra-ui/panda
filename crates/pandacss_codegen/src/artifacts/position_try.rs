//! `css/position-try` runtime for `positionTry()`.

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConstDecl, DependencySet, Expr, ImportDecl,
    Item, ItemNode, Module, RuntimeImport, TsType, TypeAliasDecl,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::PositionTry,
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
    if ctx.virtualizes(RuntimeImport::CssIndex) {
        return Vec::new();
    }

    emit_module_files(
        "css/position-try",
        &module(ctx),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

fn module(ctx: CodegenContext<'_>) -> Module {
    let prefix =
        serde_json::to_string(&ctx.config.prefix.class_name()).expect("prefix should serialize");
    let impl_src = POSITION_TRY_IMPL.replace("__PREFIX__", &prefix);

    Module::new()
        .with_import(ImportDecl::value(
            ["stableStringify", "toHash"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_import(ImportDecl::ty(["SystemStyleObject"], "../types/system"))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "PositionTryFn".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw(position_try_fn_type(ctx)),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "positionTry".into(),
            type_annotation: Some(TsType::Ref("PositionTryFn".into())),
            init: Some(Expr::Raw(impl_src)),
            js_doc: None,
        })))
}

fn position_try_fn_type(ctx: CodegenContext<'_>) -> String {
    let names: Vec<String> = ctx.config.theme.position_try.keys().cloned().collect();
    if names.is_empty() {
        return "(options: SystemStyleObject) => string".into();
    }
    let name_union = names
        .iter()
        .map(|name| format!("{name:?}"))
        .collect::<Vec<_>>()
        .join(" | ");
    format!("(options: SystemStyleObject | {name_union}) => string")
}

const POSITION_TRY_IMPL: &str = r"(options) => {
  const prefix = __PREFIX__
  const wrap = (base) => '--' + (prefix ? prefix + '-' + base : base)
  if (typeof options === 'string') {
    return wrap('pt_' + options)
  }
  const block = options && typeof options === 'object' ? options : {}
  return wrap('pt_' + toHash(stableStringify(block)))
}";
