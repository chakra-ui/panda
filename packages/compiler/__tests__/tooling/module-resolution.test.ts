import { describe, expect, it } from 'vitest'
import { normalizeImportMap } from '@pandacss/compiler-shared'
import { resolveModuleTarget } from '../../src/tooling/module-resolution'

describe("resolving a user's styled-system import so the editor can find it", () => {
  it("resolves import { css } from 'styled-system/css' to the real generated file", () => {
    const importMap = normalizeImportMap({ outdir: 'styled-system' })
    expect(resolveModuleTarget('styled-system/css', importMap, { outdir: 'styled-system' })).toBe('./styled-system/css')
  })

  it("also resolves a deeper import like 'styled-system/css/index'", () => {
    const importMap = normalizeImportMap({ outdir: 'styled-system' })
    expect(resolveModuleTarget('styled-system/css/index', importMap, { outdir: 'styled-system' })).toBe(
      './styled-system/css/index',
    )
  })

  it("leaves a real published package alone, e.g. import { css } from '@acme/ui/css'", () => {
    const importMap = normalizeImportMap({ outdir: 'styled-system', importMap: '@acme/ui' })
    expect(resolveModuleTarget('@acme/ui/css', importMap, { outdir: 'styled-system' })).toBeUndefined()
  })

  it("leaves an unrelated import alone, e.g. import React from 'react'", () => {
    const importMap = normalizeImportMap({ outdir: 'styled-system' })
    expect(resolveModuleTarget('react', importMap, { outdir: 'styled-system' })).toBeUndefined()
  })

  it("still works when the user's outdir is nested, e.g. 'app/panda-output'", () => {
    const importMap = normalizeImportMap({ outdir: 'app/panda-output' })
    expect(resolveModuleTarget('panda-output/recipes', importMap, { outdir: 'app/panda-output' })).toBe(
      './app/panda-output/recipes',
    )
  })
})
