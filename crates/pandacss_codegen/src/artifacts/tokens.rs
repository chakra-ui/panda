//! The `tokens` artifact: the `token()` runtime (a flat `path -> value` map
//! plus `var` lookups) generated from the config's token dictionary.
//!
//! Path → CSS-var (`toCssVar`) and opacity-modifier (`colorMix`) helpers live in
//! `helpers` so overlay apps share one prefix-aware implementation while each
//! app still emits its own token map.

use std::collections::BTreeMap;

use pandacss_shared::to_hash;
use pandacss_tokens::TokenDictionary;

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

    let vars = variable_overrides(ctx);
    let token_export = if vars.is_empty() {
        TOKEN_EXPORT.to_owned()
    } else {
        TOKEN_EXPORT
            .replace("toCssVar(path)", "resolveVar(path)")
            .replace(
                "colorMix(tokens, path)",
                "colorMix(tokens, path, resolveVar)",
            )
    };

    let mut module = Module::new()
        .with_import(ImportDecl::value(
            ["colorMix", "toCssVar"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_import(ImportDecl::ty(["Token", "TokenPath"], "../types/tokens"))
        .with_item(Item::ty(ItemNode::RawStmt(TOKEN_FN_TYPE.into())))
        .with_item(Item::runtime(ItemNode::RawStmt(format!(
            "const tokens: Record<string, string> = {tokens}"
        ))));
    if !vars.is_empty() {
        let vars = serde_json::to_string(&vars).expect("token variables should serialize");
        module = module.with_item(Item::runtime(ItemNode::RawStmt(format!(
            "const tokenVars: Record<string, string> = {vars}\nconst resolveVar = (path: string) => tokenVars[path] || toCssVar(path)"
        ))));
    }
    module.with_item(Item::both(ItemNode::Const(ConstDecl {
        exported: true,
        declare: false,
        name: "token".into(),
        type_annotation: Some(TsType::Ref("TokenFn".into())),
        init: Some(Expr::Raw(token_export)),
        js_doc: None,
    })))
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
    let name = path.replace('.', "-");
    let prefix = ctx.config.prefix.css_var().unwrap_or_default();
    let mut out = String::from("var(--");
    if ctx.config.hash.css_var() {
        if !prefix.is_empty() {
            out.push_str(prefix);
            out.push('-');
        }
        out.push_str(&to_hash(&name));
    } else {
        if !prefix.is_empty() {
            super::helpers::push_css_var_name(&mut out, prefix);
            out.push('-');
        }
        super::helpers::push_css_var_name(&mut out, &name);
    }
    out.push(')');
    out
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
