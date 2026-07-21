import type { SemanticTokens } from '@pandacss/types'
import { DEFAULT_COLOR_PALETTE, DEFAULT_RECIPE_NAME } from './constants'

type CreateSemanticTokensOptions = {
  prefix?: string
  colorPalette?: string
}

function role(palette: string, light: string, dark: string) {
  return {
    value: {
      base: `{colors.${palette}.${light}}`,
      _dark: `{colors.${palette}.${dark}}`,
    },
  }
}

export function createSemanticTokens(options: CreateSemanticTokensOptions = {}): SemanticTokens {
  const prefix = options.prefix ?? DEFAULT_RECIPE_NAME
  const palette = options.colorPalette ?? DEFAULT_COLOR_PALETTE

  return {
    colors: {
      [prefix]: {
        body: role(palette, '700', '300'),
        heading: role(palette, '900', '100'),
        lead: role(palette, '600', '400'),
        link: role(palette, '900', '100'),
        linkDecoration: role(palette, '300', '600'),
        bold: role(palette, '900', '100'),
        counter: role(palette, '500', '400'),
        bullet: role(palette, '300', '600'),
        hrBorder: role(palette, '200', '700'),
        quote: role(palette, '900', '200'),
        quoteBorder: role(palette, '200', '700'),
        caption: role(palette, '500', '400'),
        kbd: role(palette, '900', '100'),
        code: role(palette, '900', '100'),
        preCode: role(palette, '200', '200'),
        preBg: role(palette, '800', '900'),
        thBorder: role(palette, '300', '600'),
        tdBorder: role(palette, '200', '700'),
      },
    },
  }
}
