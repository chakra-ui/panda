import { toPx } from '@pandacss/shared'
import { PandaExtension } from '../index'
import { getMarkdownCss, printTokenValue, svgToMarkdownLink } from '../tokens/utils'
import { renderTokenColorPreview } from '../tokens/render-token-color-preview'
import { renderFontSizePreview } from '../tokens/render-font-size-preview'
import { generateKeyframeCss } from '../tokens/generate-keyframe-css'

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
      // console.log(tokenMatch)

      if (tokenMatch.kind === 'token') {
        const { token } = tokenMatch
        const css = getMarkdownCss(ctx, { [tokenMatch.propName]: token.value }).raw

        const contents = [printTokenValue(token), { language: 'css', value: css }]
        const category = token.extensions.category

        if (category === 'colors') {
          const preview = await renderTokenColorPreview(ctx, token)
          if (preview) {
            contents.push(preview)
          }
        }

        if (category === 'fontSizes') {
          const px = toPx(token.value!)!
          contents.push(
            svgToMarkdownLink(
              await renderFontSizePreview(`${tokenMatch.propName} (${token.value})`, px, {
                width: Number(px) * 2,
                height: Number(px) * 1.75,
              }),
            ),
          )
        }

        if (category === 'animations' && token.extensions.prop) {
          const keyframeCss = generateKeyframeCss(ctx, token.extensions.prop)
          if (keyframeCss) {
            contents.push({ language: 'css', value: keyframeCss })
          }
        }

        return { contents }
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
    if (instanceMatch && instanceMatch.kind === 'styles') {
      // console.log({ instanceMatch })
      return { contents: getMarkdownCss(ctx, instanceMatch.styles).withCss }
    }
  })
}
