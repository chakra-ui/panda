import { forwardRef } from 'react'
import { isCssProperty } from './is-valid-prop'
import { css } from '../css'

function cx(...args) {
  return args.filter(Boolean).join(' ')
}

function splitProps(props) {
  const styleProps = {}
  const elementProps = {}

  for (const [key, value] of Object.entries(props)) {
    if (isCssProperty(key)) {
      styleProps[key] = value
    } else {
      elementProps[key] = value
    }
  }

  return [styleProps, elementProps]
}

function styled(Dynamic) {
  const PandaComponent = forwardRef((props, ref) => {
    const { as: Element = Dynamic, ...restProps } = props

    const [styleProps, elementProps] = splitProps(restProps)

    const classes = () => {
      const { css: cssStyles, ...otherStyles } = styleProps
      const atomicClass = css({ ...otherStyles, ...cssStyles })
      return cx(atomicClass, elementProps.className)
    }

    return <Element ref={ref} {...elementProps} className={classes()} />
  })
  
  PandaComponent.displayName = `panda.${Dynamic}`
  return PandaComponent
}

function createFactory() {
  const cache = new Map()

  return new Proxy(Object.create(null), {
    get(_, el) {
      if (!cache.has(el)) {
        cache.set(el, styled(el))
      }
      return cache.get(el)
    },
  })
}

export const panda = createFactory();