import { describe, test, expect } from 'vitest'
import { esc } from '../src'

describe('esc className', () => {
  test('simple', () => {
    expect(esc('a0b')).toMatchInlineSnapshot('"a0b"')
    expect(esc('bg_red')).toMatchInlineSnapshot('"bg_red"')
  })

  test('number', () => {
    expect(esc('0a')).toMatchInlineSnapshot('"\\\\30a"')
    expect(esc('-0a')).toMatchInlineSnapshot('"-\\\\30a"')
    expect(esc('2xl:bg_red')).toMatchInlineSnapshot('"\\\\32xl\\\\:bg_red"')
  })

  test('decimal', () => {
    expect(esc('m_0.5')).toMatchInlineSnapshot('"m_0\\\\.5"')
  })

  test('important', () => {
    expect(esc('m_0.5!')).toMatchInlineSnapshot('"m_0\\\\.5\\\\!"')
  })

  test('invalid characters are escaped', () => {
    expect(esc('w:_$-1/2')).toMatchInlineSnapshot('"w\\\\:_\\\\$-1\\\\/2"')
    expect(esc('--a')).toMatchInlineSnapshot('"\\\\--a"')
  })

  test('edge cases', () => {
    expect(esc('\x80\x2D\x5F\xA9')).toMatchInlineSnapshot('"-_©"')
    expect(esc('\x20\x21\x78\x79')).toMatchInlineSnapshot('"\\\\ \\\\!xy"')
    expect(esc('\x01\x02\x1E\x1F')).toMatchInlineSnapshot('"\\\\1\\\\2\\\\1e\\\\1f"')
  })

  test('flametest', () => {
    expect(esc('decoration-[#ccc]')).toMatchInlineSnapshot('"decoration-\\\\[\\\\#ccc\\\\]"')
    expect(esc('[@media]:bg_red')).toMatchInlineSnapshot('"\\\\[\\\\@media\\\\]\\\\:bg_red"')
    expect(esc('bg-red-500/50')).toMatchInlineSnapshot('"bg-red-500\\\\/50"')
    expect(esc('p-[8px_4px]')).toMatchInlineSnapshot('"p-\\\\[8px_4px\\\\]"')
    expect(esc('w_1/3')).toMatchInlineSnapshot('"w_1\\\\/3"')
    expect(esc(`hover:bg-[url('https://github.com/img.png')]`)).toMatchInlineSnapshot(
      '"hover\\\\:bg-\\\\[url\\\\(\\\\\'https\\\\:\\\\/\\\\/github\\\\.com\\\\/img\\\\.png\\\\\'\\\\)\\\\]"',
    )
  })
})
