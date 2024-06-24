import { createCss, createMergeCss, hypenateProperty, withoutSpace } from '../helpers.mjs';
import { sortConditions, finalizeConditions } from './conditions.mjs';

const utilities = ""

const classNameByProp = new Map()
utilities.split(',').forEach((utility) => {
  const [prop, className] = utility.split(':')
  classNameByProp.set(prop, className)
})

const context = {
  
  conditions: {
    shift: sortConditions,
    finalize: finalizeConditions,
    breakpoints: { keys: ["base"] }
  },
  utility: {
    
    transform: (key, value) => ({ className: `${classNameByProp.get(key) || hypenateProperty(key)}_${withoutSpace(value)}` }),
    
    toHash: (path, hashFn) => hashFn(path.join(":")),
    resolveShorthand: prop => prop,
  }
}

const cssFn = createCss(context)
export const css = (...styles) => cssFn(mergeCss(...styles))
css.raw = (...styles) => mergeCss(...styles)

export const { mergeCss, assignCss } = createMergeCss(context)