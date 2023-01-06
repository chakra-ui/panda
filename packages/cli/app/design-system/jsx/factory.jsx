import { forwardRef, useMemo } from 'react'
import { isCssProperty } from './is-valid-prop'
import { css, cx } from '../css'

const htmlProps = ['htmlSize', 'htmlTranslate', 'htmlWidth', 'htmlHeight']

function normalizeHtmlProp(key) {
  return htmlProps.includes(key) ? key.replace('html', '').toLowerCase() : key
}

function splitProps(props) {
  const styleProps = {}
  const elementProps = {}

  for (const [key, value] of Object.entries(props)) {
    if (isCssProperty(key)) {
      styleProps[key] = value
    } else {
      elementProps[normalizeHtmlProp(key)] = value
    }
  }

  return [styleProps, elementProps]
}

function styled(Dynamic) {
  const PandaComponent = forwardRef(function PandaComponent(props, ref) {
    const { as: Element = Dynamic, ...restProps } = props

    const [styleProps, elementProps] = useMemo(() => splitProps(restProps), [restProps])

    function classes(){
      const { css: cssStyles, ...otherStyles } = styleProps
      const atomicClass = css({ ...otherStyles, ...cssStyles })
      return cx(atomicClass, elementProps.className)
    }

    return <Element ref={ref} {...elementProps} className={classes()} />
  })
  
  PandaComponent.displayName = `panda.${Dynamic}`
  return PandaComponent
}

function createJsxFactory() {
  const cache = new Map()

  return new Proxy(Object.create(null), {
    apply(_, __, args) {
      return styled(...args)
    },
    get(_, el) {
      if (!cache.has(el)) {
        cache.set(el, styled(el))
      }
      return cache.get(el)
    },
  })
}

export const panda = createJsxFactory()
