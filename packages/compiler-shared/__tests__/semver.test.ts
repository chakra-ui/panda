import { describe, expect, it } from 'vitest'
import { satisfiesVersionRange } from '../src/semver'

describe('satisfiesVersionRange', () => {
  it.each([
    ['2.0.0-beta.8', '^2.0.0', true],
    ['2.5.1', '^2.0.0', true],
    ['3.0.0', '^2.0.0', false],
    ['0.2.9', '^0.2.3', true],
    ['0.3.0', '^0.2.3', false],
    ['0.0.9', '^0.0', true],
    ['0.1.0', '^0.0', false],
    ['2.0.9', '~2.0.0', true],
    ['2.1.0', '~2.0.0', false],
    ['2.4.0', '2', true],
    ['2.1.9', '2.1.x', true],
    ['2.2.0', '2.1.x', false],
    ['2.5.0', '>=2.0.0 <3.0.0', true],
    ['2.9.0', '<=2', true],
    ['3.0.0', '<=2', false],
    ['3.0.0', '>2', true],
    ['2.9.0', '>2', false],
    ['3.1.0', '<2.0.0 || >=3.0.0', true],
    ['2.3.4', '1.2.3 - 2.3.4', true],
    ['2.3.5', '1.2.3 - 2.3.4', false],
    ['2.3.9', '1.2 - 2.3', true],
    ['2.4.0', '1.2 - 2.3', false],
    ['2.0.1', '2.0.1', true],
    ['2.0.2', '2.0.1', false],
    ['2.0.0+sha.123', '^2.0.0', true],
    ['10.11.12', '>=10.2.0 <11', true],
    ['2.0.0', 'workspace:*', false],
    ['2.0.0', 'not-a-range', false],
    ['2.0.0', '2.x.1', false],
    ['2.0.0', '', false],
    ['2.0.0', '^2.0.0 ||', false],
    ['2', '^2.0.0', false],
    ['x', '*', false],
  ])('%s satisfies %s: %s', (version, range, expected) => {
    expect(satisfiesVersionRange(version, range)).toBe(expected)
  })
})
