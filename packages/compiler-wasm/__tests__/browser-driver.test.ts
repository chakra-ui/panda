import { createConfigSnapshot } from '@pandacss/config'
import { describe, expect, it } from 'vitest'
import { createBrowserDriver } from '../src'

const snapshot = createConfigSnapshot({
  cwd: '/proj',
  outdir: 'styled-system',
  include: ['**/*.tsx'],
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  patterns: {
    stack: {
      properties: { gap: {} },
      defaultValues: { gap: '4' },
      transform(props: Record<string, any>) {
        return { display: 'flex', gap: props.gap }
      },
    },
  },
} as any)

describe('createBrowserDriver', () => {
  it('scans staged in-memory sources and compiles', async () => {
    const driver = await createBrowserDriver({
      snapshot,
      sources: { '/proj/App.tsx': "import { css } from '@panda/css'; css({ color: 'blue' })" },
    })

    expect(driver.scan()).toMatchInlineSnapshot(`
      [
        "/proj/App.tsx",
      ]
    `)
    expect(driver.parseFiles()).toMatchInlineSnapshot(`
      [
        {
          "path": "/proj/App.tsx",
          "cssCalls": 1,
          "cvaCalls": 0,
          "svaCalls": 0,
          "jsxUsages": 0,
          "diagnostics": [],
        },
      ]
    `)
    expect(driver.cssgen().css).toContain('blue')
  })

  it('embeds the user pattern transform in generated artifacts', async () => {
    const driver = await createBrowserDriver({ snapshot })
    const patterns = driver.artifacts().find((artifact) => artifact.id === 'patterns')
    const stack = patterns?.files.find((file) => file.path === 'patterns/stack.mjs')

    expect(stack?.code).toContain('display: "flex"')
    expect(stack?.code).not.toContain('(s) => s')
  })

  it('routes a single in-memory change through applyChange', async () => {
    const driver = await createBrowserDriver({ snapshot })

    const applied = driver.applyChange({
      path: '/proj/B.tsx',
      kind: 'add',
      content: "import { css } from '@panda/css'; css({ color: 'green' })",
    })

    expect(applied).toMatchInlineSnapshot(`true`)
    expect(driver.cssgen().css).toContain('green')
  })

  it('writes stylesheet output to the compiler memory fs', async () => {
    const driver = await createBrowserDriver({
      snapshot,
      sources: { '/proj/App.tsx': "import { css } from '@panda/css'; css({ color: 'blue' })" },
    })
    driver.parseFiles()

    const result = driver.writeCss('/proj/styled-system/styles.css')

    expect(result.css).toContain('blue')
    expect(driver.compiler.fs?.readFile(result.path)).toBe(result.css)
  })

  it('writes split stylesheet output to the compiler memory fs', async () => {
    const driver = await createBrowserDriver({
      snapshot,
      sources: { '/proj/App.tsx': "import { css } from '@panda/css'; css({ color: 'blue' })" },
    })
    driver.parseFiles()

    const result = driver.writeSplitCss()

    expect(result.root).toBe('/proj/styled-system')
    expect(result.paths).toContain('/proj/styled-system/styles.css')
    expect(result.paths).toContain('/proj/styled-system/styles/utilities.css')
    expect(driver.compiler.fs?.readFile('/proj/styled-system/styles.css')).toContain(
      "@import './styles/utilities.css';",
    )
    expect(driver.compiler.fs?.readFile('/proj/styled-system/styles/utilities.css')).toContain('blue')
  })

  it('resolves the configured outdir through the driver host', async () => {
    const driver = await createBrowserDriver({ snapshot })

    expect(driver.getOutdir()).toBe('/proj/styled-system')
    expect(driver.getOutdir('system')).toBe('/proj/system')
    expect(driver.getOutdir('/tmp/panda-system')).toBe('/tmp/panda-system')
    expect(driver.paths('system')).toEqual({
      root: '/proj/system',
      styleFile: '/proj/system/styles.css',
      stylesDir: '/proj/system/styles',
    })
  })
})
