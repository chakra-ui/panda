//! The `tokens` artifact: the `token()` runtime (a flat `path -> value` map
//! plus `var` lookups) generated from the config's token dictionary.

use crate::{
    Artifact, ArtifactId, CodegenContext, ConstDecl, DependencySet, Expr, ImportDecl, Item,
    ItemNode, Module, TsType,
    graph::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Tokens,
        dependencies,
        files: emit_module_files(
            "tokens/index",
            &module(ctx),
            options.format,
            false,
            options.import_extensions,
            dependencies,
        ),
    }
}

fn module(ctx: CodegenContext<'_>) -> Module {
    let hash = ctx.config.hash.css_var();
    let prefix = ctx.config.prefix.css_var().unwrap_or_default();

    let mut module = Module::new();
    if hash {
        module = module.with_import(ImportDecl::value(["toHash"], "../helpers"));
    }

    module
        .with_import(ImportDecl::ty(["Token", "TokenPath"], "../types/tokens"))
        .with_item(Item::ty(ItemNode::RawStmt(TOKEN_FN_TYPE.into())))
        .with_item(Item::runtime(ItemNode::RawStmt(runtime_code(
            ctx, prefix, hash,
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

fn runtime_code(ctx: CodegenContext<'_>, prefix: &str, hash: bool) -> String {
    let tokens =
        serde_json::to_string(&ctx.types.tokens.values).expect("token values should serialize");
    let var_prefix = var_prefix(prefix, hash);

    // The var-ref is derived from the path (never stored): `toVar` reproduces
    // the build-time css var exactly. The prefix segment is constant so it's
    // baked in; only the per-path name is computed at runtime.
    let to_var = if hash {
        format!(
            "function toVar(path: string): string {{\n  return {var_prefix} + toHash(path.replaceAll(\".\", \"-\")) + \")\"\n}}"
        )
    } else {
        format!(
            r#"function toVar(path: string): string {{
  let out = ""
  for (const ch of path.replaceAll(".", "-")) {{
    if (ch >= "A" && ch <= "Z") out += "-" + ch.toLowerCase()
    else if (/[a-z0-9_-]/.test(ch) || ch >= "\u0081") out += ch
    else out += "\\" + ch
  }}
  return {var_prefix} + out + ")"
}}"#
        )
    };

    format!("const tokens: Record<string, string> = {tokens}\n\n{to_var}\n\n{COLOR_MIX_FN}")
}

/// The constant `var(--{prefix-}` segment. The prefix is hashed-mode-raw but
/// var-name-sanitized otherwise, mirroring `pandacss_tokens::css_var_variable`.
fn var_prefix(prefix: &str, hash: bool) -> String {
    let mut out = String::from("\"var(--");
    if !prefix.is_empty() {
        if hash {
            out.push_str(prefix);
        } else {
            push_css_var_name(&mut out, prefix);
        }
        out.push('-');
    }
    out.push('"');
    out
}

/// Mirror of `pandacss_tokens::push_css_var_name` for the constant prefix
/// segment. The runtime `toVar` applies the same rules to the per-path name.
fn push_css_var_name(out: &mut String, value: &str) {
    for ch in value.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else if ch.is_ascii_alphanumeric()
            || ch == '_'
            || ch == '-'
            || ('\u{0081}'..='\u{ffff}').contains(&ch)
        {
            out.push(ch);
        } else {
            out.push('\\');
            out.push(ch);
        }
    }
}

const TOKEN_FN_TYPE: &str = r"interface TokenFn {
  (path: TokenPath, fallback?: string): string
  var: (path: Token, fallback?: string) => string
}";

const TOKEN_EXPORT: &str = r"/* @__PURE__ */ Object.assign(
  function token(path: string, fallback?: string) {
    const value = tokens[path]
    return value === undefined ? colorMix(path) || fallback : value || toVar(path)
  },
  {
    var: function tokenVar(path: string, fallback?: string) {
      return tokens[path] === undefined ? fallback : toVar(path)
    },
  },
)";

const COLOR_MIX_FN: &str = r#"function colorMix(path: string): string | undefined {
  const colorPrefix = "colors."
  if (!path.startsWith(colorPrefix)) return

  const index = path.indexOf("/", colorPrefix.length)
  if (index === -1 || index === path.length - 1) return

  const colorPath = path.slice(0, index)
  if (tokens[colorPath] === undefined) return

  const rawOpacity = path.slice(index + 1)
  const opacity = tokens["opacity." + rawOpacity]
  const percent = opacity === undefined ? Number(rawOpacity) : Number(opacity) * 100
  if (Number.isNaN(percent)) return

  return "color-mix(in oklab, " + toVar(colorPath) + " " + percent + "%, transparent)"
}"#;
