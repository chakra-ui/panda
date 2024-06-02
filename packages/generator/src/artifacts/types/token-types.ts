import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import pluralize from 'pluralize'
import { ArtifactFile } from '../artifact'

const categories = [
  'aspectRatios',
  'zIndex',
  'opacity',
  'colors',
  'fonts',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'sizes',
  'shadows',
  'spacing',
  'radii',
  'borders',
  'borderWidths',
  'durations',
  'easings',
  'animations',
  'blurs',
  'gradients',
  'breakpoints',
  'assets',
]

export const tokenTypesArtifact = new ArtifactFile({
  id: 'tokens/tokens.d.ts',
  fileName: 'token-types',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['theme.tokens', 'theme.semanticTokens'],
  computed(ctx) {
    return { tokens: ctx.tokens }
  },
  code(params) {
    const { tokens } = params.computed

    const set = new Set<string>()

    set.add(`export type Token = ${tokens.isEmpty ? 'string' : unionType(Array.from(tokens.byName.keys()))}`)

    const result = new Set<string>(['export type Tokens = {'])

    if (tokens.isEmpty) {
      result.add('[token: string]: string')
    } else {
      const colorPaletteKeys = Array.from(tokens.view.colorPalettes.keys())
      if (colorPaletteKeys.length) {
        set.add(`export type ColorPalette = ${unionType(colorPaletteKeys)}`)
      }

      for (const [key, value] of tokens.view.categoryMap.entries()) {
        const typeName = capitalize(pluralize.singular(key))
        set.add(`export type ${typeName}Token = ${unionType(value.keys())}`)
        result.add(`\t\t${key}: ${typeName}Token`)
      }
    }

    result.add('} & { [token: string]: never }')

    set.add(Array.from(result).join('\n'))

    set.add(`export type TokenCategory = ${unionType(categories)}`)

    return outdent.string(Array.from(set).join('\n\n'))
  },
})
