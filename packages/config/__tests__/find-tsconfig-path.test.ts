import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, test } from 'vitest'
import { findClosestTsconfig, resolveDirectTsconfigJson } from '../src/tsconfig-utils'

describe('findClosestTsconfig', () => {
  test('finds tsconfig in the same directory as the config file', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'panda-tsconfig-'))
    try {
      const tsconfigPath = path.join(dir, 'tsconfig.json')
      writeFileSync(tsconfigPath, JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }))
      const pandaConfig = path.join(dir, 'panda.config.ts')
      writeFileSync(pandaConfig, 'export default {}')

      await expect(findClosestTsconfig(pandaConfig, dir)).resolves.toBe(tsconfigPath)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('walks up to a parent directory', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'panda-tsconfig-'))
    try {
      const tsconfigPath = path.join(root, 'tsconfig.json')
      writeFileSync(tsconfigPath, '{}')
      const sub = path.join(root, 'packages', 'app')
      mkdirSync(sub, { recursive: true })
      const pandaConfig = path.join(sub, 'panda.config.ts')
      writeFileSync(pandaConfig, 'export default {}')

      await expect(findClosestTsconfig(pandaConfig, root)).resolves.toBe(tsconfigPath)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('does not search above root (matches tsconfck root option)', async () => {
    const outer = mkdtempSync(path.join(tmpdir(), 'panda-tsconfig-'))
    try {
      writeFileSync(path.join(outer, 'tsconfig.json'), '{}')
      const inner = path.join(outer, 'nested', 'pkg')
      mkdirSync(inner, { recursive: true })
      const pandaConfig = path.join(inner, 'panda.config.ts')
      writeFileSync(pandaConfig, 'export default {}')

      await expect(findClosestTsconfig(pandaConfig, inner)).resolves.toBeNull()
    } finally {
      rmSync(outer, { recursive: true, force: true })
    }
  })
})

describe('resolveDirectTsconfigJson', () => {
  test('resolves when conf.path is a tsconfig.json file', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'panda-tsconfig-'))
    try {
      const tsconfigPath = path.join(dir, 'tsconfig.json')
      writeFileSync(tsconfigPath, '{}')
      await expect(resolveDirectTsconfigJson(tsconfigPath)).resolves.toBe(path.resolve(tsconfigPath))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('returns null for non-json paths', async () => {
    await expect(resolveDirectTsconfigJson('/tmp/foo.ts')).resolves.toBeNull()
  })

  test('throws when path exists but is not a file (tsconfck resolveTSConfigJson parity)', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'panda-tsconfig-'))
    try {
      const tsconfigDir = path.join(dir, 'tsconfig.json')
      mkdirSync(tsconfigDir)
      await expect(resolveDirectTsconfigJson(tsconfigDir)).rejects.toThrow(/exists but is not a regular file/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
