import { definePreset } from '@pandacss/dev'

export const examplePreset = definePreset({
  name: '@v2-ds-example/lib/preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: '#3b82f6' },
          surface: { value: '#f8fafc' },
        },
      },
      recipes: {
        button: {
          className: 'example',
          base: { px: '4', py: '2', borderRadius: '6px', fontWeight: 'bold' },
          variants: {
            visual: {
              solid: { bg: 'brand', color: 'white' },
              outline: { borderWidth: '1px', borderColor: 'brand', color: 'brand' },
            },
          },
        },
      },
    },
  },
})
