import { PinceauTheme, PropertyValue } from 'pinceau'

export const my = (value: ThemeTokens<'space'>) => ({
  marginTop: value,
  marginBottom: value,
})

export const mx = (value: ThemeTokens<'space'>) => ({
  marginLeft: value,
  marginRight: value,
})

export const surface = (value: keyof PinceauTheme['color']) => ({
  'color': `{color.${value}.900}`,
  'backgroundColor': `{color.${value}.200}`,
  '@dark': {
    color: `{color.${value}.200}`,
    backgroundColor: `{color.${value}.900}`,
  },
})

export const truncate = {
    "overflow": "hidden",
    "textOverflow": "ellipsis",
    "whiteSpace": "nowrap"
}

export const utils = { my, mx, surface, truncate } as const

export type GeneratedPinceauUtils = typeof utils

export default utils