import { PandaExtension } from '../index'
import { getMarkdownCss, nodeRangeToVsCodeRange, printTokenValue } from '../tokens/utils'
import { renderTokenColorPreview } from '../tokens/render-token-color-preview'
import { generateKeyframeCss } from '../tokens/generate-keyframe-css'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'

export function registerHover(extension: PandaExtension) {
  const { connection, documentReady, documents, getClosestToken, getClosestInstance, getPandaSettings } = extension

  connection.onHover(
    tryCatch(async (params) => {
      const settings = await getPandaSettings()
      if (!settings['hovers.enabled']) return

      await documentReady('🐼 onHover')

      const ctx = extension.getContext()
      if (!ctx) return

      const doc = documents.get(params.textDocument.uri)
      if (!doc) {
        return
      }

      if (settings['hovers.tokens.enabled']) {
        // TODO recipe
        const tokenMatch = getClosestToken(doc, params.position)
        if (tokenMatch) {
          if (tokenMatch.kind === 'token') {
            const { token } = tokenMatch

            const contents = [printTokenValue(token, settings)] as any[]
            if (settings['tokens.css-preview.enabled']) {
              const css = getMarkdownCss(ctx, { [tokenMatch.propName]: token.value }, settings).raw
              contents.push({ language: 'css', value: css })
            }

            const category = token.extensions.category

            if (category === 'colors' && settings['hovers.semantic-colors.enabled']) {
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

          if (tokenMatch.kind === 'condition' && settings['hovers.conditions.enabled']) {
            const { condition, propValue, propName } = tokenMatch
            const css = getMarkdownCss(ctx, { [propName]: propValue }, settings).raw

            return {
              contents: [`🐼 \`${condition.value}\``, { language: 'css', value: css }],
              range: tokenMatch.range,
            }
          }
        }
      }

      if (settings['hovers.instances.enabled']) {
        const instanceMatch = getClosestInstance(doc, params.position)
        if (instanceMatch && instanceMatch.kind === 'styles') {
          const range = nodeRangeToVsCodeRange(instanceMatch.props.getRange())
          return { contents: getMarkdownCss(ctx, instanceMatch.styles, settings).withCss, range }
        }
      }
    }, onError),
  )
}
