import Fonts from 'open-props/src/fonts'

export const transformFonts = (_v: string) => {
  const v = `--font-${_v}-`
  return Object.fromEntries(
    Object.entries(Fonts)
      .filter(([key]) => key.startsWith(v))
      .map(([key, value]) => [key.replace(v, ''), { value }]),
  )
}

export const fontWeights = transformFonts('weight')
export const lineHeights = transformFonts('lineheight')
export const letterSpacings = transformFonts('letterspacing')
export const fontSizes = transformFonts('size')

const _fonts = ['sans', 'serif', 'mono']
export const fonts = Object.fromEntries(_fonts.map((v) => [v, { value: Fonts[`--font-${v}` as keyof typeof Fonts] }]))
