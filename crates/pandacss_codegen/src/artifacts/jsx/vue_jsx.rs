use crate::{ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(factory: &str, component: &str, upper: &str) -> Module {
    Module::new()
        .with_import(value_import(&["computed", "defineComponent", "h"], "vue"))
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
            VUE_FACTORY_RUNTIME
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const VUE_FACTORY_RUNTIME: &str = r"function styledFn(Dynamic, configOrCva = {}, options = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)
  const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
  const variantKeys = __cvaFn__.variantKeys
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  const shouldForwardProp = forwardPropSet
    ? (prop) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
    : (prop) => forwardFn(prop, variantKeys)
  const dataProps = options.dataAttr && configOrCva.__name__ ? Object.assign({}, { 'data-recipe': configOrCva.__name__ }) : {}
  const defaultProps = Object.assign(dataProps, options.defaultProps)
  const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)
  const __base__ = Dynamic.__base__ || Dynamic
  const name = getDisplayName(__base__)

  const __COMPONENT__ = defineComponent({
    name: `__FACTORY__.${name}`,
    inheritAttrs: false,
    props: {
      modelValue: null,
      unstyled: { type: Boolean, default: false },
      as: { type: [String, Object], default: __base__ },
    },
    setup(props, { slots, attrs, emit }) {
      const combinedProps = computed(() => Object.assign({}, defaultProps, attrs))
      const splittedProps = computed(() => splitJsxProps(combinedProps.value, __shouldForwardProps__, variantSet, isCssProperty, true))
      const classes = computed(() => {
        const [_htmlProps, _forwardedProps, variantProps, propStyles, cssStyles] = splittedProps.value
        const hasStyles = propStyles || cssStyles !== void 0
        if (props.unstyled) return cx(hasStyles && serializeSplitStyles(propStyles, cssStyles), combinedProps.value.className, combinedProps.value.class)
        if (configOrCva.__recipe__) {
          const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps)
          return cx(
            __cvaFn__(variantProps, false),
            (compoundVariantStyles || hasStyles) && serializeSplitStyles(propStyles, cssStyles, compoundVariantStyles),
            combinedProps.value.className,
            combinedProps.value.class,
          )
        }
        return cx(
          hasStyles ? serializeSplitStyles(propStyles, cssStyles, __cvaFn__.raw(variantProps)) : __cvaFn__(variantProps),
          combinedProps.value.className,
          combinedProps.value.class,
        )
      })
      const vModelProps = computed(() => {
        const result = {}
        if (props.as === 'input' && (props.type === 'checkbox' || props.type === 'radio')) {
          result.checked = props.modelValue
          result.onChange = (event) => {
            const checked = !event.currentTarget.checked
            emit('change', checked, event)
            emit('update:modelValue', checked, event)
          }
        } else if (props.as === 'input' || props.as === 'textarea' || props.as === 'select') {
          result.value = props.modelValue
          result.onInput = (event) => {
            const value = event.currentTarget.value
            emit('input', value, event)
            emit('update:modelValue', value, event)
          }
        }
        return result
      })
      return () => {
        const [htmlProps, forwardedProps, _variantProps, _propStyles, _cssStyles, elementProps] = splittedProps.value
        return h(props.as, {
          ...forwardedProps,
          ...elementProps,
          ...htmlProps,
          ...vModelProps.value,
          class: classes.value,
        }, slots)
      }
    },
  })

  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = __cvaFn__
  __COMPONENT__.__base__ = __base__
  __COMPONENT__.__shouldForwardProps__ = shouldForwardProp
  return __COMPONENT__
}

const tags = 'a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, big, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, input, ins, kbd, keygen, label, legend, li, link, main, map, mark, marquee, menu, menuitem, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, picture, pre, progress, q, rp, rt, ruby, s, samp, script, section, select, small, source, span, strong, style, sub, summary, sup, table, tbody, td, textarea, tfoot, th, thead, time, title, tr, track, u, ul, var, video, wbr, circle, clipPath, defs, ellipse, foreignObject, g, image, line, linearGradient, mask, path, pattern, polygon, polyline, radialGradient, rect, stop, svg, text, tspan'

export const __FACTORY__ = /* @__PURE__ */ styledFn.bind()
tags.split(', ').forEach((tag) => {
  __FACTORY__[tag] = __FACTORY__(tag)
})";

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
