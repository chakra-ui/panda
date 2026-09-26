import { describe, expect, it } from 'vitest'
import { satisfiesVersionRange } from '../src/semver'

describe('satisfiesVersionRange', () => {
  it('accepts a prerelease of the caret base version', () => {
    expect(satisfiesVersionRange('2.0.0-beta.8', '^2.0.0')).toBe(true)
  })

  it('accepts a newer minor within a caret range', () => {
    expect(satisfiesVersionRange('2.5.1', '^2.0.0')).toBe(true)
  })

  it('rejects the next major for a caret range', () => {
    expect(satisfiesVersionRange('3.0.0', '^2.0.0')).toBe(false)
  })

  it('accepts a newer patch for a 0.x caret range', () => {
    expect(satisfiesVersionRange('0.2.9', '^0.2.3')).toBe(true)
  })

  it('rejects the next minor for a 0.x caret range', () => {
    expect(satisfiesVersionRange('0.3.0', '^0.2.3')).toBe(false)
  })

  it('accepts a patch within a partial ^0.0 range', () => {
    expect(satisfiesVersionRange('0.0.9', '^0.0')).toBe(true)
  })

  it('rejects the next minor for a partial ^0.0 range', () => {
    expect(satisfiesVersionRange('0.1.0', '^0.0')).toBe(false)
  })

  it('accepts a newer patch within a tilde range', () => {
    expect(satisfiesVersionRange('2.0.9', '~2.0.0')).toBe(true)
  })

  it('rejects the next minor for a tilde range', () => {
    expect(satisfiesVersionRange('2.1.0', '~2.0.0')).toBe(false)
  })

  it('accepts any minor for a bare major range', () => {
    expect(satisfiesVersionRange('2.4.0', '2')).toBe(true)
  })

  it('accepts a patch within an x-range', () => {
    expect(satisfiesVersionRange('2.1.9', '2.1.x')).toBe(true)
  })

  it('rejects the next minor for an x-range', () => {
    expect(satisfiesVersionRange('2.2.0', '2.1.x')).toBe(false)
  })

  it('accepts a version inside an intersected comparator range', () => {
    expect(satisfiesVersionRange('2.5.0', '>=2.0.0 <3.0.0')).toBe(true)
  })

  it('accepts a version within a partial <= range', () => {
    expect(satisfiesVersionRange('2.9.0', '<=2')).toBe(true)
  })

  it('rejects the next major for a partial <= range', () => {
    expect(satisfiesVersionRange('3.0.0', '<=2')).toBe(false)
  })

  it('accepts the next major for a partial > range', () => {
    expect(satisfiesVersionRange('3.0.0', '>2')).toBe(true)
  })

  it('rejects a version inside the excluded major for a partial > range', () => {
    expect(satisfiesVersionRange('2.9.0', '>2')).toBe(false)
  })

  it('accepts a version matching the second alternative of a || range', () => {
    expect(satisfiesVersionRange('3.1.0', '<2.0.0 || >=3.0.0')).toBe(true)
  })

  it('accepts the inclusive upper bound of a hyphen range', () => {
    expect(satisfiesVersionRange('2.3.4', '1.2.3 - 2.3.4')).toBe(true)
  })

  it('rejects a version past the upper bound of a hyphen range', () => {
    expect(satisfiesVersionRange('2.3.5', '1.2.3 - 2.3.4')).toBe(false)
  })

  it('accepts any patch of a partial hyphen upper bound', () => {
    expect(satisfiesVersionRange('2.3.9', '1.2 - 2.3')).toBe(true)
  })

  it('rejects the minor past a partial hyphen upper bound', () => {
    expect(satisfiesVersionRange('2.4.0', '1.2 - 2.3')).toBe(false)
  })

  it('accepts an exact version match', () => {
    expect(satisfiesVersionRange('2.0.1', '2.0.1')).toBe(true)
  })

  it('rejects a different patch for an exact version', () => {
    expect(satisfiesVersionRange('2.0.2', '2.0.1')).toBe(false)
  })

  it('ignores build metadata on the version', () => {
    expect(satisfiesVersionRange('2.0.0+sha.123', '^2.0.0')).toBe(true)
  })

  it('compares multi-digit version parts numerically', () => {
    expect(satisfiesVersionRange('10.11.12', '>=10.2.0 <11')).toBe(true)
  })

  it('rejects a workspace: protocol range', () => {
    expect(satisfiesVersionRange('2.0.0', 'workspace:*')).toBe(false)
  })

  it('rejects an unparseable range', () => {
    expect(satisfiesVersionRange('2.0.0', 'not-a-range')).toBe(false)
  })

  it('rejects an x-range with a concrete part after a wildcard', () => {
    expect(satisfiesVersionRange('2.0.0', '2.x.1')).toBe(false)
  })

  it('rejects an empty range', () => {
    expect(satisfiesVersionRange('2.0.0', '')).toBe(false)
  })

  it('rejects a range with a dangling ||', () => {
    expect(satisfiesVersionRange('2.0.0', '^2.0.0 ||')).toBe(false)
  })

  it('rejects a partial version', () => {
    expect(satisfiesVersionRange('2', '^2.0.0')).toBe(false)
  })

  it('rejects a non-numeric version even for the * range', () => {
    expect(satisfiesVersionRange('x', '*')).toBe(false)
  })
})
