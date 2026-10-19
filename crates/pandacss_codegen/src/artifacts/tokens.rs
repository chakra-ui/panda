//! The `tokens` artifact: the `token()` runtime (a flat `path -> value` map
//! plus `var` lookups) generated from the config's token dictionary.
//!
//! Path → CSS-var (`toCssVar`) and opacity-modifier (`colorMix`) helpers live in
//! `helpers` so overlay apps share one prefix-aware implementation while each
//! app still emits its own token map. Paths whose variable `toCssVar` can't
//! rebuild (dotted keys, negative spacing) get an entry in `tokenVars`.

use std::collections::BTreeMap;

use pandacss_tokens::{TokenDictionary, css_var_name};

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
        .with_item(Item::runtime(ItemNode::RawStmt(resolve_var(
            &variable_overrides(ctx),
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

fn resolve_var(overrides: &BTreeMap<String, String>) -> String {
    if overrides.is_empty() {
        return "const resolveVar = toCssVar".to_owned();
    }
    let overrides = serde_json::to_string(overrides).expect("token variables should serialize");
    format!(
        "const tokenVars: Record<string, string> = {overrides}\nconst resolveVar = (path: string) => tokenVars[path] || toCssVar(path)"
    )
}

fn variable_overrides(ctx: CodegenContext<'_>) -> BTreeMap<String, String> {
    let built;
    let dictionary = match ctx.token_dictionary {
        crate::TokenDictionaryRef::BuildFromConfig => {
            built = TokenDictionary::from_config(ctx.config)
                .inspect_err(|error| {
                    tracing::warn!(target: "codegen", %error, "runtime tokens failed to build");
                })
                .ok()
                .flatten();
            built.as_ref()
        }
        crate::TokenDictionaryRef::Provided(dictionary) => dictionary,
    };
    let Some(dictionary) = dictionary else {
        return BTreeMap::new();
    };

    ctx.types
        .tokens
        .values
        .keys()
        .filter_map(|path| {
            let var = dictionary.runtime_var_str(path, None)?;
            (var != derived_variable(ctx, path)).then(|| (path.clone(), var.to_owned()))
        })
        .collect()
}

fn derived_variable(ctx: CodegenContext<'_>, path: &str) -> String {
    let name = css_var_name(
        &path.replace('.', "-"),
        ctx.config.prefix.css_var(),
        ctx.config.hash.css_var(),
    );
    format!("var({name})")
}

const TOKEN_FN_TYPE: &str = r"interface TokenFn {
  (path: TokenPath, fallback?: string): string
  var: (path: Token, fallback?: string) => string
}";

const TOKEN_EXPORT: &str = r"/* @__PURE__ */ Object.assign(
  function token(path: string, fallback?: string) {
    const value = tokens[path]
    return value === undefined ? colorMix(tokens, path, resolveVar) || fallback : value || resolveVar(path)
  },
  {
    var: function tokenVar(path: string, fallback?: string) {
      return tokens[path] === undefined ? fallback : resolveVar(path)
    },
  },
) as TokenFn";
