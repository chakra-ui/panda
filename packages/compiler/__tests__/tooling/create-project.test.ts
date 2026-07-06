import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createProjectFromConfig } from '../../src/tooling'

const CONFIG = `export default {
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  theme: {
    tokens: {
      colors: { red: { 500: { value: '#f00' } } },
    },
  },
}
`

describe('createProjectFromConfig', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-create-project-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG)
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('loads config, builds a compiler, and returns config metadata', async () => {
    const project = await createProjectFromConfig({ cwd: dir })

    expect(project.configPath).toBe(join(dir, 'panda.config.ts'))
    expect(project.dependencies.length).toBeGreaterThan(0)
    expect(project.designSystemDiagnostics).toEqual([])
    expect(project.compiler.spec().tokens.values['colors.red.500']).toBe('#f00')
  })
})
