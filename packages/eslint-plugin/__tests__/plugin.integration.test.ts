import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { createPandaPlugin } from '../src'
import { extractionDiagnosticsRuleName, noDeprecatedRuleName, noInvalidTokenPathsRuleName } from '../src/rules'

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-eslint-plugin-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: {
        css: ['@panda/css'],
        tokens: ['@panda/tokens'],
      },
      theme: {
        tokens: {
          colors: {
            red: {
              500: { value: '#f00' },
            },
            old: {
              value: '#000',
              deprecated: true,
            },
          },
        },
      },
      utilities: {
        color: { className: 'c', values: 'colors' },
      },
    }
`,
  )
  return dir
}

function cleanupTempProject(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

describe('createPandaPlugin integration', () => {
  test('reports parser diagnostics from real Panda inspection data', async () => {
    const dir = createTempProject()
    try {
      const plugin = await createPandaPlugin({ cwd: dir })
      const report = vi.fn()

      plugin.rules[extractionDiagnosticsRuleName]
        .create({
          report,
          cwd: dir,
          settings: {},
          filename: '/virtual/app.tsx',
          sourceCode: { text: ["import { css } from '@panda/css'", 'css({ color: })'].join('\n') },
        })
        .Program()

      expect(report).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'diagnostic',
          data: expect.objectContaining({ message: expect.stringContaining('Unexpected token') }),
        }),
      )
    } finally {
      cleanupTempProject(dir)
    }
  })

  test('reports unknown token refs from real user code', async () => {
    const dir = createTempProject()
    try {
      const plugin = await createPandaPlugin({ cwd: dir })
      const report = vi.fn()

      plugin.rules[noInvalidTokenPathsRuleName]
        .create({
          report,
          cwd: dir,
          settings: {},
          filename: '/virtual/app.tsx',
          sourceCode: {
            text: [
              "import { css } from '@panda/css'",
              "import { token } from '@panda/tokens'",
              "css({ color: token('colors.ghost') })",
            ].join('\n'),
          },
        })
        .Program()

      expect(report).toHaveBeenCalledWith({
        messageId: 'token',
        data: { token: 'colors.ghost' },
        loc: {
          start: { line: 3, column: 13 },
          end: { line: 3, column: 34 },
        },
      })
    } finally {
      cleanupTempProject(dir)
    }
  })

  test('reports deprecated token refs from real user code', async () => {
    const dir = createTempProject()
    try {
      const plugin = await createPandaPlugin({ cwd: dir })
      const report = vi.fn()

      plugin.rules[noDeprecatedRuleName]
        .create({
          report,
          cwd: dir,
          settings: {},
          filename: '/virtual/app.tsx',
          sourceCode: {
            text: [
              "import { css } from '@panda/css'",
              "import { token } from '@panda/tokens'",
              "css({ color: token('colors.old') })",
            ].join('\n'),
          },
        })
        .Program()

      expect(report).toHaveBeenCalledWith({
        messageId: 'deprecated',
        data: { kind: 'token', name: 'colors.old', note: '' },
        loc: {
          start: { line: 3, column: 13 },
          end: { line: 3, column: 32 },
        },
      })
    } finally {
      cleanupTempProject(dir)
    }
  })
})
