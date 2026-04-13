import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, test } from 'vitest'
import { parseTsconfig } from 'get-tsconfig'
import { isSourceFileIncludedInTsconfig } from '../src/tsconfig-utils'

describe('isSourceFileIncludedInTsconfig', () => {
  test('matches src/foo.ts against include "${configDir}/src/*"', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'panda-tsconfig-match-'))
    try {
      writeFileSync(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify({
          files: [],
          references: [{ path: './tsconfig.src.json' }],
        }),
      )
      writeFileSync(
        path.join(dir, 'tsconfig.src.json'),
        JSON.stringify({
          compilerOptions: {
            module: 'ES2022',
            moduleResolution: 'bundler',
            skipLibCheck: true,
          },
          include: ['${configDir}/src/*'],
        }),
      )
      const src = path.join(dir, 'src')
      mkdirSync(src)
      writeFileSync(path.join(src, 'foo.ts'), 'export const x = 1\n')

      const childPath = path.join(dir, 'tsconfig.src.json')
      const parsed = parseTsconfig(childPath)
      const foo = path.join(dir, 'src', 'foo.ts')
      expect(isSourceFileIncludedInTsconfig(foo, childPath, parsed)).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
