import { describe, expect, test } from 'vitest'
import { transformFonts } from '../src/typography'

describe('Open Prop preset transforms', () => {
  test('Should transform fonts correctly  ', () => {
    expect(transformFonts('weight')).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "100",
        },
        "2": {
          "value": "200",
        },
        "3": {
          "value": "300",
        },
        "4": {
          "value": "400",
        },
        "5": {
          "value": "500",
        },
        "6": {
          "value": "600",
        },
        "7": {
          "value": "700",
        },
        "8": {
          "value": "800",
        },
        "9": {
          "value": "900",
        },
      }
    `)
    expect(transformFonts('lineheight')).toMatchInlineSnapshot(`
      {
        "0": {
          "value": "1.1",
        },
        "00": {
          "value": ".95",
        },
        "1": {
          "value": "1.25",
        },
        "2": {
          "value": "1.375",
        },
        "3": {
          "value": "1.5",
        },
        "4": {
          "value": "1.75",
        },
        "5": {
          "value": "2",
        },
      }
    `)
    expect(transformFonts('letterspacing')).toMatchInlineSnapshot(`
      {
        "0": {
          "value": "-.05em",
        },
        "1": {
          "value": ".025em",
        },
        "2": {
          "value": ".050em",
        },
        "3": {
          "value": ".075em",
        },
        "4": {
          "value": ".150em",
        },
        "5": {
          "value": ".500em",
        },
        "6": {
          "value": ".750em",
        },
        "7": {
          "value": "1em",
        },
      }
    `)
    expect(transformFonts('size')).toMatchInlineSnapshot(`
      {
        "0": {
          "value": ".75rem",
        },
        "00": {
          "value": ".5rem",
        },
        "1": {
          "value": "1rem",
        },
        "2": {
          "value": "1.1rem",
        },
        "3": {
          "value": "1.25rem",
        },
        "4": {
          "value": "1.5rem",
        },
        "5": {
          "value": "2rem",
        },
        "6": {
          "value": "2.5rem",
        },
        "7": {
          "value": "3rem",
        },
        "8": {
          "value": "3.5rem",
        },
        "fluid-0": {
          "value": "clamp(.75rem, 2vw, 1rem)",
        },
        "fluid-1": {
          "value": "clamp(1rem, 4vw, 1.5rem)",
        },
        "fluid-2": {
          "value": "clamp(1.5rem, 6vw, 2.5rem)",
        },
        "fluid-3": {
          "value": "clamp(2rem, 9vw, 3.5rem)",
        },
      }
    `)
    expect(transformFonts('size')).toMatchInlineSnapshot(`
      {
        "0": {
          "value": ".75rem",
        },
        "00": {
          "value": ".5rem",
        },
        "1": {
          "value": "1rem",
        },
        "2": {
          "value": "1.1rem",
        },
        "3": {
          "value": "1.25rem",
        },
        "4": {
          "value": "1.5rem",
        },
        "5": {
          "value": "2rem",
        },
        "6": {
          "value": "2.5rem",
        },
        "7": {
          "value": "3rem",
        },
        "8": {
          "value": "3.5rem",
        },
        "fluid-0": {
          "value": "clamp(.75rem, 2vw, 1rem)",
        },
        "fluid-1": {
          "value": "clamp(1rem, 4vw, 1.5rem)",
        },
        "fluid-2": {
          "value": "clamp(1.5rem, 6vw, 2.5rem)",
        },
        "fluid-3": {
          "value": "clamp(2rem, 9vw, 3.5rem)",
        },
      }
    `)
  })
})
