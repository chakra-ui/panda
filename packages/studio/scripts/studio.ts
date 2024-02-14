import { colors, logger } from '@pandacss/logger'
import { join } from 'node:path'

export interface BuildOpts {
  outDir: string
  configPath: string
  port?: string
  host?: boolean
  base?: string
}

const appPath = join(__dirname, '..')

export async function buildStudio({ outDir, configPath, base }: BuildOpts) {
  const astro = await import('astro')
  const { default: react } = await import('@astrojs/react')
  const { default: studio } = await import('@pandacss/astro-plugin-studio')

  try {
    process.env.PUBLIC_CONFIG_PATH = configPath
    await astro.build({
      outDir,
      root: appPath,
      integrations: [react(), studio()],
      devToolbar: { enabled: false },
      base,
    })
  } catch (error) {
    console.log(error)
  }
}

export async function serveStudio({ configPath, port, host, outDir, base }: BuildOpts) {
  const astro = await import('astro')
  const { default: react } = await import('@astrojs/react')
  const { default: studio } = await import('@pandacss/astro-plugin-studio')

  try {
    process.env.PUBLIC_CONFIG_PATH = configPath
    await astro.dev({
      outDir,
      root: appPath,
      integrations: [react(), studio()],
      server: {
        port: port ? Number(port) : undefined,
        host,
      },
      base,
      devToolbar: { enabled: false },
    })
  } catch (error) {
    console.log(error)
  }
}

export async function previewStudio({ outDir, base }: BuildOpts) {
  const astro = await import('astro')
  const { default: react } = await import('@astrojs/react')
  const { default: studio } = await import('@pandacss/astro-plugin-studio')

  try {
    await astro.preview({
      outDir,
      root: appPath,
      integrations: [react(), studio()],
      devToolbar: { enabled: false },
      base,
    })
  } catch (error) {
    console.log(error)
  }
}

export function printUrls(options: { host: string; port: number; https: boolean }) {
  const protocol = options.https ? 'https' : 'http'
  const localUrl = `${protocol}://${options.host}:${options.port}`
  logger.log(`  ${colors.cyan('➜')}  ${colors.bold('Previewed at')}: ${colors.reset(colors.green(localUrl))} `)
}
