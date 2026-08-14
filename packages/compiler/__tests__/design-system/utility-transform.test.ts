import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createNodeDriver } from '../../src'

// A library utility with a JS `transform` ships its function in `preset.mjs`,
// so the consumer can run it. Its build info carries the carrier atom only, and
// the consumer recomputes the styles when hydrating.
const PRESET = `export default {
  theme: { tokens: { sizes: { 4: { value: '1rem' } } } },
  utilities: {
    boxSize: {
      className: 'size',
      values: 'sizes',
      transform(value) {
        return { width: value, height: value }
      },
    },
  },
}`

/** Carrier atom for `boxSize: '4'`, the shape `panda lib` writes. */
const BUILD_INFO = {
  schemaVersion: 5,
  panda: '^2.0.0',
  configFingerprint: 'cfg1-test',
  strings: ['boxSize', '4'],
  atoms: [{ p: 0, v: 1 }],
  modules: { './button.js': { atoms: [0] } },
}

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

const json = (value: unknown) => JSON.stringify(value, null, 2)

function createFixture(options: { preset?: string; buildInfo?: unknown } = {}): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-transform-')))
  writeFileTree(root, {
    'panda.config.ts': `export default { designSystem: '@acme/ds', include: ['**/*.tsx'] }`,
    'App.tsx': "import { Button } from '@acme/ds'\nexport const App = () => <Button />",
    'node_modules/@acme/ds/package.json': json({
      name: '@acme/ds',
      version: '1.0.0',
      exports: { '.': './dist/index.js', './panda/*': './dist/panda/*' },
    }),
    'node_modules/@acme/ds/dist/index.js': "export { Button } from './button.js'",
    // No `css()` call in the shipped source: the boxSize rule can only come
    // from hydrating the build info, never from re-extraction.
    'node_modules/@acme/ds/dist/button.js': 'export const Button = () => null',
    'node_modules/@acme/ds/dist/panda/lib.json': json({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      importMap: { css: '@acme/ds/css' },
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': options.preset ?? PRESET,
    'node_modules/@acme/ds/dist/panda/buildinfo.json': json(options.buildInfo ?? BUILD_INFO),
  })
  return root
}

describe('design system utility transform', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  it('emits a transform result that nests a condition', async () => {
    cwd = createFixture({
      preset: `export default {
  conditions: { hover: '&:hover' },
  utilities: {
    debug: {
      className: 'debug',
      transform() {
        return { _hover: { border: '2px solid blue' } }
      },
    },
  },
}`,
      buildInfo: {
        schemaVersion: 5,
        panda: '^2.0.0',
        configFingerprint: 'cfg1-test',
        strings: ['debug'],
        atoms: [{ p: 0, v: true }],
        modules: { './button.js': { atoms: [0] } },
      },
    })
    const css = (await createNodeDriver({ cwd })).cssgen().css

    expect(css).toContain('border: 2px solid blue')
    expect(css).toContain(':hover')
  })

  it('emits the library transform result for a hydrated atom', async () => {
    cwd = createFixture()
    const css = (await createNodeDriver({ cwd })).cssgen().css

    expect(css).toContain('width: var(--sizes-4)')
    expect(css).toContain('height: var(--sizes-4)')
    expect(css).not.toContain('box-size')
  })
})
