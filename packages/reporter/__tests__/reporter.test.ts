import { describe, it, expect } from 'vitest'
import { createContext } from '@pandacss/fixture'
import { Reporter } from '../src'

const ctx = createContext({
  theme: {
    tokens: {
      colors: {
        red: { 200: { value: 'red' } },
        green: { 200: { value: 'green' } },
      },
      fontSizes: { lg: { value: '12px' } },
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
    })
    `
    expect(tokenReport(code)).toMatchInlineSnapshot(`
      [
        {
          "category": "colors",
          "count": 16,
          "hardcoded": 7,
          "mostUsedNames": [
            "red.200",
          ],
          "percentUsed": 6.25,
          "usedCount": 1,
          "usedInXFiles": 3,
        },
        {
          "category": "fontSizes",
          "count": 1,
          "hardcoded": 5,
          "mostUsedNames": [
            "lg",
          ],
          "percentUsed": 100,
          "usedCount": 1,
          "usedInXFiles": 3,
        },
        {
          "category": "sizes",
          "count": 5,
          "hardcoded": 10,
          "mostUsedNames": [],
          "percentUsed": 0,
          "usedCount": 0,
          "usedInXFiles": 2,
        },
        {
          "category": "spacing",
          "count": 2,
          "hardcoded": 5,
          "mostUsedNames": [],
          "percentUsed": 0,
          "usedCount": 0,
          "usedInXFiles": 3,
        },
      ]
    `)
  })
})
