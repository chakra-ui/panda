import { Colors } from './components/color-docs'

export type Shades = Record<string | number, string>
export type Colors = Record<string, string | Shades>

export type Config = {
  colors: Colors
  letterSpacings: Record<string, string>
  lineHeights: Record<string | number, string | number>
  fontWeights: Record<string, number>
  fontSizes: Record<string, string>
  sizes: Record<string, string>
}
