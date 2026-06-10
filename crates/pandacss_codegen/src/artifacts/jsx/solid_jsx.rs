use crate::{ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(factory: &str, component: &str, upper: &str) -> Module {
    Module::new()
        .with_import(value_import(
            &["createMemo", "mergeProps", "splitProps"],
            "solid-js",
        ))
        .with_import(value_import(
            &["Dynamic", "createComponent"],
            "solid-js/web",
        ))
        .with_import(ImportDecl::value(["cx", "cva"], "../css/index"))
        .with_import(ImportDecl::value(["normalizeHTMLProps"], "../helpers"))
        .with_import(ImportDecl::value(
            [
                "composeCvaFn",
                "composeShouldForwardProps",
                "getDisplayName",
                "serializeSplitStyles",
                "splitStyleProps",
            ],
            "./helper",
        ))
        .with_import(ImportDecl::value(["isCssProperty"], "./is-valid-prop"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(raw_runtime(
            SOLID_FACTORY_RUNTIME
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const SOLID_FACTORY_RUNTIME: &str = r"function styledFn(element, configOrCva = {}, options = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)
  const __cvaFn__ = composeCvaFn(element.__cva__, cvaFn)
  const variantKeys = __cvaFn__.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop) => forwardFn(prop, variantKeys)

  const getDefaultProps = () => {
    const dataProps = options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {}
    const defaults = typeof options.defaultProps === 'function' ? options.defaultProps() : options.defaultProps
    return Object.assign(dataProps, defaults)
  }

  const __shouldForwardProps__ = composeShouldForwardProps(element, shouldForwardProp)
  const __base__ = element.__base__ || element

  const __COMPONENT__ = (props) => {
    const mergedProps = mergeProps({ as: __base__ }, getDefaultProps(), props)
    const [localProps, restProps] = splitProps(mergedProps, ['as', 'unstyled', 'class', 'className'])
    const [htmlProps, aProps] = splitProps(restProps, normalizeHTMLProps.keys)
    const forwardedKeys = createMemo(() => Object.keys(aProps).filter((prop) => __shouldForwardProps__(prop)))
    const [forwardedProps, variantProps, bProps] = splitProps(aProps, forwardedKeys(), variantKeys)
    const cssPropKeys = createMemo(() => Object.keys(bProps).filter((prop) => isCssProperty(prop)))
    const [styleProps, elementProps] = splitProps(bProps, cssPropKeys())

    function recipeClass() {
      const [propStyles, cssStyles] = splitStyleProps(styleProps)
      const hasStyles = propStyles || cssStyles !== void 0
      const compoundVariantClasses = __cvaFn__.__getCompoundVariantClasses__?.(variantProps)
      return cx(
        __cvaFn__(variantProps, false),
        compoundVariantClasses,
        hasStyles && serializeSplitStyles(propStyles, cssStyles),
        localProps.class,
        localProps.className,
      )
    }

    function cvaClass() {
      const [propStyles, cssStyles] = splitStyleProps(styleProps)
      const hasStyles = propStyles || cssStyles !== void 0
      return cx(
        hasStyles ? serializeSplitStyles(propStyles, cssStyles, __cvaFn__.raw(variantProps)) : __cvaFn__(variantProps),
        localProps.class,
        localProps.className,
      )
    }

    const classes = () => {
      if (localProps.unstyled) {
        const [propStyles, cssStyles] = splitStyleProps(styleProps)
        const hasStyles = propStyles || cssStyles !== void 0
        return cx(hasStyles && serializeSplitStyles(propStyles, cssStyles), localProps.class, localProps.className)
      }
      return configOrCva.__recipe__ ? recipeClass() : cvaClass()
    }

    if (forwardedProps.className) delete forwardedProps.className

    return createComponent(
      Dynamic,
      mergeProps(forwardedProps, elementProps, normalizeHTMLProps(htmlProps), {
        get component() {
          return localProps.as
        },
        get class() {
          return classes()
        },
      }),
    )
  }

  const name = getDisplayName(__base__)
  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = __cvaFn__
  __COMPONENT__.__base__ = __base__
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
