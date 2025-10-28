import type { Tokens } from '@pandacss/types'

export const fontSizes: Tokens['fontSizes'] = {
  heading: {
    xxlarge: { value: '32px' },
    xlarge: { value: '28px' },
    large: { value: '24px' },
    medium: { value: '20px' },
    small: { value: '16px' },
    xsmall: { value: '14px' },
    xxsmall: { value: '12px' },
  },
  body: {
    large: { value: '16px' },
    DEFAULT: { value: '14px' },
    small: { value: '12px' },
    UNSAFE_small: { value: '12px' },
  },
  metric: {
    large: { value: '28px' },
    medium: { value: '24px' },
    small: { value: '16px' },
  },
  code: {
    DEFAULT: { value: '0.875em' },
  },
}
