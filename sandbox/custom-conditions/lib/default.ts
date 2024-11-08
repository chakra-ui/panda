import { definePreset } from '@pandacss/dev'

export default definePreset({
  name: 'default',
  theme: {
    extend: {
      tokens: {
        colors: {
          default: { value: 'blue' },
        },
      },
    },
  },
})
