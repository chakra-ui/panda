import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, test } from 'vitest'

import { getExternalPackages } from '../src/external-import-map'

const root = mkdtempSync(join(tmpdir(), 'panda-import-map-'))
const cwd = join(root, 'apps/web')
const ds = join(root, 'packages/ds')

mkdirSync(ds, { recursive: true })
mkdirSync(join(cwd, 'node_modules/@acme'), { recursive: true })
mkdirSync(join(cwd, 'node_modules/styled-system'))
writeFileSync(join(cwd, 'package.json'), '{}')
symlinkSync(ds, join(cwd, 'node_modules/@acme/ds'), 'dir')

afterAll(() => rmSync(root, { recursive: true, force: true }))

const check = (mods: string[], outdir = 'styled-system') => getExternalPackages({ cwd, outdir }, mods)

describe('getExternalPackages', () => {
  test('installed package', () => {
    expect(check(['@acme/ds/css', '@acme/ds/recipes'])).toEqual(['@acme/ds'])
  })

  test('subpath only exposed through exports', () => {
    expect(check(['@acme/ds/not-on-disk'])).toEqual(['@acme/ds'])
  })

  test('mixed local and external', () => {
    expect(check(['@acme/ds/css', 'styled-system/recipes'])).toBeUndefined()
  })

  test('package named like the outdir', () => {
    expect(check(['styled-system/css'])).toBeUndefined()
  })

  test('tsconfig alias', () => {
    expect(check(['@/styled-system/css'])).toBeUndefined()
  })

  test('relative path', () => {
    expect(check(['../../packages/ds/css'])).toBeUndefined()
  })

  test('outdir inside the package', () => {
    expect(check(['@acme/ds/css'], 'node_modules/@acme/ds/styled-system')).toBeUndefined()
  })

  test('outdir resolves into the package', () => {
    expect(check(['@acme/ds/css'], '../../packages/ds/styled-system')).toBeUndefined()
  })
})
