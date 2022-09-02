import { breakpoints } from '@css-panda/fixture'
import { describe, expect, test } from 'vitest'
import { getBreakpointDetails } from '../src'

describe('breakpoints', () => {
  test('should work', () => {
    expect(getBreakpointDetails(breakpoints)).toMatchInlineSnapshot(`
      {
        "2xl": {
          "maxQuery": "screen",
          "minMaxQuery": "screen and (min-width: 96em)",
          "minQuery": "screen and (min-width: 96em)",
          "name": "2xl",
        },
        "lg": {
          "maxQuery": "screen and (max-width: 79.996875em)",
          "minMaxQuery": "screen and (min-width: 62em) and (max-width: 79.996875em)",
          "minQuery": "screen and (min-width: 62em)",
          "name": "lg",
        },
        "md": {
          "maxQuery": "screen and (max-width: 61.996875em)",
          "minMaxQuery": "screen and (min-width: 48em) and (max-width: 61.996875em)",
          "minQuery": "screen and (min-width: 48em)",
          "name": "md",
        },
        "sm": {
          "maxQuery": "screen and (max-width: 47.996875em)",
          "minMaxQuery": "screen and (min-width: 30em) and (max-width: 47.996875em)",
          "minQuery": "screen and (min-width: 30em)",
          "name": "sm",
        },
        "xl": {
          "maxQuery": "screen and (max-width: 95.996875em)",
          "minMaxQuery": "screen and (min-width: 80em) and (max-width: 95.996875em)",
          "minQuery": "screen and (min-width: 80em)",
          "name": "xl",
        },
      }
    `)
  })
})
