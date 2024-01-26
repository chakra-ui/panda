import { describe, expect, test } from 'vitest'
import { gradients, noiseFilters } from '../src/gradients'

describe('Open Prop preset transforms', () => {
  test('Should transform graidents correctly', () => {
    expect(gradients).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "linear-gradient(to bottom right,#1f005c, #5b0060, #870160, #ac255e, #ca485c, #e16b5c, #f39060, #ffb56b)",
        },
        "10": {
          "value": "conic-gradient(from 90deg at 40% -25%, #ffd700, #f79d03, #ee6907, #e6390a, #de0d0d, #d61039, #cf1261, #c71585, #cf1261, #d61039, #de0d0d, #ee6907, #f79d03, #ffd700, #ffd700, #ffd700)",
        },
        "11": {
          "value": "conic-gradient(at bottom left, deeppink, cyan)",
        },
        "12": {
          "value": "conic-gradient(from 90deg at 25% -10%, #ff4500, #d3f340, #7bee85, #afeeee, #7bee85)",
        },
        "13": {
          "value": "radial-gradient(circle at 50% 200%, #000142, #3b0083, #b300c3, #ff059f, #ff4661, #ffad86, #fff3c7)",
        },
        "14": {
          "value": "conic-gradient(at top right, lime, cyan)",
        },
        "15": {
          "value": "linear-gradient(to bottom right, #c7d2fe, #fecaca, #fef3c7)",
        },
        "16": {
          "value": "radial-gradient(circle at 50% -250%, #374151, #111827, #000)",
        },
        "17": {
          "value": "conic-gradient(from -90deg at 50% -25%, blue, blueviolet)",
        },
        "18": {
          "value": "
          linear-gradient(0deg,   hsla(0   100% 50% / 80%), hsla(0   100% 50% / 0) 75%),
          linear-gradient(60deg,  hsla(60  100% 50% / 80%), hsla(60  100% 50% / 0) 75%),
          linear-gradient(120deg, hsla(120 100% 50% / 80%), hsla(120 100% 50% / 0) 75%),
          linear-gradient(180deg, hsla(180 100% 50% / 80%), hsla(180 100% 50% / 0) 75%),
          linear-gradient(240deg, hsla(240 100% 50% / 80%), hsla(240 100% 50% / 0) 75%),
          linear-gradient(300deg, hsla(300 100% 50% / 80%), hsla(300 100% 50% / 0) 75%)
        ",
        },
        "19": {
          "value": "linear-gradient(to bottom right,#ffe259,#ffa751)",
        },
        "2": {
          "value": "linear-gradient(to bottom right,#48005c, #8300e2, #a269ff)",
        },
        "20": {
          "value": "conic-gradient(from -135deg at -10% center, #ffa500, #ff7715, #ff522a, #ff3f47, #ff5482, #ff69b4)",
        },
        "21": {
          "value": "conic-gradient(from -90deg at 25% 115%, #ff0000, #ff0066, #ff00cc, #cc00ff, #6600ff, #0000ff, #0000ff, #0000ff, #0000ff)",
        },
        "22": {
          "value": "linear-gradient(to bottom right,#acb6e5,#86fde8)",
        },
        "23": {
          "value": "linear-gradient(to bottom right,#536976,#292E49)",
        },
        "24": {
          "value": "conic-gradient(from .5turn at 0% 0%, #00c476, 10%, #82b0ff, 90%, #00c476)",
        },
        "25": {
          "value": "conic-gradient(at 125% 50%, #b78cf7, #ff7c94, #ffcf0d, #ff7c94, #b78cf7)",
        },
        "26": {
          "value": "linear-gradient(to bottom right,#9796f0,#fbc7d4)",
        },
        "27": {
          "value": "conic-gradient(from .5turn at bottom left, deeppink, rebeccapurple)",
        },
        "28": {
          "value": "conic-gradient(from -90deg at 50% 105%, white, orchid)",
        },
        "29": {
          "value": "
          radial-gradient(
            circle at top right, 
            hsl(250 100% 85%), hsl(250 100% 85% / 0%)
          ),
          radial-gradient(
            circle at bottom left, 
            hsl(220 90% 75%), hsl(220 90% 75% / 0%)
          )",
        },
        "3": {
          "value": "
          radial-gradient(
            circle at top right, 
            hsl(180 100% 50%), hsl(180 100% 50% / 0%)
          ),
          radial-gradient(
            circle at bottom left, 
            hsl(328 100% 54%), hsl(328 100% 54% / 0%)
          )",
        },
        "30": {
          "value": "radial-gradient(
            circle at top right, 
            hsl(150 100% 50%), hsl(150 100% 50% / 0%)
          ),
          radial-gradient(
            circle at bottom left, 
            hsl(150 100% 84%), hsl(150 100% 84% / 0%)
          )",
        },
        "4": {
          "value": "linear-gradient(to bottom right,#00F5A0,#00D9F5)",
        },
        "5": {
          "value": "conic-gradient(from -270deg at 75% 110%, fuchsia, floralwhite)",
        },
        "6": {
          "value": "conic-gradient(from -90deg at top left, black, white)",
        },
        "7": {
          "value": "linear-gradient(to bottom right,#72C6EF,#004E8F)",
        },
        "8": {
          "value": "conic-gradient(from 90deg at 50% 0%, #111, 50%, #222, #111)",
        },
        "9": {
          "value": "conic-gradient(from .5turn at bottom center, lightblue, white)",
        },
        "noise1": {
          "value": "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\\")",
        },
        "noise2": {
          "value": "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\\")",
        },
        "noise3": {
          "value": "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.25' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\\")",
        },
        "noise4": {
          "value": "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 2056 2056' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\\")",
        },
        "noise5": {
          "value": "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 2056 2056' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\\")",
        },
      }
    `)
    expect(noiseFilters).toMatchInlineSnapshot(`
      {
        "noisefilter1": "contrast(300%) brightness(100%)",
        "noisefilter2": "contrast(200%) brightness(150%)",
        "noisefilter3": "contrast(200%) brightness(250%)",
        "noisefilter4": "contrast(200%) brightness(500%)",
        "noisefilter5": "contrast(200%) brightness(1000%)",
      }
    `)
  })
})
