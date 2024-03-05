import { expect, test } from 'vitest'
import { TokenDictionary } from '../src/dictionary'

test('color-mix', () => {
  const dictionary = new TokenDictionary({
    tokens: {
      colors: {
        pink: { value: '#ff00ff' },
        border: { value: '{colors.pink/30}' },
        ref: { value: '{colors.border/40}' },
      },
      opacity: {
        half: { value: 0.5 },
      },
    },
  })

  dictionary.init()

  expect(dictionary.expandReferenceInValue('{colors.pink/30}')).toMatchInlineSnapshot(
    `"color-mix(in srgb, var(--colors-pink) 30%, transparent)"`,
  )
  expect(dictionary.expandReferenceInValue('{colors.border/40}')).toMatchInlineSnapshot(
    `"color-mix(in srgb, var(--colors-border) 40%, transparent)"`,
  )
  expect(dictionary.expandReferenceInValue('{colors.border/half}')).toMatchInlineSnapshot(
    `"color-mix(in srgb, var(--colors-border) 50%, transparent)"`,
  )
})
