import type { Plugin } from 'vite'
import { createContext, extractContent, loadConfig } from '@css-panda/node'
import glob from 'fast-glob'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function pandaPlugin(): Promise<Plugin> {
  const conf = await loadConfig(process.cwd())
  const ctx = createContext(conf)

  const dsPath = join(ctx.paths.ds, 'index.css')
  const dsCss = existsSync(dsPath) ? await readFile(dsPath, 'utf-8') : ''

  const resetPath = join(ctx.paths.asset, 'reset.css')
  const resetCss = existsSync(resetPath) ? await readFile(resetPath, 'utf-8') : ''

  const files = glob.sync(conf.config.include, { absolute: true })
  const filter = (id: string) => files.includes(id)

  const fileMap = new Map<string, string | undefined>([
    ['tokens.css', dsCss],
    ['reset.css', resetCss],
  ])

  const isEmpty = () => fileMap.size === 2
  const compile = () => Array.from(fileMap.values()).join('')

  const compileFiles = async () => {
    await Promise.all([
      ...files.map(async (file) => {
        const result = await extractContent(ctx, file)
        fileMap.set(file, result)
      }),
    ])
  }

  return {
    name: 'css-panda:extract:pre',
    enforce: 'pre',

    async load(id) {
      if (!filter(id)) return
      fileMap.set(id, await extractContent(ctx, id))
    },

    async transform(code, id) {
      if (!filter(id)) return code

      fileMap.set(id, await extractContent(ctx, id))

      return `${code}
      if (import.meta.hot) {
        import.meta.hot.on('panda:style-update', (data) => {
          const style = document.getElementById("css:panda")
          style.innerHTML = style.innerHTML + data
          setTimeout(() => {
            style.innerHTML = data
          }, 100)
        })
      }`
    },

    async handleHotUpdate(hmrContext) {
      const { file, server } = hmrContext
      if (!filter(file)) return
      const css = await extractContent(ctx, file)
      fileMap.set(file, css)
      server.ws.send({
        type: 'custom',
        event: 'panda:style-update',
        data: compile(),
      })
    },

    transformIndexHtml: {
      enforce: 'pre',
      async transform() {
        let css = compile()

        if (isEmpty()) {
          await compileFiles()
          css = compile()
        }

        return [
          {
            tag: 'style',
            attrs: { id: 'css:panda', type: 'text/css' },
            children: css,
            injectTo: 'head',
          },
        ]
      },
    },
  }
}
