import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, test } from 'vitest'

import { getExternalImportMap } from '../src/external-import-map'

const root = mkdtempSync(join(tmpdir(), 'panda-import-map-'))
const cwd = join(root, 'apps/web')

mkdirSync(join(root, 'packages/ds'), { recursive: true })
mkdirSync(join(cwd, 'node_modules/@acme/own'), { recursive: true })
writeFileSync(join(cwd, 'package.json'), '{}')
symlinkSync(join(root, 'packages/ds'), join(cwd, 'node_modules/@acme/ds'), 'dir')

afterAll(() => rmSync(root, { recursive: true, force: true }))

describe('getExternalImportMap', () => {
  test('external workspace package', () => {
    expect(getExternalImportMap({ cwd, outdir: 'styled-system', importMap: '@acme/ds' })).toEqual(['@acme/ds'])
  })

  test('no importMap', () => {
    expect(getExternalImportMap({ cwd, outdir: 'styled-system' })).toBeUndefined()
  })

  test('tsconfig alias', () => {
    expect(getExternalImportMap({ cwd, outdir: 'styled-system', importMap: '@/styled-system' })).toBeUndefined()
  })

  test('outdir inside the importMap package', () => {
    expect(getExternalImportMap({ cwd, outdir: 'node_modules/@acme/own', importMap: '@acme/own' })).toBeUndefined()
  })

  test('mixed local and external entries', () => {
    expect(
      getExternalImportMap({ cwd, outdir: 'styled-system', importMap: ['@acme/ds', 'styled-system'] }),
    ).toBeUndefined()
  })

  test('object form', () => {
    expect(getExternalImportMap({ cwd, outdir: 'styled-system', importMap: { css: '@acme/ds/css' } })).toBeUndefined()
  })

  test('relative path', () => {
    expect(getExternalImportMap({ cwd, outdir: 'styled-system', importMap: '../../packages/ds' })).toBeUndefined()
  })
})
