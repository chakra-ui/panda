import { assertType, describe, test } from 'vitest'
import { css } from '../../styled-system-strict-property-values/css'

describe('css', () => {
  test('native CSS prop and value', () => {
    assertType(css({ display: 'flex' }))

    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css({ display: 'abc' }))

    assertType(css({ content: 'abc' }))
    assertType(css({ willChange: 'abc' }))

    assertType(css({ pos: 'absolute' }))

    // @ts-expect-error always expected
    assertType(css({ pos: 'absolute123' }))
  })

  test('token value', () => {
    assertType(css({ color: 'blue.300' }))
  })

  test('utility prop', () => {
    assertType(
      css({
        srOnly: true,
      }),
    )
  })

  test('shorthand prop', () => {
    assertType(
      css({
        backgroundColor: 'red',
        bg: 'red',
      }),
    )
  })

  test('object condition prop', () => {
    assertType(css({ bg: { _hover: 'yellow.100' } }))
  })

  test('condition prop', () => {
    assertType(css({ _hover: { bg: 'yellow.200' } }))
  })

  test('nested condition prop', () => {
    assertType(
      css({
        _hover: {
          _dark: {
            bg: 'pink',
          },
        },
      }),
    )
  })

  test('arbitrary value', () => {
    assertType(
      css({
        color: '#fff',
      }),
    )
  })

  test('arbitrary value escape hatch', () => {
    assertType(
      css({
        color: '[#fff]',
        fontSize: '[123px]',
      }),
    )
  })

  test('arbitrary value escape hatch with conditionals', () => {
    assertType(
      css({
        color: '[#fff]',
        fontSize: '[123px]',
        bgColor: '[#fff!]',
        borderColor: '[#fff !important]',
        _hover: {
          color: '[#fff]',
          fontSize: '[123px]',
          bgColor: '[#fff!]',
          borderColor: '[#fff !important]',
        },
        backgroundColor: {
          _dark: '[#3B00B9]',
          _hover: '[#3B00B9!]',
          _focus: '[#3B00B9 !important]',
        },
      }),
    )
  })

  test('arbitrary selector', () => {
    assertType(css({ ['&:data-panda']: { display: 'flex' } }))
  })

  test('important', () => {
    assertType(
      css({
        fontSize: '2xl!',
        p: '4 !important',
        bgColor: '#fff!',
        borderColor: '#fff !important',
        _hover: {
          fontSize: '2xl!',
          p: '4 !important',

          bgColor: '#fff!',
          borderColor: '#fff !important',
        },
        backgroundColor: {
          _disabled: '2xl!',
          _active: '4 !important',
          _hover: '#3B00B9!',
          _focus: '#3B00B9 !important',
        },
      }),
    )
  })

  test('responsive condition', () => {
    assertType(
      css({
        sm: {
          bg: 'purple',
        },
      }),
    )
  })

  test('responsive array syntax prop', () => {
    assertType(
      css({
        bg: ['cyan.100', 'cyan.200', null, undefined, 'cyan.300'],
      }),
    )
  })

  test('using inline token helper - in value', () => {
    assertType(
      css({
        // @ts-expect-error expected from strictPropertyValues: true
        border: '1px solid token(colors.blue.400)',
      }),
    )
  })

  test('using inline token helper - in condition', () => {
    assertType(css({ '@media screen and (min-width: token(sizes.4xl))': { bg: 'blue.500' } }))
  })

  test('nested condition prop with array syntax', () => {
    assertType(css({ _hover: { _dark: { bg: ['pink.100', 'pink.200'] } } }))
  })
})
