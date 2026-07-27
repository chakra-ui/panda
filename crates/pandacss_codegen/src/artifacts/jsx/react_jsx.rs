use super::jsx_helper::{raw_runtime, raw_type, type_import, value_import};
use crate::{CodegenContext, ImportDecl, Module, RuntimeImport};

pub(super) fn module(
    ctx: CodegenContext<'_>,
    factory: &str,
    component: &str,
    upper: &str,
) -> Module {
    Module::new()
        .with_import(value_import(&["createElement", "forwardRef"], "react"))
        .with_import(ImportDecl::value(
            ["cx", "cva"],
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(ImportDecl::value(
            [
                "composeCvaFn",
                "composeShouldForwardProps",
                "getDisplayName",
                "serializeSplitStyles",
                "splitJsxProps",
            ],
            "./helper",
        ))
        .with_import(ImportDecl::value(["isCssProperty"], "./is-valid-prop"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(raw_runtime(
            FACTORY_RUNTIME
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const FACTORY_RUNTIME: &str = r"function styledFn(BaseComponent, recipeOrConfig = {}, options = {}) {
  const recipeFn = recipeOrConfig.__cva__ || recipeOrConfig.__recipe__ ? recipeOrConfig : cva(recipeOrConfig)
  const composedRecipeFn = composeCvaFn(BaseComponent.__cva__, recipeFn)
  const getRaw = composedRecipeFn.__memoizedRaw__ || composedRecipeFn.raw
  const variantKeys = composedRecipeFn.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop) => forwardFn(prop, variantKeys)

  const dataProps = options.dataAttr && recipeOrConfig.__name__ ? { 'data-recipe': recipeOrConfig.__name__ } : {}
  const defaultProps = Object.assign(dataProps, options.defaultProps)
  const hasDefaultProps = Object.keys(defaultProps).length > 0

  const shouldForward = composeShouldForwardProps(BaseComponent, shouldForwardProp)
  const DefaultElement = BaseComponent.__base__ || BaseComponent

  // Without variants, custom forwarding, defaults or a config recipe, the class
  // is constant and `shouldForwardProp` is just `!isCssProperty`. That collapses
  // the six prop buckets into one and the recipe call into a precomputed string.
  const isPlain =
    variantKeys.length === 0 &&
    !hasDefaultProps &&
    !recipeOrConfig.__recipe__ &&
    !options.shouldForwardProp &&
    !forwardPropSet &&
    !BaseComponent.__shouldForwardProps__
  const plainClassName = isPlain ? cx(composedRecipeFn({})) : ''
  const plainStyles = isPlain ? getRaw({}) : void 0

  function plainRender(props, ref) {
    const Element = props.as === void 0 ? DefaultElement : props.as
    const elementProps = { ref }
    let htmlProps
    let propStyles
    let cssStyles
    for (const key in props) {
      const value = props[key]
      if (value === void 0) continue
      switch (key) {
        case 'as':
        case 'unstyled':
        case 'children':
        case 'className':
          continue
        case 'css':
          cssStyles = value
          continue
        case 'htmlWidth':
          (htmlProps ||= {}).width = value
          continue
        case 'htmlHeight':
          (htmlProps ||= {}).height = value
          continue
        case 'htmlTranslate':
          (htmlProps ||= {}).translate = value
          continue
        case 'htmlContent':
          (htmlProps ||= {}).content = value
          continue
      }
      if (isCssProperty(key)) (propStyles ||= {})[key] = value
      else elementProps[key] = value
    }
    // `htmlWidth` & co. win over a same-named forwarded prop, as in `splitJsxProps`.
    if (htmlProps) Object.assign(elementProps, htmlProps)

    const hasStyles = propStyles || cssStyles !== void 0
    if (props.unstyled) {
      elementProps.className = cx(hasStyles && serializeSplitStyles(propStyles, cssStyles), props.className)
    } else if (hasStyles) {
      elementProps.className = cx(serializeSplitStyles(propStyles, cssStyles, plainStyles), props.className)
    } else {
      // `plainClassName` is already merged, so `cx` would only re-tokenize it.
      elementProps.className = props.className == null ? plainClassName : cx(plainClassName, props.className)
    }

    return createElement(Element, elementProps, props.children)
  }

  function render(props, ref) {
    const Element = props.as === void 0 ? DefaultElement : props.as
    const unstyled = props.unstyled
    const children = props.children
    let combinedProps = props
    if (hasDefaultProps) {
      const { as, unstyled, children, ...restProps } = props
      combinedProps = Object.assign({}, defaultProps, restProps)
    }
    const [htmlProps, forwardedProps, variantProps, propStyles, cssStyles, elementProps] = splitJsxProps(
      combinedProps,
      shouldForward,
      variantSet,
      isCssProperty,
    )
    const hasStyles = propStyles || cssStyles !== void 0
    let className
    if (unstyled) {
      className = cx(hasStyles && serializeSplitStyles(propStyles, cssStyles), combinedProps.className)
    } else if (recipeOrConfig.__recipe__) {
      const compoundVariantClasses = composedRecipeFn.__getCompoundVariantClasses__?.(variantProps)
      className = cx(
        composedRecipeFn(variantProps, false),
        compoundVariantClasses,
        hasStyles && serializeSplitStyles(propStyles, cssStyles),
        combinedProps.className,
      )
    } else {
      className = cx(
        hasStyles ? serializeSplitStyles(propStyles, cssStyles, getRaw(variantProps)) : composedRecipeFn(variantProps),
        combinedProps.className,
      )
    }

    return createElement(Element, {
      ref,
      ...forwardedProps,
      ...elementProps,
      ...htmlProps,
      className,
    }, children ?? combinedProps.children)
  }

  const __COMPONENT__ = /* @__PURE__ */ forwardRef(isPlain ? plainRender : render)

  const name = getDisplayName(DefaultElement)
  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = composedRecipeFn
  __COMPONENT__.__base__ = DefaultElement
  __COMPONENT__.__shouldForwardProps__ = shouldForwardProp

  return __COMPONENT__
}

function createJsxFactory() {
  const cache = new Map()
  return new Proxy(styledFn, {
    apply(_, __, args) {
      return styledFn(...args)
    },
    get(_, el) {
      if (!cache.has(el)) cache.set(el, styledFn(el))
      return cache.get(el)
    },
  })
}

export const __FACTORY__ = /* @__PURE__ */ createJsxFactory()";
