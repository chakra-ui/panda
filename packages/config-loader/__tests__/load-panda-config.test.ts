import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadPandaConfig } from '../src/load-panda-config'
import type { LoadedPandaConfig } from '../src/types'

const CONFIG_SOURCE = `export default {
  outdir: 'styled-system',
  patterns: {
    stack: {
      properties: { gap: { type: 'token', value: 'spacing' } },
      defaultValues: { gap: '4' },
      transform(props) {
        return { display: 'flex', flexDirection: 'column', gap: props.gap }
      },
    },
  },
  utilities: {
    size: {
      transform(value) {
        return { width: value, height: value }
      },
    },
  },
}
`

describe('loadPandaConfig', () => {
  let dir: string
  let result: LoadedPandaConfig

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'panda-config-loader-'))
    writeFileSync(join(dir, 'panda.config.ts'), CONFIG_SOURCE)
    result = await loadPandaConfig({ cwd: dir })
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  test('discovers the config file', () => {
    expect(result.path).toBe(join(dir, 'panda.config.ts'))
  })

  test('lowers the pattern to a callback ref + codegenSource', () => {
    expect(result.config.patterns).toMatchInlineSnapshot(`
      {
        "stack": {
          "codegenSource": "{transform(props) {
      	return {
      		display: "flex",
      		flexDirection: "column",
      		gap: props.gap
      	};
      },defaultValues:{gap:'4'}}",
          "defaultValues": {
            "gap": "4",
          },
          "properties": {
            "gap": {
              "type": "token",
              "value": "spacing",
            },
          },
          "transform": {
            "id": "patterns.stack.transform",
            "kind": "js-callback",
          },
        },
      }
    `)
  })

  test('lowers the utility transform to a callback ref', () => {
    expect(result.config.utilities).toMatchInlineSnapshot(`
      {
        "size": {
          "transform": {
            "id": "utilities.size.transform",
            "kind": "js-callback",
          },
        },
      }
    `)
  })

  test('collects the live transform functions, keyed by ref id', () => {
    const callbackIds = Object.fromEntries(
      Object.entries(result.callbacks).map(([kind, fns]) => [kind, Object.keys(fns ?? {})]),
    )
    expect(callbackIds).toMatchInlineSnapshot(`
      {
        "pattern.transform": [
          "patterns.stack.transform",
        ],
        "utility.transform": [
          "utilities.size.transform",
        ],
      }
    `)

    const patternTransform = result.callbacks['pattern.transform']?.['patterns.stack.transform'] as any
    const utilityTransform = result.callbacks['utility.transform']?.['utilities.size.transform'] as any
    expect(patternTransform({ gap: '6' })).toMatchInlineSnapshot(`
      {
        "display": "flex",
        "flexDirection": "column",
        "gap": "6",
      }
    `)
    expect(utilityTransform('40px')).toMatchInlineSnapshot(`
      {
        "height": "40px",
        "width": "40px",
      }
    `)
  })

  test('re-evaluating codegenSource yields the original transform behavior', () => {
    const source = (result.config.patterns as any).stack.codegenSource as string
    const evaluated = new Function(`return (${source})`)() as { transform: Function; defaultValues: any }
    expect(evaluated.transform({ gap: '8' })).toMatchInlineSnapshot(`
      {
        "display": "flex",
        "flexDirection": "column",
        "gap": "8",
      }
    `)
    expect(evaluated.defaultValues).toMatchInlineSnapshot(`
      {
        "gap": "4",
      }
    `)
  })

  test('reports the config file as a dependency', () => {
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "panda.config.ts",
      ]
    `)
  })
})

describe('loadPandaConfig cwd isolation', () => {
  // Two projects with byte-identical config content bundle to identical code,
  // so the in-memory `data:`-URL import resolves to the same cached ESM module.
  // The loader must still resolve each call's own `cwd` (no mutation leak).
  const SHARED_SOURCE = `export default { outdir: 'styled-system' }\n`
  const dirs: string[] = []

  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  })

  test('resolves each load against its own cwd', async () => {
    const a = mkdtempSync(join(tmpdir(), 'panda-config-a-'))
    const b = mkdtempSync(join(tmpdir(), 'panda-config-b-'))
    dirs.push(a, b)
    writeFileSync(join(a, 'panda.config.ts'), SHARED_SOURCE)
    writeFileSync(join(b, 'panda.config.ts'), SHARED_SOURCE)

    const first = await loadPandaConfig({ cwd: a })
    const second = await loadPandaConfig({ cwd: b })

    expect(first.config.cwd).toBe(a)
    expect(second.config.cwd).toBe(b)
  })
})
