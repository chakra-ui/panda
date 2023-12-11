import type { AstroConfig, AstroIntegration } from 'astro'
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

async function getViteConfig(viteConfig: AstroConfig['vite'], options?: PandaOptions) {
  const postcssConfig = await getPostCssConfig(viteConfig.root, viteConfig.css?.postcss)
  const postcssOptions = postcssConfig?.options || {}

  const postcssPlugins = postcssConfig?.plugins?.slice() ?? []
  const pandaPostcss = interopDefault(require('@pandacss/postcss'))

  postcssPlugins.push(
    pandaPostcss({
      configPath: options?.configPath,
      cwd: options?.cwd,
    }),
  )
  return {
    css: {
      postcss: {
        options: postcssOptions,
        plugins: postcssPlugins,
      },
    },
  }
}

interface PandaOptions {
  /**
   * Inject panda's base styles into the Astro app.
   * @default true
   */
  applyBaseStyles?: boolean
  /**
   * Path to the Panda config file.
   */
  configPath?: string
  /**
   * The current working directory.
   */
  cwd?: string
}

export default function pandaIntegration(options?: PandaOptions): AstroIntegration {
  const applyBaseStyles = options?.applyBaseStyles ?? true

  return {
    name: '@pandacss/astro',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig, injectScript }) => {
        updateConfig({
          vite: (await getViteConfig(config.vite, options)) as any,
        })

        if (applyBaseStyles) {
          // Inject the Panda base import
          injectScript('page-ssr', `import '@pandacss/astro/base.css';`)
        }
      },
    },
  }
}
