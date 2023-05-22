import { Color } from 'vscode-languageserver/node'
import * as culori from 'culori'

export function culoriColorToVscodeColor (color: culori.Color): Color {
  const toRgb = culori.converter('rgb')
  const rgb = toRgb(color)
  return { red: rgb.r, green: rgb.g, blue: rgb.b, alpha: rgb.alpha ?? 1 }
}
