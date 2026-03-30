import type { PandaPlugin } from '@pandacss/types'
import { optimizeLightCss } from './optimize-lightningcss'

export { optimizeLightCss }

export function pluginLightningcss(): PandaPlugin {
  return {
    name: '@pandacss/plugin-lightningcss',
    hooks: {
      'css:optimize': ({ css, minify, browserslist }) => {
        return optimizeLightCss(css, { minify, browserslist })
      },
    },
  }
}
