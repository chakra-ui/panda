use super::jsx_helper::{raw_runtime, raw_type, type_import, value_import};
use crate::{CodegenContext, ImportDecl, Module, RuntimeImport};

pub(super) fn module(
    ctx: CodegenContext<'_>,
    factory: &str,
    component: &str,
    upper: &str,
) -> Module {
    Module::new()
        .with_import(value_import(&["mergeProps", "splitProps"], "solid-js"))
        .with_import(value_import(
            &["Dynamic", "createComponent"],
            "solid-js/web",
        ))
        .with_import(ImportDecl::value(
            ["css", "cx"],
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(ImportDecl::value(["getDisplayName"], "./helper"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(raw_runtime(
            TEMPLATE_LITERAL_SOLID_FACTORY_RUNTIME
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const TEMPLATE_LITERAL_SOLID_FACTORY_RUNTIME: &str = r"function createStyled(element) {
  const __base__ = element.__base__ || element
  return function styledFn(template) {
    const styles = css.raw(element.__styles__, template)
    const staticClassName = css(styles)

    const __COMPONENT__ = (props) => {
      const mergedProps = mergeProps({ as: __base__ }, props)
      const [localProps, elementProps] = splitProps(mergedProps, ['as', 'class'])

      return createComponent(
        Dynamic,
        mergeProps(
          {
            get component() {
              return localProps.as
            },
            get class() {
              return cx(staticClassName, localProps.class)
            },
          },
          elementProps,
        ),
      )
    }

    const name = getDisplayName(__base__)
    __COMPONENT__.displayName = `__FACTORY__.${name}`
    __COMPONENT__.__styles__ = styles
    __COMPONENT__.__base__ = __base__

    return __COMPONENT__
  }
}

function createJsxFactory() {
  const cache = new Map()
  return new Proxy(createStyled, {
    apply(_, __, args) {
      return createStyled(...args)
    },
    get(_, el) {
      if (!cache.has(el)) cache.set(el, createStyled(el))
      return cache.get(el)
    },
  })
}

export const __FACTORY__ = /* @__PURE__ */ createJsxFactory()";
