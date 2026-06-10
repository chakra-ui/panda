use crate::{CodegenContext, ConstDecl, Expr, ImportDecl, Item, ItemNode, Module, TsType};

#[must_use]
pub fn module(ctx: CodegenContext<'_>) -> Module {
    Module::new()
        .with_import(ImportDecl::value(
            ["createCssRuntime", "isObject", "mergeProps", "withoutSpace"],
            "../helpers",
        ))
        .with_import(ImportDecl::value(
            ["finalizeConditions", "sortConditions"],
            "./conditions",
        ))
        .with_item(Item::ty(ItemNode::RawStmt(CSS_LITERAL_TYPES.into())))
        .with_item(Item::runtime(ItemNode::RawStmt(runtime_code(ctx))))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "css".into(),
            type_annotation: Some(TsType::Ref("CssFunction".into())),
            init: Some(Expr::Raw(CSS_LITERAL_EXPORT.into())),
            js_doc: None,
        })))
        .with_item(Item::runtime(ItemNode::RawStmt(
            "export { mergeCss, assignCss }".into(),
        )))
}

fn runtime_code(ctx: CodegenContext<'_>) -> String {
    let prefix =
        serde_json::to_string(&ctx.config.prefix.class_name()).expect("prefix should serialize");
    let separator = ctx.separator();
    let hash = if ctx.config.hash.class_name() {
        "true"
    } else {
        "false"
    };

    CSS_LITERAL_RUNTIME_TEMPLATE
        .replace("__PREFIX__", &prefix)
        .replace("__SEPARATOR__", separator)
        .replace("__HASH__", hash)
}

const CSS_LITERAL_TYPES: &str = r"type CssTemplate = { raw: readonly string[] | ArrayLike<string> }

interface CssRawFunction {
  (template: CssTemplate): Record<string, any>
}

interface CssFunction {
  (template: CssTemplate): string

  raw: CssRawFunction
}";

const CSS_LITERAL_EXPORT: &str = r"/* @__PURE__ */ Object.assign(
  function css(...styles: any[]) {
    return serializeCss(mergeTemplateStyles(arguments))
  },
  {
    raw: function cssRaw(...styles: any[]) {
      return mergeTemplateStyles(arguments)
    },
  },
)";

const CSS_LITERAL_RUNTIME_TEMPLATE: &str = r#"const newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g
const ruleClean = /\/\*[^]*?\*\/|  +/g
const ruleNewline = /\n+/g

const astish = (val: string, tree: Array<Record<string, any>> = [{}]) => {
  if (!val) return tree[0]
  val = val.replace(ruleClean, "")
  newRule.lastIndex = 0
  let block: RegExpExecArray | null
  let left: string
  while ((block = newRule.exec(val))) {
    if (block[4]) tree.shift()
    else if (block[3]) {
      left = block[3].replace(ruleNewline, " ").trim()
      if (!left.includes("&") && !left.startsWith("@")) left = "& " + left
      tree.unshift(tree[0][left] = tree[0][left] || {})
    } else {
      tree[0][block[1]] = block[2].replace(ruleNewline, " ").trim()
    }
  }
  return tree[0]
}

const { serializeCss, mergeCss, assignCss } = createCssRuntime({
  hash: __HASH__,
  conditions: {
    shift: sortConditions,
    finalize: finalizeConditions,
    breakpoints: { keys: [] },
  },
  utility: {
    prefix: __PREFIX__,
    hasShorthand: false,
    toHash(path: string[], hashFn: any) {
      return hashFn(path.join(":"))
    },
    transform(prop: string, value: string) {
      return { className: `${prop}__SEPARATOR__${withoutSpace(value)}` }
    },
    resolveShorthand(prop: string) {
      return prop
    },
  },
})
const templateCache = new WeakMap<object, Record<string, any>>()
const toStyleObject = (style: any) => {
  if (isObject(style)) return style
  let cached = templateCache.get(style)
  if (!cached) {
    cached = astish(style[0])
    templateCache.set(style, cached)
  }
  return cached
}

function mergeTemplateStyles(styles: IArguments) {
  let out
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i]
    if (!style) continue
    const next = toStyleObject(style)
    out = out ? mergeProps(out, next) : next
  }
  return out || {}
}"#;
