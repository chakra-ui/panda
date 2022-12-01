import path from 'path'
import { build } from 'vite'
import { pandaPlugin } from './vite-plugin'

export type BuildOpts = {
  outDir: string
}

export const viteBuild = async ({ outDir }: BuildOpts) => {
  const previewPath = path.join(__dirname, '../app')
  const mode = 'production'

  await build({
    mode,
    root: previewPath,
    build: {
      outDir,
      emptyOutDir: true,
    },
    plugins: [pandaPlugin()],
  })
}
