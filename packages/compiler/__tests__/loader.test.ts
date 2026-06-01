import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadCompiler } from '../src/loader'

const CONFIG_SOURCE = `export default {
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  patterns: {
    stack: {
      properties: { gap: { type: 'token', value: 'spacing' } },
      defaultValues: { gap: '4' },
      transform(props) {
        return { display: 'flex', flexDirection: 'column', gap: props.gap }
      },
    },
  },
}
`

describe('loadCompiler', () => {
  let dir: string
  let result: Awaited<ReturnType<typeof loadCompiler>>

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-compiler-loader-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG_SOURCE)
    result = await loadCompiler({ cwd: dir }, { crossFile: false })
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('reports the resolved config path and dependencies', () => {
    expect(result.path).toBe(join(dir, 'panda.config.ts'))
    expect(result.dependencies).toContain('panda.config.ts')
  })

  it('embeds the user pattern transform in the generated pattern module', () => {
    const artifact = result.compiler.generateArtifact('patterns')
    const stack = artifact?.files.find((file) => file.path === 'patterns/stack.mjs')

    expect(stack?.code).toMatchInlineSnapshot(`
      "import { getPatternStyles, patternFns } from './runtime';

      const stackConfig = {transform(props) {
      	return {
      		display: "flex",
      		flexDirection: "column",
      		gap: props.gap
      	};
      },defaultValues:{gap:'4'}}

      export function stackRaw(styles) {
        const s = getPatternStyles(stackConfig, styles || {})
        return stackConfig.transform(s, patternFns)
      }

      export const stack = Object.assign(function stack(styles = {}) {
        return stackRaw(styles)
      }, { raw: stackRaw })"
    `)
  })
})
