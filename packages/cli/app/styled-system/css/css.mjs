import { createCss, createMergeCss, hypenateProperty, withoutSpace } from '../helpers.mjs';
import { sortConditions, finalizeConditions } from './conditions.mjs';

const classNameMap = {
  "borderSlim": "border-slim",
  "textStyle": "textStyle"
}

const shorthands = {}

const breakpointKeys = ["base","sm","md","lg","xl","2xl"]

const hasShorthand = false

const resolveShorthand = (prop) => shorthands[prop] || prop

function transform(prop, value) {
  const key = resolveShorthand(prop)
  const propKey = classNameMap[key] || hypenateProperty(key)
  const className = `${propKey}_${withoutSpace(value)}`
  return { className }
}

const context = {
  hash: false,
  conditions: {
    shift: sortConditions,
    finalize: finalizeConditions,
    breakpoints: { keys: breakpointKeys }
  },
  utility: {
    prefix: undefined,
    transform,
    hasShorthand,
    resolveShorthand,
  }
}

export const css = createCss(context)

export const { mergeCss, assignCss } = createMergeCss(context)