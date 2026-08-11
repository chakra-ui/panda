import { fileURLToPath } from 'node:url'
import { build, type Rollup } from 'vite'
import { describe, expect, test } from 'vitest'

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/tree-shaking/${name}.js`, import.meta.url))

async function bundle(name: string) {
  const result = (await build({
    logLevel: 'silent',
    // No panda plugin: this measures what the bundler can drop from the
    // generated runtime, not what the transform folds away ahead of it.
    configFile: false,
    build: {
      write: false,
      minify: false,
      lib: { entry: fixture(name), formats: ['es'], fileName: name },
    },
  })) as Rollup.RollupOutput[]

  return result[0].output[0].code
}

describe('styled-system tree shaking', () => {
  test('a bundle that only merges style objects drops the serializer', async () => {
    const code = await bundle('only-merge')

    // `serializeCss` walks the style object and hashes each path — the most
    // expensive thing in `css/index`, and dead weight for a bundle that never
    // asks for a class name.
    expect(code).not.toContain('serializeCss')
    // what mergeCss genuinely needs stays: the merge itself and the
    // normalizer, which is why `toHash` survives as a context method
    expect(code).toContain('function mergeProps')
    expect(code).toContain('function normalizeStyleObject')
  })

  test('a bundle that calls css keeps the serializer', async () => {
    const code = await bundle('uses-css')

    expect(code).toContain('serializeCss')
    expect(code).toContain('function walkObject')
  })

  test('dropping the serializer is worth real bytes', async () => {
    const [onlyMerge, usesCss] = await Promise.all([bundle('only-merge'), bundle('uses-css')])

    expect(usesCss.length).toBeGreaterThan(onlyMerge.length + 2000)
  })
})
