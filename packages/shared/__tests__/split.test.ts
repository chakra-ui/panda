import { describe, expect, test } from 'vitest'
import { splitDotPath } from '../src'

describe('split', () => {
  test('color path', () => {
    expect(splitDotPath('colors.red.300')).toEqual(['colors', 'red', '300'])
    expect(splitDotPath('spacing.0.5')).toEqual(['spacing', '0.5'])
    expect(splitDotPath('spacing..5')).toEqual(['spacing', '.5'])
  })
})
