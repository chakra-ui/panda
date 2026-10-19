import { expect, test } from 'vitest'
import { createUsageReport } from '@pandacss/compiler-shared'
import { createPresetCompiler } from './preset-compiler'

test('animation tokens keep their keyframes and report the same names', () => {
  const compiler = createPresetCompiler({
    optimize: { removeUnusedKeyframes: true, removeUnusedTokens: true },
    theme: {
      extend: {
        keyframes: {
          slide: { from: { transform: 'translateY(4px)' }, to: { transform: 'none' } },
          fade: { from: { opacity: 0 }, to: { opacity: 1 } },
          unused: { from: { opacity: 0 }, to: { opacity: 1 } },
        },
        tokens: { animations: { slideIn: { value: 'slide 300ms, fade 300ms' } } },
      },
    },
  })
  const source = `import { css } from '@panda/css'
    css({ animation: 'pulse' })
    css({ animation: 'slideIn' })`
  const path = '/virtual/index.ts'
  compiler.parseFileSource(path, source)
  const output = compiler.compile()
  expect([...output.css.matchAll(/@keyframes ([\w-]+)/g)].map((match) => match[1]).sort()).toEqual([
    'fade',
    'pulse',
    'slide',
  ])
  expect(output.css).toContain('animation: var(--animations-pulse)')
  expect(output.css).toContain('animation: var(--animations-slide-in)')
  expect(output.diagnostics).toEqual([])
  const files = [{ path, source }]
  const report = createUsageReport(compiler.inspectFiles(files), {
    spec: compiler.spec(),
    requirements: compiler.inspectUsageRequirements(files).requirements,
  })
  expect(report.views?.keyframes.items.map((item) => `${item.name} ${item.config?.join(', ')}`)).toEqual([
    'fade via animations.slideIn',
    'pulse via animations.pulse',
    'slide via animations.slideIn',
  ])
})
