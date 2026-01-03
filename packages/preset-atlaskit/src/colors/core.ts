import type { Tokens } from '@pandacss/types'

export const colors: Tokens['colors'] = {
  background: {
    neutral: {
      subtle: {
        DEFAULT: { value: '#00000000' },
      },
    },
    warning: {
      bold: {
        DEFAULT: { value: '#F5CD47' },
        hovered: { value: '#E2B203' },
        pressed: { value: '#CF9F02' },
      },
    },
  },
  chart: {
    categorical: {
      '1': {
        DEFAULT: { value: '#2898BD' },
      },
      '3': {
        DEFAULT: { value: '#E56910' },
      },
    },
  },
}
