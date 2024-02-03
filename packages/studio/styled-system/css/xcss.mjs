import { astish, createCss, isObject, mergeProps, withoutSpace } from '../helpers.mjs';
import { finalizeConditions, sortConditions } from './conditions.string-literal.mjs';

function transform(prop, value) {
  const className = `${prop}_${withoutSpace(value)}`
  return { className }
}

const context = {
  hash: false,
  conditions: {
    shift: sortConditions,
    finalize: finalizeConditions,
    breakpoints: { keys: [] },
  },
  utility: {
    prefix: undefined,
    transform,
    hasShorthand: false,
    toHash: (path, hashFn) => hashFn(path.join(":")),
    resolveShorthand(prop) {
      return prop
    },
  }
}

const cssFn = createCss(context)

const fn = (style) => (isObject(style) ? style : astish(style[0]))
export const xcss = (...styles) => cssFn(mergeProps(...styles.filter(Boolean).map(fn)))
xcss.raw = (...styles) => mergeProps(...styles.filter(Boolean).map(fn))