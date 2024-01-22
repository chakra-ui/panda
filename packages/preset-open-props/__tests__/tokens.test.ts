import { describe, expect, test } from 'vitest'
import { transformOpenPropsObj } from '../src/utils'

describe('Open Prop preset transforms', () => {
  test('Should transform open props tokens correctly', () => {
    const sampleTokenCollection = {
      '--gray-0': '#f8f9fa',
      '--gray-1': '#f1f3f5',
      '--gray-2': '#e9ecef',
      '--gray-3': '#dee2e6',
      '--gray-4': '#ced4da',
      '--gray-5': '#adb5bd',
    }

    expect(transformOpenPropsObj(sampleTokenCollection)).toMatchInlineSnapshot(`
      {
        "gray0": {
          "value": "#f8f9fa",
        },
        "gray1": {
          "value": "#f1f3f5",
        },
        "gray2": {
          "value": "#e9ecef",
        },
        "gray3": {
          "value": "#dee2e6",
        },
        "gray4": {
          "value": "#ced4da",
        },
        "gray5": {
          "value": "#adb5bd",
        },
      }
    `)
  })
})
