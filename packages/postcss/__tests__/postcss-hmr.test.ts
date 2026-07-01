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
})

function appSource(padding: string) {
  return `import { css } from '@panda/css'

export default function App() {
  return <div className={css({ padding: '${padding}' })}>hi</div>
}
`
}

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}
