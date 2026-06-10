use crate::{ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(factory: &str, component: &str, upper: &str) -> Module {
    Module::new()
        .with_import(value_import(&["createElement", "forwardRef"], "react"))
        .with_import(ImportDecl::value(["cx", "cva"], "../css/index"))
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
  const variantKeys = composedRecipeFn.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop) => forwardFn(prop, variantKeys)

  const dataProps = options.dataAttr && recipeOrConfig.__name__ ? Object.assign({}, { 'data-recipe': recipeOrConfig.__name__ }) : {}
  const defaultProps = Object.assign(dataProps, options.defaultProps)
  const hasDefaultProps = Object.keys(defaultProps).length > 0

  const shouldForward = composeShouldForwardProps(BaseComponent, shouldForwardProp)
  const DefaultElement = BaseComponent.__base__ || BaseComponent

  const __COMPONENT__ = /* @__PURE__ */ forwardRef(function __COMPONENT__(props, ref) {
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
        hasStyles ? serializeSplitStyles(propStyles, cssStyles, composedRecipeFn.raw(variantProps)) : composedRecipeFn(variantProps),
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
  })

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
