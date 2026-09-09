import { pandacss } from '../../packages/bun/src/index.ts'

// `bun build` on the command line runs no plugins, so production builds go through the API.
const result = await Bun.build({
  entrypoints: ['./src/server.ts'],
  target: 'bun',
  outdir: './dist',
  plugins: [pandacss({ transform: true })],
})

if (!result.success) {
  console.error(result.logs.map(String).join('\n'))
  process.exit(1)
}
