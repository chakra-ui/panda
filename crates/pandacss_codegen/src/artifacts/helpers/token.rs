//! Token runtime helpers: `toCssVar` (path → CSS var ref) and `colorMix` (opacity
//! modifier paths). Shared by the `tokens` artifact so overlay consumers keep one
//! prefix-aware implementation in helpers while each app ships its own token map.

use indoc::indoc;
use pandacss_tokens::push_css_var_name;

use crate::{Block, CodegenContext, FunctionDecl, Item, ItemNode, Param, Stmt, TsType};

pub(super) fn to_css_var(ctx: CodegenContext<'_>) -> Item {
    let hash = ctx.config.hash.css_var();
    let prefix = ctx.config.prefix.css_var().unwrap_or_default();
    let var_prefix = var_prefix(prefix, hash);

    // Body lines are indented +2 by the function emitter — keep statements flush-left here.
    let body = if hash {
        format!("return {var_prefix} + toHash(path.replaceAll(\".\", \"-\")) + \")\"")
    } else {
        format!(
            r#"let out = ""
for (const ch of path.replaceAll(".", "-")) {{
  if (ch >= "A" && ch <= "Z") out += "-" + ch.toLowerCase()
  else if (/[a-z0-9_-]/.test(ch) || ch >= "\u0081") out += ch
  else out += "\\" + ch
}}
return {var_prefix} + out + ")""#
        )
    };

    helper_function(
        "toCssVar",
        vec![Param::typed("path", TsType::Ref("string".into()))],
        TsType::Ref("string".into()),
        &body,
    )
}

pub(super) fn color_mix() -> Item {
    helper_function(
        "colorMix",
        vec![
            Param::typed("tokens", TsType::Raw("Record<string, string>".into())),
            Param::typed("path", TsType::Ref("string".into())),
            Param::optional("resolveVar", TsType::Raw("(path: string) => string".into())),
        ],
        TsType::Raw("string | undefined".into()),
        indoc! {r#"
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

            return "color-mix(in oklab, " + (resolveVar || toCssVar)(colorPath) + " " + percent + "%, transparent)"
        "#}
        .trim(), // indoc strips shared indent; emitter adds the function-body indent.
    )
}

/// The constant `var(--{prefix-}` segment, mirroring `pandacss_tokens::css_var_name`.
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

fn helper_function(name: &str, params: Vec<Param>, return_type: TsType, body: &str) -> Item {
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
