import { assertType, describe, test } from 'vitest'
import { css } from '../../styled-system-strict/css'

describe('css', () => {
  test('native CSS prop and value', () => {
    assertType(css({ display: 'flex' }))

    // @ts-expect-error expected from strictTokens: true
    assertType(css({ display: 'abc' }))
  })

  test('token value', () => {
    assertType(css({ color: 'blue.300' }))
  })

  test('utility prop', () => {
    assertType(
      css({
        // @ts-expect-error expected from strictTokens: true
        srOnly: true,
      }),
    )
  })

  test('shorthand prop', () => {
    assertType(
      css({
        // @ts-expect-error expected from strictTokens: true
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
            // @ts-expect-error expected from strictTokens: true
            bg: 'pink',
          },
        },
      }),
    )
  })

  test('arbitrary value', () => {
    assertType(
      css({
        // @ts-expect-error expected from strictTokens: true
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
        _hover: {
          color: '[#fff]',
          fontSize: '[123px]',
        },
        backgroundColor: {
          _dark: '[#3B00B9]',
        },
      }),
    )
  })

  test('arbitrary selector', () => {
    assertType(css({ ['&:data-panda']: { display: 'flex' } }))
  })

  test('responsive condition', () => {
    assertType(
      css({
        sm: {
          // @ts-expect-error expected from strictTokens: true
          bg: 'purple',
        },
      }),
    )
  })

  test('responsive array syntax prop', () => {
    assertType(
      css({
        bg: [
          'cyan.100',
          'cyan.200',
          null,
          // @ts-expect-error expected from strictTokens: true
          undefined,
          'cyan.300',
        ],
      }),
    )
  })

  test('using inline token helper - in value', () => {
    assertType(
      css({
        // @ts-expect-error expected from strictTokens: true
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
