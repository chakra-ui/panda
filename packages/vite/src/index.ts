import { createContext, extractFile, getBaseCss, loadConfig } from '@css-panda/node'
import glob from 'fast-glob'
import type { Plugin } from 'vite'

export async function pandaPlugin(): Promise<Plugin> {
  const conf = await loadConfig(process.cwd())
  const ctx = createContext(conf)

  const files = glob.sync(conf.config.include, { absolute: true })
  const filter = (id: string) => files.includes(id)

  const fileMap = new Map<string, string | undefined>([['base.css', getBaseCss(ctx)]])

  const isEmpty = () => fileMap.size === 1
  const compile = () => Array.from(fileMap.values()).join('')

  const compileFiles = async () => {
    await Promise.all([
      ...files.map(async (file) => {
        const result = await extractFile(ctx, file)
        fileMap.set(file, result?.css)
      }),
    ])
  }

  return {
    name: 'css-panda:extract:pre',
    enforce: 'pre',

    async load(id) {
      if (!filter(id)) return
      const result = await extractFile(ctx, id)
      fileMap.set(id, result?.css)
    },

    async transform(code, id) {
      if (!filter(id)) {
        return code
      }

      const result = await extractFile(ctx, id)
      fileMap.set(id, result?.css)

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
      const result = await extractFile(ctx, file)
      fileMap.set(file, result?.css)
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
