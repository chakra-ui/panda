import { describe, expect, test } from 'vitest'
import { borderWidths, radii } from '../src/borders'

describe('Open Prop preset transforms', () => {
  test('Should transform borders correctly', () => {
    expect(borderWidths).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "1px",
        },
        "2": {
          "value": "2px",
        },
        "3": {
          "value": "5px",
        },
        "4": {
          "value": "10px",
        },
        "5": {
          "value": "25px",
        },
      }
    `)
    expect(radii).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "2px",
        },
        "2": {
          "value": "5px",
        },
        "3": {
          "value": "1rem",
        },
        "4": {
          "value": "2rem",
        },
        "5": {
          "value": "4rem",
        },
        "6": {
          "value": "8rem",
        },
        "blob-1": {
          "value": "30% 70% 70% 30% / 53% 30% 70% 47%",
        },
        "blob-2": {
          "value": "53% 47% 34% 66% / 63% 46% 54% 37%",
        },
        "blob-3": {
          "value": "37% 63% 56% 44% / 49% 56% 44% 51%",
        },
        "blob-4": {
          "value": "63% 37% 37% 63% / 43% 37% 63% 57%",
        },
        "blob-5": {
          "value": "49% 51% 48% 52% / 57% 44% 56% 43%",
        },
        "conditional-1": {
          "value": "clamp(0px, calc(100vw - 100%) * 1e5, {radii.1})",
        },
        "conditional-2": {
          "value": "clamp(0px, calc(100vw - 100%) * 1e5, {radii.2})",
        },
        "conditional-3": {
          "value": "clamp(0px, calc(100vw - 100%) * 1e5, {radii.3})",
        },
        "conditional-4": {
          "value": "clamp(0px, calc(100vw - 100%) * 1e5, {radii.4})",
        },
        "conditional-5": {
          "value": "clamp(0px, calc(100vw - 100%) * 1e5, {radii.5})",
        },
        "conditional-6": {
          "value": "clamp(0px, calc(100vw - 100%) * 1e5, {radii.6})",
        },
        "round": {
          "value": "1e5px",
        },
      }
    `)
  })
})
