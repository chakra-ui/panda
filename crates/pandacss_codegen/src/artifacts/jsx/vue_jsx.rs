use super::jsx_helper::{type_import, value_import};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn module(
    ctx: CodegenContext<'_>,
    factory: &str,
    component: &str,
    upper: &str,
) -> Module {
    Module::new()
        .with_import(value_import(&["computed", "defineComponent", "h"], "vue"))
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
        .with_import(type_import(&["Component", "SetupContext"], "vue"))
        .with_import(type_import(
            &["JsxRecipeFn", "ShouldForwardProp", "StyledMarkers"],
            "./helper",
        ))
        .with_import(type_import(&["RecipeDefinition"], "../types/recipe"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(Item::typed_source(
            VUE_FACTORY_SOURCE
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component)
                .replace("__UPPER__", upper),
        ))
}

const VUE_FACTORY_SOURCE: &str = r"type Props = Record<string, unknown>

interface StyledOptions {
  shouldForwardProp?: ShouldForwardProp
  forwardProps?: readonly string[]
  dataAttr?: boolean
  defaultProps?: Props
}

type StyledBase = (string | Component) & StyledMarkers & { __base__?: string | Component }

type StyledComponentFn = Component & StyledMarkers & { displayName?: string }

type RecipeInput = JsxRecipeFn | Props

type ModelEvent = { currentTarget: { checked: boolean; value: string } }

function styledFn(Dynamic: StyledBase, configOrCva: RecipeInput = {}, options: StyledOptions = {}): StyledComponentFn {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva as JsxRecipeFn : cva(configOrCva as RecipeDefinition) as unknown as JsxRecipeFn
  const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
  const getRaw = __cvaFn__.__memoizedRaw__ || __cvaFn__.raw
  const variantKeys = __cvaFn__.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop: string) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop: string) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop: string) => forwardFn(prop, variantKeys)
  const dataProps: Props = options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {}
  const defaultProps = Object.assign(dataProps, options.defaultProps)
  const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)
  const __base__ = Dynamic.__base__ || Dynamic
  const name = getDisplayName(__base__ as Parameters<typeof getDisplayName>[0])

  const __COMPONENT__ = defineComponent({
    name: `__FACTORY__.${name}`,
    inheritAttrs: false,
    props: {
      modelValue: null,
      unstyled: { type: Boolean, default: false },
      as: { type: [String, Object], default: __base__ },
    },
    setup(props: Props, { slots, attrs, emit }: SetupContext) {
      const combinedProps = computed((): Props => Object.assign({}, defaultProps, attrs))
      const splittedProps = computed(() => splitJsxProps(combinedProps.value, __shouldForwardProps__, variantSet, isCssProperty, true))
      const classes = computed(() => {
        const [_htmlProps, _forwardedProps, variantProps, propStyles, cssStyles] = splittedProps.value
        const hasStyles = propStyles || cssStyles !== void 0
        if (props.unstyled) return cx(hasStyles && serializeSplitStyles(propStyles, cssStyles), combinedProps.value.className as string, combinedProps.value.class as string)
        if (configOrCva.__recipe__) {
          const compoundVariantClasses = __cvaFn__.__getCompoundVariantClasses__?.(variantProps)
          return cx(
            __cvaFn__(variantProps, false),
            compoundVariantClasses,
            hasStyles && serializeSplitStyles(propStyles, cssStyles),
            combinedProps.value.className as string,
            combinedProps.value.class as string,
          )
        }
        return cx(
          hasStyles ? serializeSplitStyles(propStyles, cssStyles, getRaw(variantProps)) : __cvaFn__(variantProps),
          combinedProps.value.className as string,
          combinedProps.value.class as string,
        )
      })
      const vModelProps = computed(() => {
        const result: Props = {}
        if (props.as === 'input' && (props.type === 'checkbox' || props.type === 'radio')) {
          result.checked = props.modelValue
          result.onChange = (event: ModelEvent) => {
            const checked = !event.currentTarget.checked
            emit('change', checked, event)
            emit('update:modelValue', checked, event)
          }
        } else if (props.as === 'input' || props.as === 'textarea' || props.as === 'select') {
          result.value = props.modelValue
          result.onInput = (event: ModelEvent) => {
            const value = event.currentTarget.value
            emit('input', value, event)
            emit('update:modelValue', value, event)
          }
        }
        return result
      })
      return () => {
        const [htmlProps, forwardedProps, _variantProps, _propStyles, _cssStyles, elementProps] = splittedProps.value
        return h(props.as as string, {
          ...forwardedProps,
          ...elementProps,
          ...htmlProps,
          ...vModelProps.value,
          class: classes.value,
        }, slots)
      }
    },
  }) as unknown as StyledComponentFn

  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = __cvaFn__
  __COMPONENT__.__base__ = __base__
  __COMPONENT__.__shouldForwardProps__ = shouldForwardProp
  return __COMPONENT__
}

const tags = 'a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, big, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, input, ins, kbd, keygen, label, legend, li, link, main, map, mark, marquee, menu, menuitem, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, picture, pre, progress, q, rp, rt, ruby, s, samp, script, section, select, small, source, span, strong, style, sub, summary, sup, table, tbody, td, textarea, tfoot, th, thead, time, title, tr, track, u, ul, var, video, wbr, circle, clipPath, defs, ellipse, foreignObject, g, image, line, linearGradient, mask, path, pattern, polygon, polyline, radialGradient, rect, stop, svg, text, tspan'

export const __FACTORY__: __UPPER__ = /* @__PURE__ */ styledFn.bind(undefined) as unknown as __UPPER__
tags.split(', ').forEach((tag) => {
  (__FACTORY__ as unknown as Record<string, StyledComponentFn>)[tag] = __FACTORY__(tag as 'div') as unknown as StyledComponentFn
})";
