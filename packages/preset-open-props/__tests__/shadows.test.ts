import { describe, expect, test } from 'vitest'
import { shadows, semanticShadows } from '../src/shadows'

describe('Open Prop preset transforms', () => {
  test('Should transform shadows correctly', () => {
    expect(shadows).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "0 1px 2px -1px hsl(220 3% 15% / calc(1% + 9%))",
        },
        "2": {
          "value": "
          0 3px 5px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 7px 14px -5px hsl(220 3% 15% / calc(1% + 5%))",
        },
        "3": {
          "value": "
          0 -1px 3px 0 hsl(220 3% 15% / calc(1% + 2%)),
          0 1px 2px -5px hsl(220 3% 15% / calc(1% + 2%)),
          0 2px 5px -5px hsl(220 3% 15% / calc(1% + 4%)),
          0 4px 12px -5px hsl(220 3% 15% / calc(1% + 5%)),
          0 12px 15px -5px hsl(220 3% 15% / calc(1% + 7%))",
        },
        "4": {
          "value": "
          0 -2px 5px 0 hsl(220 3% 15% / calc(1% + 2%)),
          0 1px 1px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 2px 2px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 5px 5px -2px hsl(220 3% 15% / calc(1% + 4%)),
          0 9px 9px -2px hsl(220 3% 15% / calc(1% + 5%)),
          0 16px 16px -2px hsl(220 3% 15% / calc(1% + 6%))",
        },
        "5": {
          "value": "
          0 -1px 2px 0 hsl(220 3% 15% / calc(1% + 2%)),
          0 2px 1px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 5px 5px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 10px 10px -2px hsl(220 3% 15% / calc(1% + 4%)),
          0 20px 20px -2px hsl(220 3% 15% / calc(1% + 5%)),
          0 40px 40px -2px hsl(220 3% 15% / calc(1% + 7%))",
        },
        "6": {
          "value": "
          0 -1px 2px 0 hsl(220 3% 15% / calc(1% + 2%)),
          0 3px 2px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 7px 5px -2px hsl(220 3% 15% / calc(1% + 3%)),
          0 12px 10px -2px hsl(220 3% 15% / calc(1% + 4%)),
          0 22px 18px -2px hsl(220 3% 15% / calc(1% + 5%)),
          0 41px 33px -2px hsl(220 3% 15% / calc(1% + 6%)),
          0 100px 80px -2px hsl(220 3% 15% / calc(1% + 7%))",
        },
        "inner0": {
          "value": "inset 0 0 0 1px hsl(220 3% 15% / calc(1% + 9%))",
        },
        "inner1": {
          "value": "inset 0 1px 2px 0 hsl(220 3% 15% / calc(1% + 9%)), inset 0 -.5px 0 0 #fff, inset 0 .5px 0 0 #0001",
        },
        "inner2": {
          "value": "inset 0 1px 4px 0 hsl(220 3% 15% / calc(1% + 9%)), inset 0 -.5px 0 0 #fff, inset 0 .5px 0 0 #0001",
        },
        "inner3": {
          "value": "inset 0 2px 8px 0 hsl(220 3% 15% / calc(1% + 9%)), inset 0 -.5px 0 0 #fff, inset 0 .5px 0 0 #0001",
        },
        "inner4": {
          "value": "inset 0 2px 14px 0 hsl(220 3% 15% / calc(1% + 9%)), inset 0 -.5px 0 0 #fff, inset 0 .5px 0 0 #0001",
        },
      }
    `)

    expect(semanticShadows).toMatchInlineSnapshot(`
      {
        "1": {
          "value": {
            "_dark": "0 1px 2px -1px hsl(220 40% 2% / calc(25% + 9%))",
          },
        },
        "2": {
          "value": {
            "_dark": "
          0 3px 5px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 7px 14px -5px hsl(220 40% 2% / calc(25% + 5%))",
          },
        },
        "3": {
          "value": {
            "_dark": "
          0 -1px 3px 0 hsl(220 40% 2% / calc(25% + 2%)),
          0 1px 2px -5px hsl(220 40% 2% / calc(25% + 2%)),
          0 2px 5px -5px hsl(220 40% 2% / calc(25% + 4%)),
          0 4px 12px -5px hsl(220 40% 2% / calc(25% + 5%)),
          0 12px 15px -5px hsl(220 40% 2% / calc(25% + 7%))",
          },
        },
        "4": {
          "value": {
            "_dark": "
          0 -2px 5px 0 hsl(220 40% 2% / calc(25% + 2%)),
          0 1px 1px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 2px 2px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 5px 5px -2px hsl(220 40% 2% / calc(25% + 4%)),
          0 9px 9px -2px hsl(220 40% 2% / calc(25% + 5%)),
          0 16px 16px -2px hsl(220 40% 2% / calc(25% + 6%))",
          },
        },
        "5": {
          "value": {
            "_dark": "
          0 -1px 2px 0 hsl(220 40% 2% / calc(25% + 2%)),
          0 2px 1px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 5px 5px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 10px 10px -2px hsl(220 40% 2% / calc(25% + 4%)),
          0 20px 20px -2px hsl(220 40% 2% / calc(25% + 5%)),
          0 40px 40px -2px hsl(220 40% 2% / calc(25% + 7%))",
          },
        },
        "6": {
          "value": {
            "_dark": "
          0 -1px 2px 0 hsl(220 40% 2% / calc(25% + 2%)),
          0 3px 2px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 7px 5px -2px hsl(220 40% 2% / calc(25% + 3%)),
          0 12px 10px -2px hsl(220 40% 2% / calc(25% + 4%)),
          0 22px 18px -2px hsl(220 40% 2% / calc(25% + 5%)),
          0 41px 33px -2px hsl(220 40% 2% / calc(25% + 6%)),
          0 100px 80px -2px hsl(220 40% 2% / calc(25% + 7%))",
          },
        },
        "inner0": {
          "value": {
            "_dark": "inset 0 0 0 1px hsl(220 40% 2% / calc(25% + 9%))",
          },
        },
        "inner1": {
          "value": {
            "_dark": "inset 0 1px 2px 0 hsl(220 40% 2% / calc(25% + 9%)), inset 0 -.5px 0 0 #fff1, inset 0 .5px 0 0 #0007",
          },
        },
        "inner2": {
          "value": {
            "_dark": "inset 0 1px 4px 0 hsl(220 40% 2% / calc(25% + 9%)), inset 0 -.5px 0 0 #fff1, inset 0 .5px 0 0 #0007",
          },
        },
        "inner3": {
          "value": {
            "_dark": "inset 0 2px 8px 0 hsl(220 40% 2% / calc(25% + 9%)), inset 0 -.5px 0 0 #fff1, inset 0 .5px 0 0 #0007",
          },
        },
        "inner4": {
          "value": {
            "_dark": "inset 0 2px 14px 0 hsl(220 40% 2% / calc(25% + 9%)), inset 0 -.5px 0 0 #fff1, inset 0 .5px 0 0 #0007",
          },
        },
      }
    `)
  })
})
