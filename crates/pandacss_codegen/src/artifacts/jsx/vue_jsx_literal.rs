use crate::{ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(factory: &str, component: &str, upper: &str) -> Module {
    Module::new()
        .with_import(value_import(&["computed", "defineComponent", "h"], "vue"))
        .with_import(ImportDecl::value(["css", "cx"], "../css/index"))
        .with_import(ImportDecl::value(["getDisplayName"], "./helper"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(raw_runtime(
            TEMPLATE_LITERAL_VUE_FACTORY_RUNTIME
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const TEMPLATE_LITERAL_VUE_FACTORY_RUNTIME: &str = r"function createStyled(Dynamic) {
  const name = getDisplayName(Dynamic)
  const __base__ = Dynamic.__base__ || Dynamic

  function styledFn(template) {
    const styles = css.raw(Dynamic.__styles__, template)
    const staticClassName = css(styles)

    const __COMPONENT__ = defineComponent({
      name: `__FACTORY__.${name}`,
      inheritAttrs: false,
      props: {
        modelValue: null,
        as: { type: [String, Object], default: __base__ },
      },
      setup(props, { slots, attrs, emit }) {
        const classes = computed(() => cx(staticClassName, attrs.className))
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

        return () => h(
          props.as,
          {
            class: classes.value,
            ...attrs,
            ...vModelProps.value,
          },
          slots,
        )
      },
    })

    __COMPONENT__.__styles__ = styles
    __COMPONENT__.__base__ = __base__
    return __COMPONENT__
  }

  return styledFn
}

const tags = 'a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, big, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, input, ins, kbd, keygen, label, legend, li, link, main, map, mark, marquee, menu, menuitem, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, picture, pre, progress, q, rp, rt, ruby, s, samp, script, section, select, small, source, span, strong, style, sub, summary, sup, table, tbody, td, textarea, tfoot, th, thead, time, title, tr, track, u, ul, var, video, wbr, circle, clipPath, defs, ellipse, foreignObject, g, image, line, linearGradient, mask, path, pattern, polygon, polyline, radialGradient, rect, stop, svg, text, tspan'

export const __FACTORY__ = /* @__PURE__ */ createStyled.bind()
tags.split(', ').forEach((tag) => {
  __FACTORY__[tag] = createStyled(tag)
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
