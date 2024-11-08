import { definePreset } from '@pandacss/dev'

export default definePreset({
  name: 'custom-condition',
  theme: {
    extend: {
      tokens: {
        colors: {
          custom: { value: 'red' },
        },
      },
    },
  },
})
