import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { resolveTsconfigForConfigBundle } from '../src/resolve-tsconfig'

const _dirname = dirname(fileURLToPath(import.meta.url))
const samples = (...parts: string[]) => path.resolve(_dirname, 'samples', ...parts)

describe('resolveTsconfigForConfigBundle', () => {
  test('uses root tsconfig when it defines paths', async () => {
    const cwd = samples('with-tsconfig-paths')
    const configFile = path.join(cwd, 'panda.config.ts')
    const result = await resolveTsconfigForConfigBundle(configFile, cwd)
    expect(result).toBe(path.join(cwd, 'tsconfig.json'))
  })

  test('falls back to referenced paths when owning project has none (Vite layout)', async () => {
    // panda.config.ts is owned by tsconfig.node.json (no paths); aliases live on tsconfig.app.json
    const cwd = samples('solution-tsconfig-paths')
    const configFile = path.join(cwd, 'panda.config.ts')
    const result = await resolveTsconfigForConfigBundle(configFile, cwd)
    expect(result).toBe(path.join(cwd, 'tsconfig.app.json'))
  })

  test('uses owning referenced project when config lives under src/', async () => {
    const cwd = samples('solution-tsconfig-paths-src')
    const configFile = path.join(cwd, 'src', 'panda.config.ts')
    const result = await resolveTsconfigForConfigBundle(configFile, cwd)
    expect(result).toBe(path.join(cwd, 'tsconfig.app.json'))
  })

  test('uses referenced tsconfig when paths come from extends', async () => {
    const cwd = samples('solution-tsconfig-paths-extends')
    const configFile = path.join(cwd, 'panda.config.ts')
    const result = await resolveTsconfigForConfigBundle(configFile, cwd)
    expect(result).toBe(path.join(cwd, 'tsconfig.app.json'))
  })

  test('prefers owning project paths over an earlier referenced project', async () => {
    // app is listed first with ~/*, but config is owned by node with @node/*
    const cwd = samples('solution-tsconfig-paths-multi')
    const configFile = path.join(cwd, 'panda.config.ts')
    const result = await resolveTsconfigForConfigBundle(configFile, cwd)
    expect(result).toBe(path.join(cwd, 'tsconfig.node.json'))
  })
})
