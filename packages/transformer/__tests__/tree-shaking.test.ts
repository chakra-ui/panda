import { posix } from 'node:path'
import { createCompiler } from '@pandacss/compiler'
import { rolldown } from 'rolldown'
import { describe, expect, it } from 'vitest'
import {
  createSourceTransformer,
  getInternalCssRuntimeSource,
  INTERNAL_CSS_IMPORT,
  INTERNAL_CSS_RESOLVED_ID,
} from '../src'

describe('transformed source tree shaking', () => {
  it('drops unused transformed recipe factories and their runtime', async () => {
    const compiler = createCompiler({
      cwd: '/virtual',
      outdir: 'styled-system',
      outExtension: 'mjs',
      jsxFramework: 'react',
      jsxFactory: 'styled',
      importMap: {
        css: ['@panda/css'],
        recipe: ['@panda/recipes'],
        pattern: ['@panda/patterns'],
        jsx: ['@panda/jsx'],
        tokens: ['@panda/tokens'],
      },
      utilities: {
        backgroundColor: { className: 'bg', shorthand: 'bg' },
        borderRadius: { className: 'bdr' },
      },
    })
    const transformed = createSourceTransformer(compiler).transformSource({
      path: 'src/app.tsx',
      source: [
        "import { styled } from '@panda/jsx'",
        "import { cva, sva } from '@panda/css'",
        "const Card = styled('article', { base: { bg: 'red', borderRadius: 'xl' } })",
        "const button = cva({ base: { bg: 'red' } })",
        "const slots = sva({ slots: ['root'], base: { root: { bg: 'red' } } })",
        'export function App() { return <Card /> }',
      ].join('\n'),
    })

    const modules = new Map<string, string>([['/entry.tsx', transformed.code]])
    for (const artifact of compiler.generateArtifacts()) {
      for (const file of artifact.files) {
        if (file.path.endsWith('.mjs')) modules.set(posix.join('/styled-system', file.path), file.code)
      }
    }
    modules.set(INTERNAL_CSS_RESOLVED_ID, getInternalCssRuntimeSource())

    const build = await rolldown({
      input: '/entry.tsx',
      external: ['react', 'react/jsx-runtime'],
      plugins: [
        {
          name: 'panda-tree-shaking-fixture',
          resolveId(source, importer) {
            if (modules.has(source)) return source
            if (source === '@panda/jsx') return '/styled-system/jsx/index.mjs'
            if (source === INTERNAL_CSS_IMPORT) return INTERNAL_CSS_RESOLVED_ID
            if (!importer || !source.startsWith('.')) return null

            const resolved = posix.normalize(posix.join(posix.dirname(importer), source))
            for (const candidate of [resolved, `${resolved}.mjs`]) {
              if (modules.has(candidate)) return candidate
            }
            return null
          },
          load(id) {
            return modules.get(id) ?? null
          },
        },
      ],
    })

    try {
      const { output } = await build.generate({ format: 'esm', codeSplitting: false })
      const chunk = output.find((item) => item.type === 'chunk')
      expect(chunk?.type).toBe('chunk')
      if (!chunk || chunk.type !== 'chunk') return

      expect(chunk.code).toContain('function App()')
      expect(chunk.code).not.toContain('__cva__')
      expect(chunk.code).not.toContain('splitVariantProps')
    } finally {
      await build.close()
    }
  })
})
