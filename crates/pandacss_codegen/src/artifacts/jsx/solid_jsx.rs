use super::jsx_helper::{type_import, value_import};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn module(
    ctx: CodegenContext<'_>,
    factory: &str,
    component: &str,
    upper: &str,
) -> Module {
    Module::new()
        .with_import(value_import(
            &["createMemo", "mergeProps", "splitProps"],
            "solid-js",
        ))
        .with_import(value_import(
            &["Dynamic", "createComponent"],
            "solid-js/web",
        ))
        .with_import(ImportDecl::value(
            ["cx", "cva"],
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(ImportDecl::value(
            ["normalizeHTMLProps"],
            &ctx.runtime_import(RuntimeImport::Helpers, "../helpers"),
        ))
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
        .with_import(type_import(&["Component", "ValidComponent"], "solid-js"))
        .with_import(type_import(
            &["JsxRecipeFn", "ShouldForwardProp", "StyledMarkers"],
            "./helper",
        ))
        .with_import(type_import(&["RecipeDefinition"], "../types/recipe"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(Item::typed_source(
            SOLID_FACTORY_SOURCE
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component)
                .replace("__UPPER__", upper),
        ))
}

const SOLID_FACTORY_SOURCE: &str = r"type Props = Record<string, unknown>

interface StyledOptions {
  shouldForwardProp?: ShouldForwardProp
  forwardProps?: readonly string[]
  dataAttr?: boolean
  defaultProps?: Props | (() => Props)
}

type StyledBase = ValidComponent & StyledMarkers & { __base__?: ValidComponent }

type StyledComponentFn = Component<Props> & StyledMarkers & { displayName?: string }

type RecipeInput = JsxRecipeFn | Props

function styledFn(element: StyledBase, configOrCva: RecipeInput = {}, options: StyledOptions = {}): StyledComponentFn {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva as JsxRecipeFn : cva(configOrCva as RecipeDefinition) as unknown as JsxRecipeFn
  const __cvaFn__ = composeCvaFn(element.__cva__, cvaFn)
  const getRaw = __cvaFn__.__memoizedRaw__ || __cvaFn__.raw
  const variantKeys = __cvaFn__.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop: string) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop: string) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop: string) => forwardFn(prop, variantKeys)

  const getDefaultProps = (): Props => {
    const dataProps: Props = options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {}
    const defaults = typeof options.defaultProps === 'function' ? options.defaultProps() : options.defaultProps
    return Object.assign(dataProps, defaults)
  }

  const __shouldForwardProps__ = composeShouldForwardProps(element, shouldForwardProp)
  const __base__: ValidComponent = element.__base__ || element

  const __COMPONENT__ = (props: Props) => {
    const mergedProps: Props = mergeProps({ as: __base__ }, getDefaultProps(), props)
    const [localProps, restProps] = splitProps(mergedProps, ['as', 'unstyled', 'class', 'className'])
    const [htmlProps, aProps]: [Props, Props] = splitProps(restProps, normalizeHTMLProps.keys)
    const forwardedKeys = createMemo(() => Object.keys(aProps).filter((prop) => __shouldForwardProps__(prop)))
    const [forwardedProps, variantProps, bProps]: [Props, Props, Props] = splitProps(aProps, forwardedKeys(), variantKeys)
    const cssPropKeys = createMemo(() => Object.keys(bProps).filter((prop) => isCssProperty(prop)))
    const [styleProps, elementProps]: [Props, Props] = splitProps(bProps, cssPropKeys())

    const classes = () => {
      const [propStyles, cssStyles] = splitStyleProps(styleProps)
      const hasStyles = propStyles || cssStyles !== void 0
      if (localProps.unstyled) return cx(hasStyles && serializeSplitStyles(propStyles, cssStyles), localProps.class as string, localProps.className as string)
      if (configOrCva.__recipe__) {
        const compoundVariantClasses = __cvaFn__.__getCompoundVariantClasses__?.(variantProps)
        return cx(
          __cvaFn__(variantProps, false),
          compoundVariantClasses,
          hasStyles && serializeSplitStyles(propStyles, cssStyles),
          localProps.class as string,
          localProps.className as string,
        )
      }
      return cx(
        hasStyles ? serializeSplitStyles(propStyles, cssStyles, getRaw(variantProps)) : __cvaFn__(variantProps),
        localProps.class as string,
        localProps.className as string,
      )
    }

    if (forwardedProps.className) delete forwardedProps.className

    return createComponent(
      Dynamic,
      mergeProps(forwardedProps, elementProps, normalizeHTMLProps(htmlProps), {
        get component() {
          return localProps.as as ValidComponent
        },
        get class() {
          return classes()
        },
      }),
    )
  }

  const name = getDisplayName(__base__ as Parameters<typeof getDisplayName>[0])
  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = __cvaFn__
  __COMPONENT__.__base__ = __base__
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
