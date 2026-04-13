import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { resolveBaseUrlForCompilerOptions } from '../src/tsconfig-utils'

describe('resolveBaseUrlForCompilerOptions', () => {
  const cwd = '/project'
  const tsconfig = '/project/packages/app/tsconfig.json'

  test('uses cwd when baseUrl is omitted', () => {
    expect(resolveBaseUrlForCompilerOptions(undefined, tsconfig, cwd)).toBe(cwd)
  })

  test('resolves relative baseUrl against the tsconfig directory', () => {
    expect(resolveBaseUrlForCompilerOptions('.', tsconfig, cwd)).toBe(path.resolve('/project/packages/app'))
    expect(resolveBaseUrlForCompilerOptions('./src', tsconfig, cwd)).toBe(path.resolve('/project/packages/app/src'))
  })

  test('leaves absolute baseUrl unchanged', () => {
    expect(resolveBaseUrlForCompilerOptions('/abs/base', tsconfig, cwd)).toBe('/abs/base')
  })
})
