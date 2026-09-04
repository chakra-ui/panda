import { pandacss } from '../../packages/bun/src/index.ts'

// Library build: one JS entry plus the stylesheet, with css() calls rewritten to class strings.
const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'browser',
  plugins: [pandacss({ transform: true })],
})

if (!result.success) {
  console.error(result.logs.map(String).join('\n'))
  process.exit(1)
}
