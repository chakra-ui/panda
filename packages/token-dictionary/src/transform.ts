import { cssVar, isString } from '@pandacss/shared'
import type { TokenDataTypes } from '@pandacss/types'
import { P, match } from 'ts-pattern'
import type { TokenTransformer } from './dictionary'
import { isCompositeBorder, isCompositeGradient, isCompositeShadow } from './is-composite'
import { svgToDataUri } from './mini-svg-uri'
import type { Token } from './token'
import { getReferences } from './utils'

/* -----------------------------------------------------------------------------
 * Shadow token transform
 * -----------------------------------------------------------------------------*/

export const transformShadow: TokenTransformer = {
  name: 'tokens/shadow',
  match: (token) => token.extensions.category === 'shadows',
  transform(token, opts) {
    if (isString(token.value)) {
      return token.value
    }

    if (Array.isArray(token.value)) {
      return token.value.map((value) => this.transform({ value } as Token, opts)).join(', ')
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
        if (isString(stop)) return stop
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

    if (Array.isArray(token.value)) {
      return `cubic-bezier(${token.value.join(', ')})`
    }

    return token.value
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

    if (isCompositeBorder(token.value)) {
      const { width, style, color } = token.value
      return `${width}px ${style} ${color}`
    }

    return token.value
  },
}

export const transformAssets: TokenTransformer = {
  name: 'tokens/assets',
  match: (token) => token.extensions.category === 'assets',
  transform(token) {
    const raw = token.value as TokenDataTypes['assets']
    return match(raw)
      .with(P.string, (value) => value)
      .with({ type: 'url' }, ({ value }) => `url('${value}')`)
      .with({ type: 'svg' }, ({ value }) => `url('${svgToDataUri(value)})'`)
      .exhaustive()
  },
}

/* -----------------------------------------------------------------------------
 * Add css variables
 * -----------------------------------------------------------------------------*/

export const addCssVariables: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/css-var',
  transform(token, { prefix, hash }) {
    const { isNegative, originalPath } = token.extensions
    const pathValue = isNegative ? originalPath : token.path
    const variable = cssVar(pathValue.filter(Boolean).join('-'), { prefix, hash })
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
  transform(token, { prefix, hash }) {
    const refs = getReferences(token.value)
    if (!refs.length) return token.value
    refs.forEach((ref) => {
      const variable = cssVar(ref.split('.').join('-'), { prefix, hash }).ref
      token.value = token.value.replace(`{${ref}}`, variable)
    })
    return token.value
  },
}

export const addColorPalette: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/colors/colorPalette',
  match(token) {
    return token.extensions.category === 'colors' && !token.extensions.isVirtual
  },
  transform(token) {
    let tokenPathClone = [...token.path]
    tokenPathClone.pop()
    tokenPathClone.shift()

    const isRoot = token.extensions.rawPath.includes('DEFAULT')

    if (tokenPathClone.length === 0 && isRoot) {
      const newPath = [...token.path]
      newPath.shift()
      tokenPathClone = newPath
    }

    if (tokenPathClone.length === 0) {
      return {}
    }

    /**
     * If this is the nested color palette:
     * ```json
     * {
     *   "colors": {
     *     "button": {
     *       "light": {
     *         "accent": {
     *           "secondary": {
     *             value: 'blue',
     *           },
     *         },
     *       },
     *     },
     *   },
     * },
     * ```
     *
     * The `colorPaletteRoots` will be `['button', 'button.light', 'button.light.accent']`.
     * It holds all the possible values you can pass to the css `colorPalette` property.
     * It's used by the `addVirtualPalette` middleware to build the virtual `colorPalette` token for each color pattern root.
     */
    const colorPaletteRoots = tokenPathClone.reduce((acc: string[], _: any, i: number, arr: string[]) => {
      const next = arr.slice(0, i + 1).join('.')
      acc.push(next)
      return acc
    }, [] as string[])

    const colorPaletteRoot = tokenPathClone[0]
    const colorPalette = tokenPathClone.join('.')

    /**
     * If this is the nested color palette:
     * ```json
     * {
     *   "colors": {
     *     "button": {
     *       "light": {
     *         "accent": {
     *           "secondary": {
     *             value: 'blue',
     *           },
     *         },
     *       },
     *     },
     *   },
     * },
     * ```
     *
     * The `colorPaletteTokenKeys` will be `['light.accent.secondary', 'accent.secondary', 'secondary']`
     * It is used by the `addVirtualPalette` middleware to build the virtual `colorPalette` token for each color pattern root.
     *
     * Examples:
     *
     * If the `colorPalette` is `button` then the virtual token will be `colorPalette.light.accent.secondary`.
     * ```jsx
     * <button
     *   className={css({
     *     colorPalette: 'button',
     *     color: 'colorPalette.light.accent.secondary',
     *   })}
     * />
     * ```
     *
     * If the `colorPalette` is `button.light` then the virtual token will be `colorPalette.accent.secondary`.
     * ```jsx
     * <button
     *   className={css({
     *     colorPalette: 'button.light',
     *     color: 'colorPalette.accent.secondary',
     *   })}
     * />
     * ```
     *
     * If the `colorPalette` is `button.light.accent` then the virtual token will be `colorPalette.secondary`.
     * ```jsx
     * <button
     *   className={css({
     *     colorPalette: 'button.light.accent',
     *     color: 'colorPalette.secondary',
     *   })}
     * />
     */
    const colorPaletteTokenKeys = token.path
      // Remove everything before colorPalette root and the root itself
      .slice(token.path.indexOf(colorPaletteRoot) + 1)
      .reduce((acc: string[], _: any, i: number, arr: string[]) => {
        acc.push(arr.slice(i).join('.'))
        return acc
      }, [] as string[])

    if (colorPaletteTokenKeys.length === 0 && isRoot) {
      colorPaletteTokenKeys.push('')
    }

    return {
      colorPalette,
      colorPaletteRoots,
      colorPaletteTokenKeys,
    }
  },
}

export const transforms = [
  transformShadow,
  transformGradient,
  transformFonts,
  transformEasings,
  transformBorders,
  transformAssets,
  addCssVariables,
  addConditionalCssVariables,
  addColorPalette,
]
