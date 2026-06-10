use pandacss_config::{JsxStylePropsConfig, PatternConfig};

use crate::{CodegenContext, ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(ctx: CodegenContext<'_>, name: &str, pattern: &PatternConfig) -> Module {
    let factory = factory_name(ctx);
    let meta = ctx.pattern_jsx_meta(name, pattern);
    let pattern_keys_json = pattern_keys_json(pattern);

    let mut module = Module::new()
        .with_import(value_import(&["h"], "preact"))
        .with_import(value_import(&["forwardRef"], "preact/compat"))
        .with_import(ImportDecl::value(["splitProps"], "../helpers"))
        .with_import(value_import(
            &[meta.raw_name.as_str()],
            &format!("../patterns/{}", meta.stem),
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(type_import(&["FunctionComponent"], "preact"))
        .with_import(type_import(
            &[meta.props_name.as_str()],
            &format!("../patterns/{}", meta.stem),
        ))
        .with_import(type_import(&[meta.html_props.as_str()], "../types/jsx"))
        .with_import(type_import(&["DistributiveOmit"], "../types/system"));

    if matches!(style_props(ctx), JsxStylePropsConfig::Minimal) {
        module = module.with_import(ImportDecl::value(["mergeCss"], "../css/css"));
    }

    module
        .with_item(raw_runtime(pattern_runtime_body(
            &meta.jsx_name,
            &factory,
            &meta.jsx_element,
            &meta.raw_name,
            &pattern_keys_json,
            style_props(ctx),
        )))
        .with_item(raw_type(format!(
            "export interface {component_props} extends {props_name}, DistributiveOmit<{html_props}<{jsx_element:?}>, {omit_keys}> {{}}\n\nexport declare const {jsx_name}: FunctionComponent<{component_props}>",
            component_props = meta.component_props,
            props_name = meta.props_name,
            html_props = meta.html_props,
            jsx_element = meta.jsx_element,
            omit_keys = meta.omit_keys,
            jsx_name = meta.jsx_name,
        )))
}

fn pattern_runtime_body(
    jsx_name: &str,
    factory: &str,
    jsx_element: &str,
    style_getter: &str,
    pattern_keys_json: &str,
    mode: JsxStylePropsConfig,
) -> String {
    let body = match mode {
        JsxStylePropsConfig::All => {
            "const mergedProps = { ref, ...styleProps, ...restProps }".to_owned()
        }
        JsxStylePropsConfig::Minimal => {
            "const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }"
                .to_owned()
        }
        JsxStylePropsConfig::None => {
            "const mergedProps = { ref, ...restProps, css: styleProps }".to_owned()
        }
    };

    format!(
        r"export const {jsx_name} = /* @__PURE__ */ forwardRef(function {jsx_name}(props, ref) {{
  const [patternProps, restProps] = splitProps(props, {pattern_keys_json})
  const styleProps = {style_getter}(patternProps)
  {body}
  return h({factory}[{jsx_element:?}], mergedProps)
}})"
    )
}

fn pattern_keys_json(pattern: &PatternConfig) -> String {
    let keys = pattern.properties.keys().cloned().collect::<Vec<_>>();
    serde_json::to_string(&keys).expect("pattern keys serialize")
}

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}

fn value_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Value,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

fn type_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Type,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

fn raw_runtime(code: impl Into<String>) -> Item {
    Item::runtime(ItemNode::RawStmt(code.into()))
}

fn raw_type(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}
