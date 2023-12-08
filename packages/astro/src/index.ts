import type { AstroIntegration } from 'astro'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const interopDefault = (obj: any) => (obj && obj.__esModule ? obj.default : obj)

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
      'astro:config:setup': async ({ updateConfig, injectScript }) => {
        const pandaPostcss = interopDefault(require('@pandacss/postcss'))

        updateConfig({
          vite: {
            css: {
              postcss: {
                plugins: [
                  pandaPostcss({
                    configPath: options?.configPath,
                    cwd: options?.cwd,
                  }),
                ],
              },
            },
          },
        })

        if (applyBaseStyles) {
          // Inject the Panda base import
          injectScript('page-ssr', `import '@pandacss/astro/base.css';`)
        }
      },
    },
  }
}
