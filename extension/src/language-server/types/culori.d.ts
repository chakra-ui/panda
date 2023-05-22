declare module 'culori' {
  export interface RgbColor {
    mode: 'rgb'
    r: number
    g: number
    b: number
    alpha?: number
  }
  export interface HslColor {
    mode: 'hsl'
    h: number
    s: number
    b: number
    alpha?: number
  }
  export type Color = RgbColor | HslColor
  export function parse(color: string): Color | undefined
  export function formatRgb(color: Color | string): string
  export function formatHsl(color: Color | string): string
  export function formatHex(color: Color | string): string
  export function formatHex8(color: Color | string): string

  type Mode = 'rgb' | 'hsl'

  export function converter<T extends Mode>(
    mode: T
  ): (color: Color | string) => T extends 'rgb' ? RgbColor : T extends 'hsl' ? HslColor : never
}