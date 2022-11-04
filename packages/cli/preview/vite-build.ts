import { build } from 'vite'
import { pandaPreviewPlugin } from './vite-dev'
import path from 'path'

export type BuildOpts = {
  outDir: string
}

export const viteBuild = async ({ outDir }: BuildOpts) => {
  const previewPath = path.join(__dirname, '../preview/app')
  const mode = 'production'

  await build({
    mode,
    root: previewPath,
    build: {
      outDir,
      emptyOutDir: true,
    },
    plugins: [pandaPreviewPlugin()],
  })
}
