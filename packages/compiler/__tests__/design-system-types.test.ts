import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'
import type { SerializedConfig } from '../src'
import { createProject } from './test-utils'

const baseConfig: SerializedConfig = {
  theme: { tokens: { colors: { black: { value: '#000' } } } },
}

const uiConfig: SerializedConfig = {
  designSystem: '@acme/base',
  theme: { tokens: { colors: { black: { value: '#000' }, brand: { value: '#f00' } } } },
}

const appConfig: SerializedConfig = {
  designSystem: '@acme/ui',
  theme: {
    tokens: { colors: { black: { value: '#000' }, brand: { value: '#f00' }, accent: { value: '#0f0' } } },
    keyframes: { appFade: { from: { opacity: 0 }, to: { opacity: 1 } } },
  },
}

let root: string | undefined

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true })
  root = undefined
})

function writeStyledSystem(dir: string, config: SerializedConfig) {
  createProject({ jsxFramework: undefined, ...config }).writeArtifacts({ outdir: 'styled-system', cwd: dir })
}

function writeDesignSystem(name: string, config: SerializedConfig) {
  const dir = join(root!, 'node_modules', ...name.split('/'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name, exports: { './types': { types: './styled-system/types/index.d.ts' } } }),
  )
  writeStyledSystem(dir, config)
}

function typeErrors(entry: string, source: string) {
  const file = join(root!, entry)
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, source)
  const program = ts.createProgram([file], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
  })
  return ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
}

describe('design system types follow the consuming app', () => {
  it("accepts the app's styles and tokens where the design system's types are used", () => {
    root = mkdtempSync(join(tmpdir(), 'panda-ds-types-'))
    writeDesignSystem('@acme/base', baseConfig)
    writeDesignSystem('@acme/ui', uiConfig)
    writeStyledSystem(join(root, 'app'), appConfig)

    const errors = typeErrors(
      'app/index.ts',
      [
        `import { css } from './styled-system/css'`,
        `import type { SystemStyleObject, Token } from '@acme/ui/types'`,
        `export const fromRaw: SystemStyleObject = css.raw({ marginTop: '4px' })`,
        `export const animation: SystemStyleObject = { animationName: 'appFade' }`,
        `export const appToken: Token = 'colors.accent'`,
        `// @ts-expect-error not a token of the app or the design system`,
        `export const unknown: Token = 'colors.nope'`,
      ].join('\n'),
    )

    expect(errors).toEqual([])
  })

  it('passes the app types down a stacked design system', () => {
    root = mkdtempSync(join(tmpdir(), 'panda-ds-types-'))
    writeDesignSystem('@acme/base', baseConfig)
    writeDesignSystem('@acme/ui', uiConfig)
    writeStyledSystem(join(root, 'app'), appConfig)

    const errors = typeErrors(
      'app/index.ts',
      [
        `import './styled-system/css'`,
        `import type { Token } from '@acme/base/types'`,
        `export const appToken: Token = 'colors.accent'`,
      ].join('\n'),
    )

    expect(errors).toEqual([])
  })

  it('keeps its own types when no app registers', () => {
    root = mkdtempSync(join(tmpdir(), 'panda-ds-types-'))
    writeDesignSystem('@acme/base', baseConfig)

    const errors = typeErrors(
      'consumer/index.ts',
      [
        `import type { Token } from '@acme/base/types'`,
        `export const own: Token = 'colors.black'`,
        `// @ts-expect-error only the app adds this token`,
        `export const appToken: Token = 'colors.accent'`,
      ].join('\n'),
    )

    expect(errors).toEqual([])
  })
})
