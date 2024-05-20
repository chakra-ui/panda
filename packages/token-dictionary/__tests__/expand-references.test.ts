import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('expand references in value - curly ref', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('{colors.red.300}')).toMatchInlineSnapshot(`"var(--colors-red-300)"`)
})

test('expand references in value - token fn', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(colors.red.300)')).toMatchInlineSnapshot(`"var(--colors-red-300)"`)
})

test('expand references in value - multiple token fn', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(colors.red.300) token(colors.blue.500)')).toMatchInlineSnapshot(
    `"var(--colors-red-300) var(--colors-blue-500)"`,
  )
})

test('expand references in value - token fn with fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(colors.red.300, blue)')).toMatchInlineSnapshot(
    `"var(--colors-red-300, blue)"`,
  )
})

test('expand references in value - token fn with non existing token and fallback', () => {
  const dictionary = new TokenDictionary({})

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(spacing.auto, auto)')).toMatchInlineSnapshot(`"auto"`)
})

test('expand references in value - token fn with non existing token and fallback in composite value', () => {
  const dictionary = new TokenDictionary({})

  dictionary.init()

  expect(dictionary.expandReferenceInValue('1px solid token(sizes.123, auto)')).toMatchInlineSnapshot(
    `"1px solid auto"`,
  )
})

test('expand references in value - token fn with var fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(colors.red.300, var(--some-var))')).toMatchInlineSnapshot(
    `"var(--colors-red-300, var(--some-var))"`,
  )
})

test('expand references in value - token fn with var fallback that also has a fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(colors.red.300, var(--some-var, purple))')).toMatchInlineSnapshot(
    `"var(--colors-red-300, var(--some-var, purple))"`,
  )
})

test('expand references in value - token fn with var fallback that also has a var fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(
    dictionary.expandReferenceInValue('token(colors.red.300, var(--some-var, var(--another-var, purple)))'),
  ).toMatchInlineSnapshot(`"var(--colors-red-300, var(--some-var, var(--another-var, purple)))"`)
})

test('expand references in value - token fn with ref fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('token(colors.red.300, colors.blue.500)')).toMatchInlineSnapshot(
    `"var(--colors-red-300, var(--colors-blue-500))"`,
  )
})

test('expand references in value - token fn with nested ref fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(
    dictionary.expandReferenceInValue('token(colors.red.300, token(colors.blue.500, yellow))'),
  ).toMatchInlineSnapshot(`"var(--colors-red-300, var(--colors-blue-500, yellow))"`)
})

test('expand references in value - token fn with deeply nested ref fallback', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        primary: { value: '#000' },
        red: {
          300: { value: '#red300' },
          500: { value: '#red500' },
        },
        blue: {
          500: { value: '#blue500' },
          700: { value: '#blue700' },
        },
      },
    },
  })

  dictionary.init()

  expect(
    dictionary.expandReferenceInValue(
      'token(colors.red.300, token(colors.blue.500, token(colors.primary, token(colors.blue.700, colors.red.500))))',
    ),
  ).toMatchInlineSnapshot(
    `"var(--colors-red-300, var(--colors-blue-500, var(--colors-primary, var(--colors-blue-700, var(--colors-red-500)))))"`,
  )
})
