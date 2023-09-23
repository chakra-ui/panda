import { describe, expect, test } from 'vitest'
import { css } from '../styled-system/css/css'

describe('css', () => {
  test('native CSS prop and value', () => {
    const className = css({ display: 'flex' })

    expect(className).toMatchInlineSnapshot('"d_flex"')
  })

  test('token value', () => {
    const className = css({ color: 'blue.300' })

    expect(className).toMatchInlineSnapshot('"text_blue.300"')
  })

  test('utility prop', () => {
    const className = css({ srOnly: true })

    expect(className).toMatchInlineSnapshot('"sr_true"')
  })

  test('shorthand prop', () => {
    const className = css({ bg: 'red' })

    expect(className).toMatchInlineSnapshot('"bg_red"')
  })

  test('object condition prop', () => {
    const className = css({ bg: { _hover: 'yellow.100' } })

    expect(className).toMatchInlineSnapshot('"hover:bg_yellow.100"')
  })

  test('condition prop', () => {
    const className = css({ _hover: { bg: 'yellow.200' } })

    expect(className).toMatchInlineSnapshot('"hover:bg_yellow.200"')
  })

  test('nested condition prop', () => {
    const className = css({ _hover: { _dark: { bg: 'pink' } } })

    expect(className).toMatchInlineSnapshot('"hover:dark:bg_pink"')
  })

  test('arbitrary value', () => {
    const className = css({ color: '#fff' })

    expect(className).toMatchInlineSnapshot('"text_#fff"')
  })

  test('arbitrary selector', () => {
    const className = css({ ['&:data-panda']: { display: 'flex' } })

    expect(className).toMatchInlineSnapshot('"[&:data-panda]:d_flex"')
  })

  test('responsive condition', () => {
    const className = css({ sm: { bg: 'purple' } })

    expect(className).toMatchInlineSnapshot('"sm:bg_purple"')
  })

  test('responsive array syntax prop', () => {
    const className = css({ bg: ['cyan.100', 'cyan.200', null, undefined, 'cyan.300'] })

    expect(className).toMatchInlineSnapshot('"bg_cyan.100 sm:bg_cyan.200 xl:bg_cyan.300"')
  })

  test('nested condition prop with array syntax', () => {
    const className = css({ _hover: { _dark: { bg: ['pink.100', 'pink.200'] } } })

    expect(className).toMatchInlineSnapshot('"hover:dark:bg_pink.100 hover:dark:sm:bg_pink.200"')
  })

  test('same prop', () => {
    const className = css({ bgColor: 'red.100', backgroundColor: 'red.200' })

    expect(className).toMatchInlineSnapshot('"bg_red.200"')

    const className2 = css({ backgroundColor: 'red.300', bgColor: 'red.400' })

    expect(className2).toMatchInlineSnapshot('"bg_red.400"')
  })

  test('merging styles', () => {
    const className = css({ fontSize: 'sm', bgColor: 'red.500' }, { backgroundColor: 'red.600' })

    expect(className).toMatchInlineSnapshot('"fs_sm bg_red.600"')
  })

  test('merging styles with nested conditions', () => {
    const className = css({ fontSize: 'sm', _hover: { color: 'green.100' } }, { _hover: { color: 'green.200' } })

    expect(className).toMatchInlineSnapshot('"fs_sm hover:text_green.200"')
  })

  test('merging styles with object condition prop', () => {
    const className = css({ fontSize: 'md' }, { fontSize: { base: 'lg', sm: 'xs' } })

    // TODO: this is not correct
    expect(className).toMatchInlineSnapshot('"0:fs_m 1:fs_d fs_lg sm:fs_xs"')
  })
})
