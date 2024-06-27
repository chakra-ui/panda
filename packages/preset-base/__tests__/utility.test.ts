import { describe, expect, test } from 'vitest'
import { utilities } from '../src/utilities'

describe('preset-base utilities', () => {
  test('all utilities should have class names', () => {
    const und = Object.values(utilities).filter((val) => !val || !val?.className)
    expect(und.length).toBe(0)
  })

  test('all utility class names should be unique', () => {
    const classNames = Object.values(utilities)
      .map((val) => val?.className)
      .filter((c) => !!c) as string[]
    const uniqueClassNames = new Set(classNames)

    expect(classNames.length).toBe(uniqueClassNames.size)
  })
})
