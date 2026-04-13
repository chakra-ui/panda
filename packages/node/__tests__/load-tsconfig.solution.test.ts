import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import type { LoadConfigResult } from '@pandacss/types'
import { loadTsConfig } from '../src/load-tsconfig'

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'solution-mixed')

function mockConf(configPath: string): LoadConfigResult {
  return {
    path: configPath,
    config: {} as LoadConfigResult['config'],
    serialized: '',
    deserialize: () => ({}) as LoadConfigResult['config'],
    dependencies: [],
    hooks: {},
  }
}

describe('loadTsConfig + TypeScript project references', () => {
  test('resolves to referenced tsconfig.src.json for sources under src/', async () => {
    const pandaPath = path.join(fixtureDir, 'src', 'panda.config.ts')
    const cwd = fixtureDir
    const result = await loadTsConfig(mockConf(pandaPath), cwd)

    expect(result?.tsconfigFile).toBe(path.join(fixtureDir, 'tsconfig.src.json'))
    expect(result?.tsconfig?.compilerOptions).toBeDefined()
  })

  test('falls back to root tsconfig when file is not in any referenced project', async () => {
    const pandaPath = path.join(fixtureDir, 'panda.config.ts')
    const cwd = fixtureDir
    const result = await loadTsConfig(mockConf(pandaPath), cwd)

    expect(result?.tsconfigFile).toBe(path.join(fixtureDir, 'tsconfig.json'))
  })
})
