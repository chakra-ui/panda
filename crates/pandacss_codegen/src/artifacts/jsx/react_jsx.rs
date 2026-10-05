use super::jsx_helper::{type_import, value_import};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

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
        .with_import(type_import(
            &[
                "ElementType",
                "ForwardRefExoticComponent",
                "ReactNode",
                "RefAttributes",
            ],
            "react",
        ))
        .with_import(type_import(
            &["JsxRecipeFn", "ShouldForwardProp", "StyledMarkers"],
            "./helper",
        ))
        .with_import(type_import(&["RecipeDefinition"], "../types/recipe"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(Item::typed_source(
            FACTORY_SOURCE
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component)
                .replace("__UPPER__", upper),
        ))
}

/// Typed factory runtime, shared with Preact (which swaps `createElement` for `h`).
pub(super) const FACTORY_SOURCE: &str = r"type Props = Record<string, unknown>

type StyledProps = {
  as?: ElementType
  unstyled?: boolean
  children?: ReactNode
  className?: string
}

interface StyledOptions {
  shouldForwardProp?: ShouldForwardProp
  forwardProps?: readonly string[]
  dataAttr?: boolean
  defaultProps?: Props
}

type StyledBase = ElementType & StyledMarkers & { __base__?: ElementType }

type StyledComponentFn = ForwardRefExoticComponent<StyledProps & RefAttributes<unknown>> & StyledMarkers

type RecipeInput = JsxRecipeFn | Props

function styledFn(BaseComponent: StyledBase, recipeOrConfig: RecipeInput = {}, options: StyledOptions = {}): StyledComponentFn {
  const recipeFn = recipeOrConfig.__cva__ || recipeOrConfig.__recipe__ ? recipeOrConfig as JsxRecipeFn : cva(recipeOrConfig as RecipeDefinition) as unknown as JsxRecipeFn
  const composedRecipeFn = composeCvaFn(BaseComponent.__cva__, recipeFn)
  const getRaw = composedRecipeFn.__memoizedRaw__ || composedRecipeFn.raw
  const variantKeys = composedRecipeFn.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop: string) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop: string) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop: string) => forwardFn(prop, variantKeys)

  const dataProps: Props = options.dataAttr && recipeOrConfig.__name__ ? { 'data-recipe': recipeOrConfig.__name__ } : {}
  const defaultProps = Object.assign(dataProps, options.defaultProps)
  const hasDefaultProps = Object.keys(defaultProps).length > 0

  const shouldForward = composeShouldForwardProps(BaseComponent, shouldForwardProp)
  const DefaultElement: ElementType = BaseComponent.__base__ || BaseComponent

  const __COMPONENT__ = /* @__PURE__ */ forwardRef<unknown, StyledProps>(function __COMPONENT__(props, ref) {
    const Element = props.as === void 0 ? DefaultElement : props.as
    const unstyled = props.unstyled
    const children = props.children
    let combinedProps: StyledProps = props
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
  }) as StyledComponentFn

  const name = getDisplayName(DefaultElement)
  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = composedRecipeFn
  __COMPONENT__.__base__ = DefaultElement
  __COMPONENT__.__shouldForwardProps__ = shouldForwardProp

  return __COMPONENT__
}

function createJsxFactory(): __UPPER__ {
  const cache = new Map<PropertyKey, StyledComponentFn>()
  return new Proxy(styledFn, {
    apply(_, __, args) {
      return styledFn(...args as Parameters<typeof styledFn>)
    },
    get(_, el) {
      if (!cache.has(el)) cache.set(el, styledFn(el as StyledBase))
      return cache.get(el)
    },
  }) as unknown as __UPPER__
}

export const __FACTORY__: __UPPER__ = /* @__PURE__ */ createJsxFactory()";
