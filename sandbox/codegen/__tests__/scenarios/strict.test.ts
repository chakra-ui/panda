import { assertType, describe, test } from 'vitest'
import { css } from '../../styled-system-strict/css'

describe('css', () => {
  test('native CSS prop and value', () => {
    assertType(css({ display: 'flex' }))

    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css({ display: 'abc' }))
    assertType(css({ content: 'abc' }))
    assertType(css({ willChange: 'abc' }))

    assertType(css({ pos: 'absolute' }))

    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css({ position: 'absolute123' }))
    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css({ pos: 'absolute123' }))
    // @ts-expect-error expected from strictTokens: true
    assertType(css({ flex: '0 1' }))
  })

  test('token value', () => {
    assertType(css({ color: 'blue.300' }))
  })

  test('css var', () => {
    assertType(css({ color: 'var(--button-color)' }))
    assertType(css({ display: 'var(--button-color)' }))
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
      // @ts-expect-error expected from strictTokens: true
      css({
        // error cause
        backgroundColor: 'red',
        // error cause
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
      // @ts-expect-error expected from strictTokens: true
      css({
        _hover: {
          _dark: {
            // error cause
            bg: 'pink',
          },
        },
      }),
    )
  })

  test('arbitrary value', () => {
    assertType(
      // @ts-expect-error expected from strictTokens: true
      css({
        // error cause
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
      // @ts-expect-error expected from strictTokens: true
      css({
        fontSize: '2xl !important',
        p: '4 !important',
        // error cause
        bgColor: '#fff!',
        // error cause
        borderColor: '#fff !important',
        _hover: {
          fontSize: '2xl !important',
          p: '4 !important',
          // error cause

          bgColor: '#fff!',
          // error cause
          borderColor: '#fff !important',
        },
        // error cause
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
      // @ts-expect-error expected from strictTokens: true
      css({
        sm: {
          // error cause
          bg: 'purple',
        },
      }),
    )
  })

  test('responsive array syntax prop', () => {
    assertType(
      // @ts-expect-error expected from strictTokens: true
      css({
        bg: [
          'cyan.100',
          'cyan.200',
          null,
          // error cause
          undefined,
          'cyan.300',
        ],
      }),
    )
  })

  test('using inline token helper - in value', () => {
    assertType(
      // @ts-expect-error expected from strictTokens: true
      css({
        // error cause
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
