use pandacss_config::{JsxStylePropsConfig, PatternConfig};
use pandacss_shared::js_ident;

use super::jsx_helper::{raw_runtime, raw_type, type_import, value_import};
use crate::{CodegenContext, ImportDecl, Module, RuntimeImport};

pub(super) fn module(ctx: CodegenContext<'_>, name: &str, pattern: &PatternConfig) -> Module {
    let factory = factory_name(ctx);
    let meta = ctx.pattern_jsx_meta(name, pattern);
    let omit_keys = qwik_omit_keys(&meta.omit_keys, &meta.props_name);
    let pattern_fn = js_ident(name);

    let mut module = Module::new()
        .with_import(value_import(&["h"], "@builder.io/qwik"))
        .with_import(value_import(
            &[pattern_fn.as_str()],
            &format!("../patterns/{}", meta.stem),
        ))
        .with_import(value_import(
            &["splitProps"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(type_import(&["Component"], "@builder.io/qwik"))
        .with_import(type_import(
            &[meta.props_name.as_str()],
            &format!("../patterns/{}", meta.stem),
        ))
        .with_import(type_import(&[meta.html_props.as_str()], "../types/jsx"))
        .with_import(type_import(
            &["Assign", "DistributiveOmit"],
            "../types/system",
        ));

    if matches!(style_props(ctx), JsxStylePropsConfig::Minimal) {
        module = module.with_import(ImportDecl::value(
            ["mergeCss"],
            &ctx.runtime_import(RuntimeImport::CssCss, "../css/css"),
        ));
    }

    module
        .with_item(raw_runtime(pattern_runtime_body(
            &meta.jsx_name,
            &factory,
            &meta.jsx_element,
            &pattern_fn,
            style_props(ctx),
        )))
        .with_item(raw_type(format!(
            "export interface {component_props} extends Assign<{html_props}<{jsx_element:?}>, DistributiveOmit<{props_name}, {omit_keys}>> {{}}\n\nexport declare const {jsx_name}: Component<{component_props}>",
            component_props = meta.component_props,
            html_props = meta.html_props,
            jsx_element = meta.jsx_element,
            props_name = meta.props_name,
            omit_keys = omit_keys,
            jsx_name = meta.jsx_name,
        )))
}

fn pattern_runtime_body(
    jsx_name: &str,
    factory: &str,
    jsx_element: &str,
    pattern_fn: &str,
    mode: JsxStylePropsConfig,
) -> String {
    let body = match mode {
        JsxStylePropsConfig::All => {
            "const mergedProps = { ...styleProps, ...restProps }".to_owned()
        }
        JsxStylePropsConfig::Minimal => {
            "const mergedProps = { ...restProps, css: mergeCss(styleProps, props.css) }".to_owned()
        }
        JsxStylePropsConfig::None => {
            "const mergedProps = { ...restProps, css: styleProps }".to_owned()
        }
    };

    format!(
        r"export const {jsx_name} = /* @__PURE__ */ function {jsx_name}(props) {{
  const [patternProps, restProps] = splitProps(props, {pattern_fn}.propKeys)
  const styleProps = {pattern_fn}.raw(patternProps)
  {body}
  return h({factory}[{jsx_element:?}], mergedProps)
}}"
    )
}

fn qwik_omit_keys(omit_keys: &str, props_name: &str) -> String {
    let props_key = format!("keyof {props_name}");
    let keys = omit_keys
        .split(" | ")
        .filter(|key| *key != props_key)
        .collect::<Vec<_>>();

    if keys.is_empty() {
        "\"\"".to_owned()
    } else {
        keys.join(" | ")
    }
}

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}
