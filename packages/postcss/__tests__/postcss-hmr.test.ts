import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import pandacss from '../src/index'

const INPUT = '@layer reset, base, tokens, recipes, utilities;'

describe('@pandacss/postcss HMR flow', () => {
  it('keeps prior atoms available when a known source file changes', async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-postcss-hmr-')))

    try {
      writeFileTree(cwd, {
        'panda.config.ts': `export default {
  outdir: 'styled-system',
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  exclude: [],
  jsxFramework: 'react',
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  utilities: {
    padding: { className: 'p' },
  },
}
`,
        'src/index.css': INPUT,
        'src/App.tsx': appSource('88px'),
      })

      const cssPath = join(cwd, 'src/index.css')
      const input = readFileSync(cssPath, 'utf8')
      const processor = postcss([pandacss({ cwd })])

      const first = await processor.process(input, { from: cssPath })
      writeFileSync(join(cwd, 'src/App.tsx'), appSource('44px'))
      const second = await processor.process(input, { from: cssPath })

      expect(first.css).toContain('88px')
      expect(first.css).not.toContain('44px')
      expect(second.css).toContain('88px')
      expect(second.css).toContain('44px')
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('keeps prior design-system fallback atoms when a source file changes', async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'panda-postcss-ds-hmr-')))

    try {
      writeFileTree(cwd, {
        'panda.config.ts': `export default {
  designSystem: '@acme/ds',
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
}
`,
        'src/index.css': INPUT,
        'src/App.tsx': '',
        'node_modules/@acme/ds/package.json': JSON.stringify({
          name: '@acme/ds',
          version: '1.0.0',
          exports: {
            './panda.lib.json': './dist/panda.lib.json',
            './preset': './dist/panda.preset.mjs',
          },
        }),
        'node_modules/@acme/ds/dist/panda.lib.json': JSON.stringify({
          schemaVersion: 1,
          name: '@acme/ds',
          version: '1.0.0',
          panda: '^2.0.0',
          preset: './panda.preset.mjs',
          buildInfo: './panda.buildinfo.json',
          files: ['./button.js'],
          importMap: {
            css: '@acme/ds/css',
            recipes: '@acme/ds/recipes',
            patterns: '@acme/ds/patterns',
            jsx: '@acme/ds/jsx',
            tokens: '@acme/ds/tokens',
          },
        }),
        'node_modules/@acme/ds/dist/panda.preset.mjs': `export default {
  utilities: {
    color: { className: 'c' },
  },
}
`,
        'node_modules/@acme/ds/dist/panda.buildinfo.json': JSON.stringify({
          schemaVersion: 999,
          modules: {},
          atoms: [],
        }),
        'node_modules/@acme/ds/dist/button.js': designSystemSource('rebeccapurple'),
      })

      const cssPath = join(cwd, 'src/index.css')
      const input = readFileSync(cssPath, 'utf8')
      const processor = postcss([pandacss({ cwd })])

      const first = await processor.process(input, { from: cssPath })
      writeFileSync(join(cwd, 'node_modules/@acme/ds/dist/button.js'), designSystemSource('dodgerblue'))
      const second = await processor.process(input, { from: cssPath })

      expect(first.css).toContain('rebeccapurple')
      expect(first.css).not.toContain('dodgerblue')
      expect(second.css).toContain('rebeccapurple')
      expect(second.css).toContain('dodgerblue')
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

function appSource(padding: string) {
  return `import { css } from '@panda/css'

export default function App() {
  return <div className={css({ padding: '${padding}' })}>hi</div>
}
`
}

function designSystemSource(color: string) {
  return `import { css } from '@acme/ds/css'

export const Button = css({ color: '${color}' })
`
}

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}
