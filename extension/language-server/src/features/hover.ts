import { PandaExtension } from '../index'
import { getMarkdownCss, getNodeRange, nodeRangeToVsCodeRange, printTokenValue } from '../tokens/utils'
import { renderTokenColorPreview } from '../tokens/render-token-color-preview'
import { generateKeyframeCss } from '../tokens/generate-keyframe-css'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'

export function registerHover(extension: PandaExtension) {
  const { connection, documentReady, documents, getClosestToken, getClosestInstance } = extension

  connection.onHover(
    tryCatch(async (params) => {
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

          if (category === 'animations' && token.extensions.prop) {
            const keyframeCss = generateKeyframeCss(ctx, token.extensions.prop)
            if (keyframeCss) {
              contents.push({ language: 'css', value: keyframeCss })
            }
          }

          return { contents, range: tokenMatch.range }
        }

        if (tokenMatch.kind === 'condition') {
          const { condition, propValue, propName } = tokenMatch
          const css = getMarkdownCss(ctx, { [propName]: propValue }).raw

          return {
            contents: [`🐼 \`${condition.value}\``, { language: 'css', value: css }],
            range: tokenMatch.range,
          }
        }
      }

      const instanceMatch = getClosestInstance(doc, params.position)
      if (instanceMatch && instanceMatch.kind === 'styles') {
        const range = nodeRangeToVsCodeRange(getNodeRange(instanceMatch.props.getNode()))
        return { contents: getMarkdownCss(ctx, instanceMatch.styles).withCss, range }
      }
    }, onError),
  )
}
