import { breakpoints } from '@css-panda/fixture'
import { describe, expect, test } from 'vitest'
import { getBreakpointDetails } from '../src'

describe('breakpoints', () => {
  test('should work', () => {
    expect(getBreakpointDetails(breakpoints)).toMatchInlineSnapshot(`
      {
        "2xl": {
          "max": undefined,
          "maxQuery": "screen",
          "min": "96em",
          "minMaxQuery": "screen and (min-width: 96em)",
          "minQuery": "screen and (min-width: 96em)",
          "name": "2xl",
        },
        "lg": {
          "max": "1279.95px",
          "maxQuery": "screen and (max-width: 79.996875em)",
          "min": "62em",
          "minMaxQuery": "screen and (min-width: 62em) and (max-width: 79.996875em)",
          "minQuery": "screen and (min-width: 62em)",
          "name": "lg",
        },
        "md": {
          "max": "991.95px",
          "maxQuery": "screen and (max-width: 61.996875em)",
          "min": "48em",
          "minMaxQuery": "screen and (min-width: 48em) and (max-width: 61.996875em)",
          "minQuery": "screen and (min-width: 48em)",
          "name": "md",
        },
        "sm": {
          "max": "767.95px",
          "maxQuery": "screen and (max-width: 47.996875em)",
          "min": "30em",
          "minMaxQuery": "screen and (min-width: 30em) and (max-width: 47.996875em)",
          "minQuery": "screen and (min-width: 30em)",
          "name": "sm",
        },
        "xl": {
          "max": "1535.95px",
          "maxQuery": "screen and (max-width: 95.996875em)",
          "min": "80em",
          "minMaxQuery": "screen and (min-width: 80em) and (max-width: 95.996875em)",
          "minQuery": "screen and (min-width: 80em)",
          "name": "xl",
        },
      }
    `)
  })
})
