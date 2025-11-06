import type { Tokens } from '@pandacss/types'

export const lineHeights: Tokens['lineHeights'] = {
  heading: {
    xxlarge: { value: '36px' },
    xlarge: { value: '32px' },
    large: { value: '28px' },
    medium: { value: '24px' },
    small: { value: '20px' },
    xsmall: { value: '20px' },
    xxsmall: { value: '16px' },
  },
  body: {
    large: { value: '24px' },
    DEFAULT: { value: '20px' },
    small: { value: '16px' },
    UNSAFE_small: { value: '16px' },
  },
  metric: {
    large: { value: '32px' },
    medium: { value: '28px' },
    small: { value: '20px' },
  },
  code: {
    DEFAULT: { value: '1' },
  },
}
