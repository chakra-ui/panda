import { ColorInformation } from 'vscode'
import type { PandaExtension } from '../index'
import { color2kToVsCodeColor } from '../tokens/color2k-to-vscode-color'

export function registerColorHints(extension: PandaExtension) {
  const { connection, documents, documentReady, parseSourceFile, getFileTokens } = extension

  connection.onDocumentColor(async (params) => {
    await documentReady('🐼 onDocumentColor')

    const doc = documents.get(params.textDocument.uri)
    if (!doc) {
      return []
    }

    const ctx = extension.getContext()
    if (!ctx) return []

    const parserResult = parseSourceFile(doc)
    if (!parserResult) {
      return []
    }

    const colors: ColorInformation[] = []

    getFileTokens(doc, parserResult, (match) => {
      if (match.kind === 'token' && match.token.extensions?.vscodeColor) {
        // Add 1 color hint for each condition
        if (match.token.extensions.conditions) {
          Object.entries(match.token.extensions.conditions).forEach(([_name, value]) => {
            const [tokenRef] = ctx.tokens.getReferences(value)
            const color = color2kToVsCodeColor(tokenRef.value)
            if (!color) return

            colors.push({ color, range: match.range as any })
          })

          return
        }

        colors.push({
          color: match.token.extensions.vscodeColor,
          range: match.range as any,
        })
      }
    })

    return colors
  })

  connection.onColorPresentation(async (_params) => {
    await documentReady('🐼 onColorPresentation')

    // const document = documents.get(params.textDocument.uri)
    // if (!document) return []

    return []

    // const color = document.getText(params.range)
    // const rgba = vscodeColorToRgba(params.color)
    // console.log({ colorName: color, rgba })

    // const alternativeFormats = convertColorFormats(color, rgba) // Function to convert color formats
    // console.log({ alternativeFormats })

    // const presentations: ColorPresentation[] = alternativeFormats.map((format) => {
    //   const textEdit: TextEdit = {
    //     range: params.range,
    //     newText: format,
    //   }

    //   return {
    //     label: format,
    //     textEdit,
    //   }
    // })

    // return presentations
  })
}

// const color2kToVsCodeColor = (value: string) => {
//   try {
//     const [red, green, blue, alpha] = parseToRgba(value)

//     const color = {
//       red: red / 255,
//       green: green / 255,
//       blue: blue / 255,
//       alpha,
//     }
//     return color
//   } catch (e) {
//     return
//   }
// }

// function vscodeColorToRgba(color: ColorPresentationParams['color']): string {
//   // Convert color values to the desired string representation
//   const { red, green, blue, alpha = 1 } = color
//   return `rgba(${red}, ${green}, ${blue}, ${alpha})`
// }

// function convertColorFormats(original: string, rgba: string): string[] {
//   const format = getColorFormat(original)

//   return [
//     original,
//     format?.includes('rgb') ? '' : rgba,
//     format?.includes('hsl')
//       ? ''
//       : tryCatch(
//           () => toHsla(rgba),
//           () => '',
//         )(rgba),
//   ].filter(Boolean)
// }

// const colorFormats = ['rgb(', 'rgba(', 'hsl(', 'hsla(']
// const getColorFormat = (color: string) => {
//   const colorFormat = colorFormats.find((format) => color.includes(format))
//   return colorFormat
// }
