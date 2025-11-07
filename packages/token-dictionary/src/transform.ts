import { isCssUnit, isString, PandaError } from '@pandacss/shared'
import type { TokenDataTypes } from '@pandacss/types'
import picomatch from 'picomatch'
import { P, match } from 'ts-pattern'
import type { TokenTransformer } from './dictionary'
import { isCompositeBorder, isCompositeGradient, isCompositeShadow } from './is-composite'
import { svgToDataUri } from './mini-svg-uri'
import type { Token } from './token'
import { expandReferences, getReferences, hasReference } from './utils'

function toUnit(v: string | number) {
  return isCssUnit(v) || hasReference(v.toString()) ? v : `${v}px`
}

function px(v: string | number) {
  return isString(v) ? v : `${v}px`
}

/* -----------------------------------------------------------------------------
 * Shadow token transform
 * -----------------------------------------------------------------------------*/

export const transformShadow: TokenTransformer = {
  name: 'tokens/shadow',
  match: (token) => token.extensions.category === 'shadows',
  transform(token, dict) {
    if (isString(token.value)) {
      return token.value
    }

    if (Array.isArray(token.value)) {
      return token.value.map((value) => this.transform({ value } as Token, dict)).join(', ')
    }

    if (isCompositeShadow(token.value)) {
      const { offsetX, offsetY, blur, spread, color, inset } = token.value
      return [inset ? 'inset ' : '', px(offsetX), px(offsetY), px(blur), px(spread), color].filter(Boolean).join(' ')
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
      return `${toUnit(width)} ${style} ${color}`
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
      .with({ type: 'url' }, ({ value }) => `url("${value}")`)
      .with({ type: 'svg' }, ({ value }) => `url("${svgToDataUri(value)}")`)
      .exhaustive()
  },
}

/* -----------------------------------------------------------------------------
 * Color mix token transform
 * -----------------------------------------------------------------------------*/

export const transformColorMix: TokenTransformer = {
  name: 'tokens/color-mix',
  match: (token) => {
    return token.extensions.category === 'colors' && token.value.includes('/')
  },
  transform(token, dict) {
    if (!token.value.includes('/')) return token

    return expandReferences(token.value, (path) => {
      const tokenFn = (tokenPath: string) => {
        const token = dict.getByName(tokenPath)
        return token?.extensions.varRef
      }

      const mix = dict.colorMix(path, tokenFn)
      if (mix.invalid) {
        throw new PandaError('INVALID_TOKEN', 'Invalid color mix at ' + path + ': ' + mix.value)
      }

      return mix.value
    })
  },
}

/* -----------------------------------------------------------------------------
 * Add css variables
 * -----------------------------------------------------------------------------*/

export const addCssVariables: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/css-var',
  transform(token, dictionary) {
    const { prefix, hash } = dictionary
    const { isNegative, originalPath } = token.extensions
    const pathValue = isNegative ? originalPath : token.path
    const variable = dictionary.formatCssVar(pathValue.filter(Boolean), { prefix, hash })
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
  transform(token, dictionary) {
    const { prefix, hash } = dictionary

    const refs = getReferences(token.value)
    if (!refs.length) return token.value

    const modifier = refs.some((ref) => ref.includes('/'))

    if (!modifier) {
      refs.forEach((ref) => {
        const variable = dictionary.formatCssVar(ref.split('.'), { prefix, hash }).ref
        token.value = token.value.replace(`{${ref}}`, variable)
      })
    } else {
      const tokenFn = (name: string) => {
        const token = dictionary.getByName(name)
        return token?.extensions.varRef
      }

      token.value = expandReferences(token.value, (path) => {
        const mix = dictionary.colorMix(path, tokenFn)
        if (mix.invalid) {
          throw new PandaError('INVALID_TOKEN', 'Invalid color mix at ' + path + ': ' + mix.value)
        }
        return mix.value
      })
    }

    return token.value
  },
}

export const addColorPalette: TokenTransformer = {
  type: 'extensions',
  name: 'tokens/colors/colorPalette',
  match(token) {
    return token.extensions.category === 'colors' && !token.extensions.isVirtual
  },
  transform(token, dict) {
    // Check colorPalette configuration
    const colorPaletteConfig = dict.colorPalette
    const enabled = colorPaletteConfig?.enabled ?? true
    const include = colorPaletteConfig?.include
    const exclude = colorPaletteConfig?.exclude

    // If disabled, don't add colorPalette extensions
    if (!enabled) return {}

    // Extract color path (remove 'colors' prefix and last segment)
    // ['colors', 'blue', '500'] -> ['blue']
    // ['colors', 'button', 'light', 'accent', 'secondary'] -> ['button', 'light', 'accent']
    // ['colors', 'primary'] -> ['primary'] (handle flat tokens)
    let colorPath = token.path.slice(1, -1)

    // If no nested segments, use the path without the 'colors' prefix
    if (colorPath.length === 0) {
      colorPath = token.path.slice(1)
      if (colorPath.length === 0) {
        return {}
      }
    }

    // Convert path segments to dot-notation string for pattern matching
    const colorPathString = colorPath.join('.')

    // Check include/exclude filters using picomatch (supports glob patterns)
    // Exclude takes precedence over include
    if (exclude?.length) {
      const excludeMatchers = exclude.map((pattern) => picomatch(pattern))
      if (excludeMatchers.some((matcher) => matcher(colorPathString))) {
        return {}
      }
    }

    if (include?.length) {
      const includeMatchers = include.map((pattern) => picomatch(pattern))
      if (!includeMatchers.some((matcher) => matcher(colorPathString))) {
        return {}
      }
    }

    /**
     * Generate all possible color palette roots from the color path.
     *
     * For ['button', 'light', 'accent']:
     * - ['button']
     * - ['button', 'light']
     * - ['button', 'light', 'accent']
     *
     * These represent all possible values you can pass to the css `colorPalette` property.
     */
    const colorPaletteRoots: string[][] = []
    for (let i = 0; i < colorPath.length; i++) {
      colorPaletteRoots.push(colorPath.slice(0, i + 1))
    }

    const colorPaletteRoot = colorPath[0]
    const colorPalette = dict.formatTokenName(colorPath)

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
    // Remove everything before colorPalette root and the root itself
    const startIndex = token.path.indexOf(colorPaletteRoot) + 1
    const remainingPath = token.path.slice(startIndex)
    const colorPaletteTokenKeys: string[][] = []

    // Generate all suffixes of the remaining path
    for (let i = 0; i < remainingPath.length; i++) {
      colorPaletteTokenKeys.push(remainingPath.slice(i))
    }

    // https://github.com/chakra-ui/panda/issues/1421
    if (colorPaletteTokenKeys.length === 0) {
      colorPaletteTokenKeys.push([''])
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
  transformColorMix, // depends on `addCssVariables`
  addConditionalCssVariables,
  addColorPalette,
]

export interface ColorPaletteExtensions {
  colorPalette: string
  colorPaletteRoots: Array<string[]>
  colorPaletteTokenKeys: Array<string[]>
}
