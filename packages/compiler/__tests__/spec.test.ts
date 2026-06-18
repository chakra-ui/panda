import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCompiler, type CodegenArtifact } from '../src'
import { createProject, createUserConfig } from './test-utils'

describe('compiler.spec()', () => {
  it('exposes the introspection snapshot', () => {
    const spec = createProject({
      theme: { tokens: { colors: { red: { value: '#f00' } } } },
      utilities: { color: { className: 'c', values: 'colors' } },
      conditions: { hover: '&:hover' },
    }).spec()

    expect({
      color: spec.utilities.properties.color,
      conditions: spec.conditions.keys,
      tokenValues: spec.tokens.values,
      hasPropertyOrder: spec.propertyOrder.length > 0,
    }).toMatchInlineSnapshot(`
      {
        "color": {
          "name": "color",
          "cssProperty": "color",
          "tokenCategory": "colors",
          "literals": [],
          "primitive": null,
          "alias": "ColorsValue",
        },
        "conditions": [
          "_hover",
          "base",
        ],
        "tokenValues": {
          "colors.colorPalette": "",
          "colors.red": "#f00",
        },
        "hasPropertyOrder": true,
      }
    `)
  })

  it('flags deprecated tokens under tokens.deprecated', () => {
    const spec = createProject({
      theme: { tokens: { colors: { old: { value: '#000', deprecated: true } } } },
    }).spec()
    expect(spec.tokens.deprecated).toMatchInlineSnapshot(`
      [
        "colors.old",
      ]
    `)
  })
})

describe('compiler.inspectFileSource()', () => {
  it('classifies token / property / keyframe usages with ranges', () => {
    const compiler = createProject({
      theme: {
        tokens: { colors: { red: { 500: { value: '#f00' } } } },
        keyframes: { spin: { from: {}, to: {} } },
      },
      utilities: { color: { className: 'c', values: 'colors' } },
    })
    const source = "import { css } from '@panda/css'\ncss({ color: 'red.500', animationName: 'spin' })"
    expect(compiler.inspectFileSource('app.tsx', source)).toMatchInlineSnapshot(`
      {
        "usages": [
          {
            "kind": "property",
            "name": "color",
            "range": {
              "start": {
                "line": 2,
                "column": 1,
              },
              "end": {
                "line": 2,
                "column": 49,
              },
            },
          },
          {
            "kind": "token",
            "name": "colors.red.500",
            "range": {
              "start": {
                "line": 2,
                "column": 1,
              },
              "end": {
                "line": 2,
                "column": 49,
              },
            },
          },
          {
            "kind": "property",
            "name": "animationName",
            "range": {
              "start": {
                "line": 2,
                "column": 1,
              },
              "end": {
                "line": 2,
                "column": 49,
              },
            },
          },
          {
            "kind": "keyframe",
            "name": "spin",
            "range": {
              "start": {
                "line": 2,
                "column": 1,
              },
              "end": {
                "line": 2,
                "column": 49,
              },
            },
          },
        ],
        "diagnostics": [],
      }
    `)
  })

  it('returns file-local diagnostics', () => {
    const compiler = createProject()
    const result = compiler.inspectFileSource('app.tsx', "import { css } from '@panda/css'\ncss({ color: })")

    expect(result.usages).toMatchInlineSnapshot(`[]`)
    expect(result.diagnostics.map(({ severity }) => ({ severity }))).toMatchInlineSnapshot(`
      [
        {
          "severity": "error",
        },
      ]
    `)
  })
})

describe('compiler.inspectFileSource() — token reference forms', () => {
  it('captures token() calls, curly refs, and opacity modifiers through the binding', () => {
    const compiler = createProject({
      theme: { tokens: { colors: { red: { 300: { value: '#f00' }, 500: { value: '#e00' } } } } },
      utilities: { color: { className: 'c', values: 'colors' } },
    })
    const source = [
      "import { css } from '@panda/css'",
      "import { token } from '@panda/tokens'",
      "css({ color: token('colors.red.500') })",
      "css({ color: 'red.300/40' })",
      "css({ '--ring': '{colors.red.500}' })",
    ].join('\n')
    const kinds = compiler.inspectFileSource('app.tsx', source).usages.map(({ kind, name }) => `${kind} ${name}`)
    expect(kinds).toMatchInlineSnapshot(`
      [
        "property color",
        "property color",
        "token colors.red.300",
        "property --ring",
        "token colors.red.500",
        "token colors.red.500",
      ]
    `)
  })
})

describe('compiler.sources()', () => {
  it('returns globs with their static base dir', () => {
    const compiler = createCompiler(createUserConfig({ cwd: '/proj', include: ['src/**/*.tsx', '**/*.ts'] }))
    expect(compiler.sources()).toMatchInlineSnapshot(`
      [
        {
          "base": "/proj/src",
          "pattern": "src/**/*.tsx",
        },
        {
          "base": "/proj",
          "pattern": "**/*.ts",
        },
      ]
    `)
  })
})

describe('compiler.writeArtifacts()', () => {
  it('writes generated artifacts under outdir via the platform fs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-write-'))
    try {
      const compiler = createProject({ patterns: { stack: { properties: { gap: {} } } } })
      const written = compiler.writeArtifacts({ outdir: 'styled-system', cwd: dir })
      // paths carry the temp dir (non-deterministic) — assert shape, not value.
      expect(written.some((path) => path.endsWith(join('styled-system', 'patterns', 'stack.js')))).toBe(true)
      expect(readFileSync(join(dir, 'styled-system', 'patterns', 'stack.js'), 'utf8')).toContain('getPatternStyles')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('skips rewriting unchanged artifacts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-write-'))
    try {
      const compiler = createProject({ patterns: { stack: { properties: { gap: {} } } } })
      const target = join(dir, 'styled-system', 'patterns', 'stack.js')

      compiler.writeArtifacts({ outdir: 'styled-system', cwd: dir })
      const before = statSync(target).mtimeMs

      await new Promise((resolve) => setTimeout(resolve, 20))
      compiler.writeArtifacts({ outdir: 'styled-system', cwd: dir })
      const after = statSync(target).mtimeMs

      expect(after).toBe(before)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('compiler.writeArtifacts() with provided artifacts', () => {
  it('writes provided artifacts through the platform fs and skips unchanged rewrites', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-write-'))
    try {
      const compiler = createProject()
      const targets = [join(dir, 'styled-system', 'a.txt'), join(dir, 'styled-system', 'nested', 'b.txt')]

      const artifacts: CodegenArtifact[] = [
        {
          id: 'patterns',
          files: [
            { path: 'a.txt', code: 'a', dependencies: [] },
            { path: 'nested/b.txt', code: 'b', dependencies: [] },
          ],
        },
      ]
      const written = compiler.writeArtifacts({ outdir: 'styled-system', cwd: dir, artifacts })
      expect(written).toEqual(targets)
      expect(readFileSync(targets[0], 'utf8')).toBe('a')
      expect(readFileSync(targets[1], 'utf8')).toBe('b')

      const before = targets.map((target) => statSync(target).mtimeMs)

      await new Promise((resolve) => setTimeout(resolve, 20))
      compiler.writeArtifacts({ outdir: 'styled-system', cwd: dir, artifacts })

      expect(targets.map((target) => statSync(target).mtimeMs)).toEqual(before)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
