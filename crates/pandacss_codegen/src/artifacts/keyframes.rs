//! `css/keyframes` runtime for `keyframes()`.

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
        id: ArtifactId::Keyframes,
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
        "css/keyframes",
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
    let impl_src = KEYFRAMES_IMPL.replace("__PREFIX__", &prefix);

    Module::new()
        .with_import(ImportDecl::value(
            ["stableStringify", "toHash"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_import(ImportDecl::ty(["CssKeyframes"], "../types/system"))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "KeyframesFn".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw("(keyframe: CssKeyframes[string]) => string".into()),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "keyframes".into(),
            type_annotation: Some(TsType::Ref("KeyframesFn".into())),
            init: Some(Expr::Raw(impl_src)),
            js_doc: None,
        })))
}

const KEYFRAMES_IMPL: &str = r"(keyframe) => {
  const prefix = __PREFIX__
  const wrap = (base) => (prefix ? prefix + '-' + base : base)
  const block = keyframe && typeof keyframe === 'object' ? keyframe : {}
  return wrap('kf_' + toHash(stableStringify(block)))
}";
