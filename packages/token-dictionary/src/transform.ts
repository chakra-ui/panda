import { cssVar, isString } from '@css-panda/shared'
import { isMatching, P } from 'ts-pattern'
import type { TokenTransformer } from './dictionary'
import type { Token } from './token'
import { getReferences } from './utils'

/* -----------------------------------------------------------------------------
 * Shadow token transform
 * -----------------------------------------------------------------------------*/

const isCompositeShadow = isMatching({
  inset: P.optional(P.boolean),
  offsetX: P.number,
  offsetY: P.number,
  blur: P.number,
  spread: P.number,
  color: P.string,
})

export const transformShadow: TokenTransformer = {
  name: 'tokens/shadow',
  match: (token) => token.extensions.category === 'shadows',
  transform(token, { prefix }) {
    if (isString(token.value)) {
      return token.value
    }

    if (Array.isArray(token.value)) {
      return token.value.map((value) => this.transform({ value } as Token, { prefix })).join(', ')
    }

    if (isCompositeShadow(token.value)) {
      const { offsetX, offsetY, blur, spread, color, inset } = token.value
      return `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`
    }

    return token.value
  },
}

/* -----------------------------------------------------------------------------
 * Gradient token transform
 * -----------------------------------------------------------------------------*/

const isCompositeGradient = isMatching({
  type: P.string,
  placement: P.string,
  stops: P.array({
    color: P.string,
    position: P.number,
  }),
})

export const transformGradient: TokenTransformer = {
  name: 'tokens/gradient',
  match: (token) => token.extensions.category === 'gradients',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }

    if (isCompositeGradient(token.value)) {
      const { type, stops, placement } = token.value
      const rawStops = stops.map((stop) => {
        const { color, position } = stop
        return `${color} ${position}px`
      })
      return `${type}-gradient(${placement}, ${rawStops.join(', ')})`
    }

    return token.value
  },
}

/* -----------------------------------------------------------------------------
 * Fonts token transform
 * -----------------------------------------------------------------------------*/

export const transformFonts: TokenTransformer = {
  name: 'tokens/fonts',
  match: (token) => token.extensions.category === 'fonts',
  transform(token) {
    if (Array.isArray(token.value)) {
      return token.value.join(', ')
    }

    return token.value
  },
}

/* -----------------------------------------------------------------------------
 * Easing token transform
 * -----------------------------------------------------------------------------*/

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

/* -----------------------------------------------------------------------------
 * Border token transform
 * -----------------------------------------------------------------------------*/

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

/* -----------------------------------------------------------------------------
 * Add css variables
 * -----------------------------------------------------------------------------*/

export const addCssVariables: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/css-var',
  transform(token, { prefix }) {
    const { isNegative, originalPath } = token.extensions
    const pathValue = isNegative ? originalPath : token.path
    const variable = cssVar(pathValue.join('-'), { prefix })
    return {
      var: variable.var,
      varRef: variable.ref,
    }
  },
}

/* -----------------------------------------------------------------------------
 * Add conditional css variables (POST)
 * -----------------------------------------------------------------------------*/

export const addConditionalCssVariables: TokenTransformer = {
  enforce: 'post',
  name: 'tokens/conditionals',
  transform(token, { prefix }) {
    const refs = getReferences(token.value)
    if (!refs.length) return token.value
    refs.forEach((ref) => {
      const variable = cssVar(ref.split('.').join('-'), { prefix }).ref
      token.value = token.value.replace(`{${ref}}`, variable)
    })
    return token.value
  },
}

function getPaletteName(path: string[]) {
  if (path.includes('colorPalette')) return ''
  const clone = [...path]
  clone.pop()
  clone.shift()
  return clone.join('.')
}

export const addPalette: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/colors/palette',
  match(token) {
    return token.extensions.category === 'colors'
  },
  transform(token) {
    return { palette: getPaletteName(token.path) }
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
  addPalette,
]
