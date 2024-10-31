import { describe, expect, test } from 'vitest'
import { unionType } from '../src'

describe('unionType', () => {
  test('numbers', () => {
    expect(unionType(['1', '2', '3'])).toEqual(`1 | "1" | 2 | "2" | 3 | "3"`)
  })

  test('negative numbers', () => {
    expect(unionType(['-1', '-2', '-3'])).toEqual(`-1 | "-1" | -2 | "-2" | -3 | "-3"`)
  })

  test('floats', () => {
    expect(unionType(['1.1', '2.2', '3.3'])).toEqual(`1.1 | "1.1" | 2.2 | "2.2" | 3.3 | "3.3"`)
  })

  test('hexadecimals', () => {
    expect(unionType(['0x233', '0x234', '0x235'])).toEqual(`0x233 | "0x233" | 0x234 | "0x234" | 0x235 | "0x235"`)
  })

  test('strings', () => {
    expect(unionType(['abc', 'def', 'ghi'])).toEqual(`"abc" | "def" | "ghi"`)
  })

  test('strings starting with numbers', () => {
    expect(unionType(['11abc', '22def', '33ghi'])).toEqual(`"11abc" | "22def" | "33ghi"`)
  })

  test('numbers starting with 0', () => {
    expect(unionType(['01', '02', '03'])).toEqual(`"01" | "02" | "03"`)
  })
})
