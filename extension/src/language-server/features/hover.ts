import { toPx } from '@pandacss/shared'
import { PandaExtension } from '../index'
import {
  getMarkdownCss,
  previewColor,
  printTokenValue,
  renderFontSizePreview,
  svgToMarkdownLink,
} from '../tokens/utils'

// TODO inline hints for px -> rem
// TODO diagnostic for invalid token(xxx)
// TODO recipes
// TODO keyframes on hover animation
// TODO definitions
// TODO inline hints
// TODO references
// TODO configuration
// TODO render multiple color hints for semantic tokens (based on conditions)
// TODO render semantic tokens color preview square on hover
// TODO semantic tokens different autocomplete
// TODO handle config changes (reload context)

export function registerHover(extension: PandaExtension) {
  const { connection, documentReady, documents, getClosestToken, getClosestInstance } = extension

  connection.onHover(async (params) => {
    await documentReady('🐼 onHover')

    const ctx = extension.getContext()
    if (!ctx) return

    const doc = documents.get(params.textDocument.uri)
    if (!doc) {
      return
    }

    // TODO recipe
    const tokenMatch = getClosestToken(doc, params.position)
    if (tokenMatch) {
      console.log({ tokenMatch })

      if (tokenMatch.kind === 'token') {
        const { token } = tokenMatch
        const css = getMarkdownCss(ctx, { [tokenMatch.propName]: token.value }).raw

        // const withColor =
        //   token.extensions.category === 'colors'
        //     ? [
        //         // previewColor(token.value),
        //         svgToMarkdownLink(svg),
        //         // `![](data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIxMjIuNTg3IDg2LjM4MSAyMDIuNzkyIDc5LjU4NSIgd2lkdGg9IjIwMi43OTIiIGhlaWdodD0iNzkuNTg1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDx0ZXh0IHN0eWxlPSJ3aGl0ZS1zcGFjZTogcHJlOyBmaWxsOiByZ2IoNTEsIDUxLCA1MSk7IGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiAxNi4xcHg7IiB4PSIxMzIuMjM0IiB5PSIxMTIuMjA0Ij5wcmV2aWV3PHRzcGFuIHg9IjEzMi4yMzM5OTM1MzAyNzM0NCIgZHk9IjFlbSI+4oCLPC90c3Bhbj48L3RleHQ+CiAgPHRleHQgc3R5bGU9ImZpbGw6IHJnYig1MSwgNTEsIDUxKTsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDY0cHg7IHdoaXRlLXNwYWNlOiBwcmU7IiB4PSIxNDAuMDk4IiB5PSIxNDYuMDM2Ij5odWdlPC90ZXh0PgogIDxyZWN0IHg9IjIyNi44OCIgeT0iOTMuMjgxIiB3aWR0aD0iNzUuMzc3IiBoZWlnaHQ9IjE0Ljg2NCIgc3R5bGU9ImZpbGw6IHJnYigyMTYsIDIxNiwgMjE2KTsgc3Ryb2tlOiByZ2IoMCwgMCwgMCk7Ii8+CiAgPHJlY3QgeD0iMTI5LjQyMiIgeT0iMTU0LjM2MiIgd2lkdGg9IjQ1LjkxOCIgaGVpZ2h0PSI3Ljg0NCIgc3R5bGU9InN0cm9rZTogcmdiKDAsIDAsIDApOyBmaWxsOiByZ2IoMjQzLCAxOCwgMTgpOyBwYWludC1vcmRlcjogZmlsbDsgZmlsbC1vcGFjaXR5OiAwLjQ5OyIvPgo8L3N2Zz4=)`,
        //       ]
        //     : []

        const contents = [printTokenValue(token), { language: 'css', value: css }]

        if (token.extensions.category === 'colors') {
          contents.push(previewColor(token.value))
        }

        if (token.extensions.category === 'fontSizes') {
          const px = toPx(token.value!)!
          contents.push(
            svgToMarkdownLink(
              await renderFontSizePreview(`${tokenMatch.propName} (${token.value})`, px, {
                width: Number(px) * 2,
                height: Number(px) * 1.5,
              }),
            ),
          )
        }

        return {
          contents,
        }
      }

      if (tokenMatch.kind === 'condition') {
        const { condition, propValue, propName } = tokenMatch
        const css = getMarkdownCss(ctx, { [propName]: propValue }).raw
        // console.log(match)
        return {
          contents: [`🐼 \`${condition.value}\``, { language: 'css', value: css }],
        }
      }
    }

    const instanceMatch = getClosestInstance(doc, params.position)
    if (instanceMatch) {
      // console.log({ instanceMatch })
      return {
        contents: getMarkdownCss(ctx, instanceMatch.styles).withCss,
      }
    }
  })
}
