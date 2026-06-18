//! The `css` artifact: the `css()` / `mergeCss()` runtime + its types.

mod css_literal;

use std::collections::BTreeMap;

use pandacss_config::CssSyntaxKind;

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
        id: ArtifactId::Css,
        dependencies,
        files: emit_module_files(
            "css/css",
            &module(ctx),
            options.format,
            false,
            options.import_extensions,
            dependencies,
        ),
    }
}

fn module(ctx: CodegenContext<'_>) -> Module {
    if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        return css_literal::module(ctx);
    }

    Module::new()
        .with_import(ImportDecl::value(
            [
                "createCssRuntime",
                "hypenateProperty",
                "isObject",
                "withoutSpace",
            ],
            "../helpers",
        ))
        .with_import(ImportDecl::value(
            ["breakpointKeys", "finalizeConditions", "sortConditions"],
            "./conditions",
        ))
        .with_import(ImportDecl::ty(["SystemStyleObject"], "../types/system"))
        .with_item(Item::ty(ItemNode::RawStmt(CSS_TYPES.into())))
        .with_item(Item::runtime(ItemNode::RawStmt(css_runtime_code(ctx))))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "css".into(),
            type_annotation: Some(TsType::Ref("CssFunction".into())),
            init: Some(Expr::Raw(CSS_EXPORT.into())),
            js_doc: None,
        })))
        .with_item(Item::runtime(ItemNode::RawStmt(
            "export { mergeCss, assignCss }".into(),
        )))
}

fn css_runtime_code(ctx: CodegenContext<'_>) -> String {
    let (utilities, has_shorthand) = encode_utilities(ctx);
    let prefix =
        serde_json::to_string(&ctx.config.prefix.class_name()).expect("prefix should serialize");
    let separator = ctx.separator();
    let hash = if ctx.config.hash.class_name() {
        "true"
    } else {
        "false"
    };

    CSS_RUNTIME_TEMPLATE
        .replace("__UTILITIES__", &utilities)
        .replace("__PREFIX__", &prefix)
        .replace("__SEPARATOR__", separator)
        .replace(
            "__HAS_SHORTHAND__",
            if has_shorthand { "true" } else { "false" },
        )
        .replace("__HASH__", hash)
}

/// Encodes the utility table as `prop:className/shorthand1/...` entries joined by
/// `,`, mirroring the runtime decoder. A shorthand equal to its className is
/// emitted as `1` to save bytes. Returns the encoded string and whether any
/// shorthand exists.
///
/// A className the runtime can reproduce on its own — i.e. it equals
/// `hypenateProperty(prop)` — is *redundant*: the transform's
/// `classNameByProp.get(prop) || hypenateProperty(prop)` fallback yields the
/// same class. Such entries are dropped entirely (or reduced to just their
/// shorthands), shrinking the table. The check uses a JS-faithful hyphenation
/// so vendor-prefixed props (`WebkitX` → `-webkit-x` at runtime) — where the
/// stored class differs from the fallback — are always kept.
fn encode_utilities(ctx: CodegenContext<'_>) -> (String, bool) {
    let utilities = &ctx.types.utilities;

    let mut shorthands_by_prop: BTreeMap<&str, Vec<&str>> = BTreeMap::new();
    for (shorthand, target) in &utilities.shorthands {
        shorthands_by_prop
            .entry(target.as_str())
            .or_default()
            .push(shorthand.as_str());
    }

    let entries = utilities
        .class_names
        .iter()
        .filter_map(|(prop, class_name)| {
            let shorthands = shorthands_by_prop.get(prop.as_str());
            let redundant = *class_name == js_hyphenate_property(prop);

            // Default class + no shorthand → the runtime fallback covers it.
            if redundant && shorthands.is_none() {
                return None;
            }

            // Keep the shorthands but drop a redundant class (empty token).
            let class_token = if redundant {
                String::new()
            } else {
                class_name.clone()
            };
            let mut meta = vec![class_token];
            if let Some(shorthands) = shorthands {
                meta.extend(shorthands.iter().map(|shorthand| {
                    if *shorthand == class_name {
                        "1".to_owned()
                    } else {
                        (*shorthand).to_owned()
                    }
                }));
            }
            Some(format!("{prop}:{}", meta.join("/")))
        })
        .collect::<Vec<_>>()
        .join(",");

    (entries, !utilities.shorthands.is_empty())
}

/// Mirrors the runtime `hypenateProperty` for redundant className detection.
fn js_hyphenate_property(property: &str) -> String {
    if property.starts_with("--") {
        return property.to_owned();
    }

    let mut out = String::with_capacity(property.len() + 4);
    for ch in property.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch);
        } else {
            out.push(ch);
        }
    }

    if let Some(rest) = out.strip_prefix("ms-") {
        out = format!("-ms-{rest}");
    }

    out.to_lowercase()
}

// PORT NOTE: the trailing duplicate `(styles: Styles)` overload is load-bearing
// (same as v1): it makes tsc elaborate argument mismatches at the offending
// property instead of collapsing them into a call-site "No overload matches"
// error, which property-level `@ts-expect-error` directives rely on.
const CSS_TYPES: &str = r"type Styles = SystemStyleObject | undefined | null | false

interface CssRawFunction {
  (styles: Styles): SystemStyleObject
  (styles: Styles[]): SystemStyleObject
  (...styles: Array<Styles | Styles[]>): SystemStyleObject
  (styles: Styles): SystemStyleObject
}

interface CssFunction {
  (styles: Styles): string
  (styles: Styles[]): string
  (...styles: Array<Styles | Styles[]>): string
  (styles: Styles): string

  raw: CssRawFunction
}";

const CSS_EXPORT: &str = r"/* @__PURE__ */ Object.assign(
  function css(...styles: any[]) {
    if (styles.length === 1 && isObject(styles[0])) return serializeCss(styles[0])
    return serializeCss(mergeCss(...styles))
  },
  {
    raw: function cssRaw(...styles: any[]) {
      return mergeCss(...styles)
    },
  },
)";

const CSS_RUNTIME_TEMPLATE: &str = r#"const utilities = "__UTILITIES__"

const classNameByProp = new Map<string, string>()
const shorthands = new Map<string, string>()
if (utilities) {
  utilities.split(",").forEach((utility: string) => {
    const [prop, meta] = utility.split(":")
    const [className, ...shorthandList] = meta.split("/")
    if (className) classNameByProp.set(prop, className)
    shorthandList.forEach((shorthand: string) => {
      const key = shorthand === "1" ? className : shorthand
      shorthands.set(key, prop)
    })
  })
}

const resolveShorthand = (prop: string) => shorthands.get(prop) || prop

const { serializeCss, mergeCss, assignCss } = createCssRuntime({
  hash: __HASH__,
  conditions: {
    shift: sortConditions,
    finalize: finalizeConditions,
    breakpoints: { keys: breakpointKeys },
  },
  utility: {
    prefix: __PREFIX__,
    hasShorthand: __HAS_SHORTHAND__,
    toHash(path: string[], hashFn: any) {
      return hashFn(path.join(":"))
    },
    transform(prop: string, value: string) {
      const key = resolveShorthand(prop)
      const propKey = classNameByProp.get(key) || hypenateProperty(key)
      return { className: `${propKey}__SEPARATOR__${withoutSpace(value)}` }
    },
    resolveShorthand,
  },
})"#;
