import { calc, cssVar, isString } from '@css-panda/shared'
import type { TokenDictionary, TokenTransformer } from './dictionary'
import { getReferences } from './reference'
import type { Token } from './token'

export const transformShadow: TokenTransformer = {
  name: 'tokens/shadow',
  match: (token) => token.extensions.category === 'shadows',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }

    if (Array.isArray(token.value)) {
      return token.value.map((value) => this.transform({ value } as Token)).join(', ')
    }

    const { offsetX, offsetY, blur, spread, color, inset } = token.value
    return `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`
  },
}

export const transformGradient: TokenTransformer = {
  name: 'tokens/gradient',
  match: (token) => token.extensions.category === 'gradients',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }

    const { type, stops, placement } = token.value

    const rawStops = stops.map((stop: any) => {
      const { color, position } = stop
      return `${color} ${position}px`
    })

    return `${type}-gradient(${placement}, ${rawStops.join(', ')})`
  },
}

const toArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value])

export const transformFonts: TokenTransformer = {
  name: 'tokens/fonts',
  match: (token) => token.extensions.category === 'fonts',
  transform(token) {
    return toArray(token.value).join(', ')
  },
}

export const transformEasings: TokenTransformer = {
  name: 'tokens/easings',
  match: (token) => token.extensions.category === 'easings',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }
    return `cubic-bezier(${token.value.join(', ')})`
  },
}

export const transformBorders: TokenTransformer = {
  name: 'tokens/borders',
  match: (token) => token.extensions.category === 'borders',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }
    const { width, style, color } = token.value
    return `${width}px ${style} ${color}`
  },
}

export const addCssVariables: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/css-var',
  transform(token) {
    const variable = cssVar(token.path.join('-'))
    return {
      var: variable.var,
      varRef: token.extensions.isNegative ? calc.negate(variable) : variable.ref,
    }
  },
}

export const addConditionalCssVariables: TokenTransformer = {
  enforce: 'post',
  name: 'tokens/conditionals',
  transform(token) {
    const refs = getReferences(token.value)
    if (!refs.length) return token.value
    refs.forEach((ref) => {
      const variable = cssVar(ref.split('.').join('-')).ref
      token.value = token.value.replace(`{${ref}}`, variable)
    })
    return token.value
  },
}

export const transforms = [
  transformShadow,
  transformGradient,
  transformFonts,
  transformEasings,
  transformBorders,
  addCssVariables,
  addConditionalCssVariables,
]

export function applyTransforms(dict: TokenDictionary) {
  dict.registerTransform(...transforms)
  dict.build()
}
