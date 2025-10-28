import type { Theme } from '@pandacss/types'

export const textStyles: Theme['textStyles'] = {
  heading: {
    xxlarge: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '32px',
        lineHeight: '36px',
      },
    },
    xlarge: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '28px',
        lineHeight: '32px',
      },
    },
    large: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '24px',
        lineHeight: '28px',
      },
    },
    medium: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '20px',
        lineHeight: '24px',
      },
    },
    small: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '16px',
        lineHeight: '20px',
      },
    },
    xsmall: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '14px',
        lineHeight: '20px',
      },
    },
    xxsmall: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '12px',
        lineHeight: '16px',
      },
    },
  },
  body: {
    large: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '400',
        fontSize: '16px',
        lineHeight: '24px',
      },
    },
    DEFAULT: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '400',
        fontSize: '14px',
        lineHeight: '20px',
      },
    },
    small: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '400',
        fontSize: '12px',
        lineHeight: '16px',
      },
    },
    UNSAFE_small: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '400',
        fontSize: '12px',
        lineHeight: '16px',
      },
    },
  },
  metric: {
    large: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '28px',
        lineHeight: '32px',
      },
    },
    medium: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '24px',
        lineHeight: '28px',
      },
    },
    small: {
      value: {
        fontFamily: 'Atlassian Sans',
        fontWeight: '653',
        fontSize: '16px',
        lineHeight: '20px',
      },
    },
  },
  code: {
    DEFAULT: {
      value: {
        fontFamily: 'Atlassian Mono',
        fontWeight: '400',
        fontSize: '0.875em',
        lineHeight: '1',
      },
    },
  },
}
