//! `css/view-transition` runtime for `viewTransition()`.

use pandacss_config::CssSyntaxKind;

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
        id: ArtifactId::ViewTransition,
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

    if ctx.virtualizes(RuntimeImport::CssIndex) {
        return Vec::new();
    }

    emit_module_files(
        "css/view-transition",
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
    let impl_src = VIEW_TRANSITION_IMPL.replace("__PREFIX__", &prefix);

    Module::new()
        .with_import(ImportDecl::value(
            ["toHash"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_import(ImportDecl::ty(["SystemStyleObject"], "../types/system"))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "ViewTransitionStyleObject".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw(
                "{ group?: SystemStyleObject; imagePair?: SystemStyleObject; old?: SystemStyleObject; new?: SystemStyleObject }"
                    .into(),
            ),
            js_doc: None,
        }))
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: true,
            name: "ViewTransitionFn".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw("(options: ViewTransitionStyleObject) => string".into()),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "viewTransition".into(),
            type_annotation: Some(TsType::Ref("ViewTransitionFn".into())),
            init: Some(Expr::Raw(impl_src)),
            js_doc: None,
        })))
}

const VIEW_TRANSITION_IMPL: &str = r"(options) => {
  const prefix = __PREFIX__
  const slots = ['group', 'imagePair', 'old', 'new']
  const filtered = {}
  if (options && typeof options === 'object') {
    for (const key of slots) {
      if (key in options) filtered[key] = options[key]
    }
  }
  const base = 'vt_' + toHash(stableStringify(filtered))
  return prefix ? prefix + '-' + base : base

  function stableStringify(value) {
    if (value === null) return 'null'
    const t = typeof value
    if (t === 'boolean') return value ? 'true' : 'false'
    if (t === 'number') return Number.isFinite(value) ? String(value) : 'null'
    if (t === 'string') return JSON.stringify(value)
    if (Array.isArray(value)) {
      let out = '['
      for (let i = 0; i < value.length; i++) {
        if (i) out += ','
        out += stableStringify(value[i])
      }
      return out + ']'
    }
    if (t === 'object') {
      const keys = Object.keys(value).sort()
      let out = '{'
      for (let i = 0; i < keys.length; i++) {
        if (i) out += ','
        const key = keys[i]
        out += JSON.stringify(key) + ':' + stableStringify(value[key])
      }
      return out + '}'
    }
    return 'null'
  }
}";
