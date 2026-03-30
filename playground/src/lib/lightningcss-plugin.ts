import type { PandaPlugin } from '@pandacss/types'

/**
 * Playground-specific lightningcss plugin that uses the WASM build.
 * The WASM module is initialized in providers.tsx before this runs.
 *
 * Unlike the Node.js plugin, this doesn't use the `browserslist` package
 * (which requires Node.js APIs). Instead it uses the static browserslist
 * defined in the playground's package.json via lightningcss-wasm's
 * browserslistToTargets.
 */
export function pluginLightningcssWasm(): PandaPlugin {
  return {
    name: 'playground-lightningcss-wasm',
    hooks: {
      'css:optimize': ({ css, minify }) => {
        try {
          const { Features, transform } = require('lightningcss-wasm')

          const encoder = new TextEncoder()
          const decoder = new TextDecoder()

          const result = transform({
            code: encoder.encode(css),
            minify: minify ?? false,
            sourceMap: false,
            filename: 'styles.css',
            include: Features.Nesting | Features.MediaRangeSyntax,
            errorRecovery: true,
          })

          return decoder.decode(result.code)
        } catch {
          // Fall through to PostCSS if wasm isn't available
          return undefined
        }
      },
    },
  }
}
