import { describe, expect, test } from 'vitest'
import {
  matchVirtualModule,
  matchResolvedVirtualModule,
  VIRTUAL_MODULE_ID,
  RESOLVED_VIRTUAL_MODULE_ID,
} from '../src/virtual'

describe('matchVirtualModule', () => {
  test('exact match returns empty string', () => {
    expect(matchVirtualModule(VIRTUAL_MODULE_ID)).toBe('')
  })

  test('with ?inline query', () => {
    expect(matchVirtualModule(VIRTUAL_MODULE_ID + '?inline')).toBe('?inline')
  })

  test('with ?url query', () => {
    expect(matchVirtualModule(VIRTUAL_MODULE_ID + '?url')).toBe('?url')
  })

  test('with ?v=hash query', () => {
    expect(matchVirtualModule(VIRTUAL_MODULE_ID + '?v=abc123')).toBe('?v=abc123')
  })

  test('non-matching ID returns null', () => {
    expect(matchVirtualModule('other-module')).toBeNull()
  })

  test('partial prefix match returns null', () => {
    expect(matchVirtualModule(VIRTUAL_MODULE_ID + '-extra')).toBeNull()
  })

  test('empty string returns null', () => {
    expect(matchVirtualModule('')).toBeNull()
  })
})

describe('matchResolvedVirtualModule', () => {
  test('exact match returns empty string', () => {
    expect(matchResolvedVirtualModule(RESOLVED_VIRTUAL_MODULE_ID)).toBe('')
  })

  test('with ?inline query', () => {
    expect(matchResolvedVirtualModule(RESOLVED_VIRTUAL_MODULE_ID + '?inline')).toBe('?inline')
  })

  test('with ?url query', () => {
    expect(matchResolvedVirtualModule(RESOLVED_VIRTUAL_MODULE_ID + '?url')).toBe('?url')
  })

  test('with ?t=timestamp query', () => {
    expect(matchResolvedVirtualModule(RESOLVED_VIRTUAL_MODULE_ID + '?t=1234567890')).toBe('?t=1234567890')
  })

  test('non-matching ID returns null', () => {
    expect(matchResolvedVirtualModule('other-module')).toBeNull()
  })

  test('unresolved virtual module returns null', () => {
    expect(matchResolvedVirtualModule(VIRTUAL_MODULE_ID)).toBeNull()
  })

  test('partial prefix match returns null', () => {
    expect(matchResolvedVirtualModule(RESOLVED_VIRTUAL_MODULE_ID + '-extra')).toBeNull()
  })
})
