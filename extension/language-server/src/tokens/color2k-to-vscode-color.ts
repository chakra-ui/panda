import { type ColorPresentationParams } from 'vscode-languageserver'
import { parseToRgba } from 'color2k'

export const color2kToVsCodeColor = (value: string) => {
  try {
    const [red, green, blue, alpha] = parseToRgba(value)

    const color = {
      red: red / 255,
      green: green / 255,
      blue: blue / 255,
      alpha,
    }
    return color as ColorPresentationParams['color']
  } catch (e) {
    return
  }
}
