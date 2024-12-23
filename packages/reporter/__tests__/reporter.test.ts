import { describe, it, expect } from 'vitest'
import { createContext } from '@pandacss/fixture'
import { Reporter } from '../src'

const ctx = createContext({
  theme: {
    tokens: {
      colors: {
        red: { 200: { value: 'red' } },
        green: { 200: { value: 'green' } },
        blue: { 200: { value: 'blue' } },
        yellow: { 200: { value: 'yellow' } },
        custom: { value: 'custom' },
      },
      fontSizes: { lg: { value: '12px' } },
      spacing: { 1: { value: '10px' }, 2: { value: '20px' } },
    },
  },
})

const tokenReport = (code: string) => {
  ctx.project.addSourceFile('code.tsx', code)
  const reporter = new Reporter(ctx, {
    project: ctx.project,
    getRelativePath: ctx.runtime.path.relative,
    getFiles: () => ['code.tsx'],
  })

  reporter.init()

  return reporter.getTokenReport()
}

describe('reporter', () => {
  it('tokens / v1', () => {
    const code = `
    import {css} from "styled-system/css"

    const baseStyle = css({
        color: 'red.200',
        fontSize: '12px',
        bg: 'red.200',
    })
    `
    expect(tokenReport(code)).toMatchInlineSnapshot(`
      [
        {
          "category": "fontSizes",
          "count": 1,
          "hardcoded": 5,
          "mostUsedNames": [
            "lg",
          ],
          "percentUsed": 100,
          "usedCount": 1,
          "usedInXFiles": 1,
        },
        {
          "category": "spacing",
          "count": 6,
          "hardcoded": 3,
          "mostUsedNames": [
            "2",
          ],
          "percentUsed": 16.67,
          "usedCount": 1,
          "usedInXFiles": 0,
        },
        {
          "category": "colors",
          "count": 19,
          "hardcoded": 6,
          "mostUsedNames": [
            "red.200",
          ],
          "percentUsed": 5.26,
          "usedCount": 1,
          "usedInXFiles": 1,
        },
        {
          "category": "sizes",
          "count": 5,
          "hardcoded": 5,
          "mostUsedNames": [],
          "percentUsed": 0,
          "usedCount": 0,
          "usedInXFiles": 0,
        },
      ]
    `)
  })
})
