import type { AstroConfig, AstroIntegration } from 'astro'
import autoprefixerPlugin from 'autoprefixer'
import type { CSSOptions, UserConfig } from 'vite'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

async function getPostCssConfig(root: UserConfig['root'], postcssInlineOptions: CSSOptions['postcss']) {
  let postcssConfig
  if (!(typeof postcssInlineOptions === 'object' && postcssInlineOptions !== null)) {
    const { default: postcssrc } = await import('postcss-load-config')
    const searchPath = typeof postcssInlineOptions === 'string' ? postcssInlineOptions : root!
    try {
      postcssConfig = await postcssrc({}, searchPath)
    } catch (e) {
      postcssConfig = null
    }
  }
  return postcssConfig
}

async function getViteConfig(viteConfig: AstroConfig['vite']) {
  const postcssConfig = await getPostCssConfig(viteConfig.root, viteConfig.css?.postcss)
  const postcssOptions = postcssConfig?.options || {}

  const postcssPlugins = postcssConfig?.plugins?.slice() ?? []

  postcssPlugins.push(interopDefault(require('@pandacss/postcss')))
  postcssPlugins.push(autoprefixerPlugin())

  return {
    css: {
      postcss: {
        options: postcssOptions,
        plugins: postcssPlugins,
      },
    },
  }
}

export default function pandaIntegration(): AstroIntegration {
  return {
    name: '@pandacss/astro',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig }) => {
        updateConfig({
          vite: await getViteConfig(config.vite),
        })
      },
    },
  }
}
