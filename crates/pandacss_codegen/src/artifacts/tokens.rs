//! The `tokens` artifact: the `token()` runtime (a flat `path -> value` map
//! plus `var` lookups) generated from the config's token dictionary.
//!
//! Path → CSS-var (`toCssVar`) and opacity-modifier (`colorMix`) helpers live in
//! `helpers` so overlay apps share one prefix-aware implementation while each
//! app still emits its own token map.

use crate::{
    Artifact, ArtifactId, CodegenContext, ConstDecl, DependencySet, Expr, ImportDecl, Item,
    ItemNode, Module, RuntimeImport, TsType,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let module = {
        let _span = tracing::trace_span!(target: "codegen", "tokens_build_module").entered();
        module(ctx)
    };
    let files = {
        let _span = tracing::trace_span!(target: "codegen", "tokens_emit_module").entered();
        emit_module_files(
            "tokens/index",
            &module,
            options.format,
            false,
            options.import_extensions,
            dependencies,
        )
    };
    Artifact {
        id: ArtifactId::Tokens,
        dependencies,
        files,
    }
}

fn module(ctx: CodegenContext<'_>) -> Module {
    let tokens =
        serde_json::to_string(&ctx.types.tokens.values).expect("token values should serialize");

    Module::new()
        .with_import(ImportDecl::value(
            ["colorMix", "toCssVar"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_import(ImportDecl::ty(["Token", "TokenPath"], "../types/tokens"))
        .with_item(Item::ty(ItemNode::RawStmt(TOKEN_FN_TYPE.into())))
        .with_item(Item::runtime(ItemNode::RawStmt(format!(
            "const tokens: Record<string, string> = {tokens}"
        ))))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "token".into(),
            type_annotation: Some(TsType::Ref("TokenFn".into())),
            init: Some(Expr::Raw(TOKEN_EXPORT.into())),
            js_doc: None,
        })))
}

const TOKEN_FN_TYPE: &str = r"interface TokenFn {
  (path: TokenPath, fallback?: string): string
  var: (path: Token, fallback?: string) => string
}";

const TOKEN_EXPORT: &str = r"/* @__PURE__ */ Object.assign(
  function token(path: string, fallback?: string) {
    const value = tokens[path]
    return value === undefined ? colorMix(tokens, path) || fallback : value || toCssVar(path)
  },
  {
    var: function tokenVar(path: string, fallback?: string) {
      return tokens[path] === undefined ? fallback : toCssVar(path)
    },
  },
)";
