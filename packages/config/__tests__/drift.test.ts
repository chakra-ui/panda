import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { diffDrift, readDriftState, recordDrift, writeDriftState } from '../src/drift'

describe('drift', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  test('diffDrift reports changed versions only', () => {
    expect(diffDrift({ '@acme/ds': '1.0.0' }, [{ name: '@acme/ds', version: '1.1.0' }])).toEqual([
      { name: '@acme/ds', from: '1.0.0', to: '1.1.0' },
    ])
    expect(diffDrift({ '@acme/ds': '1.0.0' }, [{ name: '@acme/ds', version: '1.0.0' }])).toEqual([])
  })

  test('diffDrift treats an unseen package as new and skips versionless levels', () => {
    expect(diffDrift({}, [{ name: '@acme/ds', version: '2.0.0' }])).toEqual([{ name: '@acme/ds', to: '2.0.0' }])
    expect(diffDrift({}, [{ name: '@acme/ds' }])).toEqual([])
  })

  test('recordDrift persists state and reports the first-run receipt, then nothing on a stable rerun', () => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-drift-')))
    const chain = [{ name: '@acme/ds', version: '1.0.0' }]

    const first = recordDrift(dir, chain)
    expect(first).toEqual(['[designSystem] @acme/ds: (new) → 1.0.0'])
    expect(existsSync(join(dir, '.panda', 'design-system-state.json'))).toBe(true)
    expect(readDriftState(dir)).toEqual({ '@acme/ds': '1.0.0' })

    expect(recordDrift(dir, chain)).toEqual([])
    expect(recordDrift(dir, [{ name: '@acme/ds', version: '1.1.0' }])).toEqual([
      '[designSystem] @acme/ds: 1.0.0 → 1.1.0',
    ])
  })

  test('readDriftState returns empty when state is absent or malformed', () => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-drift-')))
    expect(readDriftState(dir)).toEqual({})
    writeDriftState(dir, [{ name: '@acme/ds', version: '1.0.0' }])
    expect(JSON.parse(readFileSync(join(dir, '.panda', 'design-system-state.json'), 'utf8'))).toEqual({
      '@acme/ds': '1.0.0',
    })
  })
})
