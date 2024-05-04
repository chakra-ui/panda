import { assertType, describe, test, expect } from 'vitest'
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
      css({
        // @ts-expect-error expected from strictTokens: true
        backgroundColor: 'red',
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
        fontSize: '2xl !important',
        p: '4 !important',
        // @ts-expect-error expected from strictTokens: true
        bgColor: '#fff!',
        // @ts-expect-error expected from strictTokens: true
        borderColor: '#fff !important',
        _hover: {
          fontSize: '2xl !important',
          p: '4 !important',
          // @ts-expect-error expected from strictTokens: true

          bgColor: '#fff!',
          // @ts-expect-error expected from strictTokens: true
          borderColor: '#fff !important',
        },
        // @ts-expect-error expected from strictTokens: true
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

describe('css.raw', () => {
  test('native CSS prop and value', () => {
    assertType(css.raw({ display: 'flex' }))

    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css.raw({ display: 'abc' }))
    assertType(css.raw({ content: 'abc' }))
    assertType(css.raw({ willChange: 'abc' }))

    assertType(css.raw({ pos: 'absolute' }))

    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css.raw({ position: 'absolute123' }))
    // @ts-expect-error expected from strictPropertyValues: true
    assertType(css.raw({ pos: 'absolute123' }))
    // @ts-expect-error expected from strictTokens: true
    assertType(css.raw({ flex: '0 1' }))
  })

  test('token value', () => {
    assertType(css.raw({ color: 'blue.300' }))
  })

  test('css var', () => {
    assertType(css.raw({ color: 'var(--button-color)' }))
    assertType(css.raw({ display: 'var(--button-color)' }))
  })

  test('utility prop', () => {
    assertType(
      css.raw({
        srOnly: true,
      }),
    )
  })

  test('shorthand prop', () => {
    assertType(
      css.raw({
        // @ts-expect-error expected from strictTokens: true
        backgroundColor: 'red',
        // @ts-expect-error expected from strictTokens: true
        bg: 'red',
      }),
    )
  })

  test('object condition prop', () => {
    assertType(css.raw({ bg: { _hover: 'yellow.100' } }))
  })

  test('condition prop', () => {
    assertType(css.raw({ _hover: { bg: 'yellow.200' } }))
  })

  test('nested condition prop', () => {
    assertType(
      css.raw({
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
      css.raw({
        // @ts-expect-error expected from strictTokens: true
        color: '#fff',
      }),
    )
  })

  test('arbitrary value escape hatch', () => {
    assertType(
      css.raw({
        color: '[#fff]',
        fontSize: '[123px]',
      }),
    )
  })

  test('arbitrary value escape hatch with conditionals', () => {
    assertType(
      css.raw({
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
    assertType(css.raw({ ['&:data-panda']: { display: 'flex' } }))
  })

  test('important', () => {
    assertType(
      css.raw({
        fontSize: '2xl !important',
        p: '4 !important',
        // @ts-expect-error expected from strictTokens: true
        bgColor: '#fff!',
        // @ts-expect-error expected from strictTokens: true
        borderColor: '#fff !important',
        _hover: {
          fontSize: '2xl !important',
          p: '4 !important',
          // @ts-expect-error expected from strictTokens: true

          bgColor: '#fff!',
          // @ts-expect-error expected from strictTokens: true
          borderColor: '#fff !important',
        },
        // @ts-expect-error expected from strictTokens: true
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
      css.raw({
        sm: {
          // @ts-expect-error expected from strictTokens: true
          bg: 'purple',
        },
      }),
    )
  })

  test('responsive array syntax prop', () => {
    assertType(
      css.raw({
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
      css.raw({
        // @ts-expect-error expected from strictTokens: true
        border: '1px solid token(colors.blue.400)',
      }),
    )
  })

  test('using inline token helper - in condition', () => {
    assertType(css.raw({ '@media screen and (min-width: token(sizes.4xl))': { bg: 'blue.500' } }))
  })

  test('nested condition prop with array syntax', () => {
    assertType(css.raw({ _hover: { _dark: { bg: ['pink.100', 'pink.200'] } } }))
  })
})
