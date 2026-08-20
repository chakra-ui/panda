import { assertType, describe, test } from 'vitest'
import { css } from '../../styled-system-strict-tokens/css'

describe('css', () => {
  test('native CSS prop and value', () => {
    assertType(css({ display: 'flex' }))

    assertType(css({ display: 'abc' }))
    assertType(css({ content: 'abc' }))
    assertType(css({ willChange: 'abc' }))

    assertType(css({ pos: 'absolute' }))
    // @ts-expect-error expected from strictTokens: true
    assertType(css({ pos: 'absolute123' }))
    // @ts-expect-error expected from strictTokens: true
    assertType(css({ position: 'absolute123' }))
    // @ts-expect-error expected from strictTokens: true
    assertType(css({ flex: '0 1' }))
  })

  test('token value', () => {
    assertType(css({ color: 'blue.300' }))
  })

  test('color opacity modifier', () => {
    assertType(css({ color: 'blue.300/40' }))

    // TODO shouldnt be allowed
    assertType(css({ fontSize: '2xl/2' }))
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
        backgroundColor: 'teal',
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
        fontSize: '2xl!',
        p: '4 !important',
        // @ts-expect-error expected from strictTokens: true
        bgColor: '#fff!',
        // @ts-expect-error expected from strictTokens: true
        bg: '#fff!',
        // @ts-expect-error expected from strictTokens: true
        borderColor: '#fff !important',
        _hover: {
          fontSize: '3xl',
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

  test('scrollbar width takes the CSS keywords, not size tokens', () => {
    assertType(css({ scrollbarWidth: 'thin' }))
    assertType(css({ scrollbarWidth: 'none' }))

    // @ts-expect-error `scrollbar-width` never accepted a length
    assertType(css({ scrollbarWidth: '4' }))
  })

  test('scrollbar colors take color tokens', () => {
    assertType(css({ scrollbarThumb: 'blue.300', scrollbarTrack: 'blue.100' }))

    // @ts-expect-error expected from strictTokens: true
    assertType(css({ scrollbarThumb: 'rebeccapurple' }))
  })

  test('mask stops take spacing tokens or the escape hatch', () => {
    assertType(css({ maskBottomFrom: '4' }))
    assertType(css({ maskBottomFrom: '[20%]' }))
    assertType(css({ maskBottomFromColor: 'blue.300' }))

    // @ts-expect-error a raw percentage needs the escape hatch under strictTokens
    assertType(css({ maskBottomFrom: '20%' }))
  })
})

describe('css.fallback', () => {
  test('members are checked against the property they are written in', () => {
    assertType(css({ color: css.fallback('blue.300', 'red.200') }))
    assertType(css({ position: css.fallback('absolute', 'sticky') }))
  })

  test('a member that is not valid for the property is rejected', () => {
    // @ts-expect-error expected from strictTokens: true — not a color token
    assertType(css({ color: css.fallback('blue.300', 'notAToken') }))
    // @ts-expect-error expected from strictTokens: true — not a position keyword
    assertType(css({ position: css.fallback('absolute', 'absolute123') }))
  })

  test('the arbitrary-value escape hatch still applies per member', () => {
    assertType(css({ color: css.fallback('blue.300', '[oklch(60% 0.2 260)]') }))
  })

  test('each member is checked independently, so members may differ', () => {
    assertType(css({ padding: css.fallback('4', 'auto') }))
  })

  test('an arbitrary length still needs the escape hatch, even in a run', () => {
    assertType(css({ padding: css.fallback('[1rem]', '4') }))
    // @ts-expect-error expected from strictTokens: true — 1rem is not a spacing token
    assertType(css({ padding: css.fallback('1rem', '4') }))
  })

  test('a third invalid member is rejected', () => {
    // @ts-expect-error expected from strictTokens: true — not a color token
    assertType(css({ color: css.fallback('blue.300', 'red.200', 'nope') }))
  })

  test('a plain string is still rejected', () => {
    // @ts-expect-error expected from strictTokens: true — only css.fallback() produces a run
    assertType(css({ color: 'fallback(blue.300, oklch(60% 0.2 260))' }))
  })
})
