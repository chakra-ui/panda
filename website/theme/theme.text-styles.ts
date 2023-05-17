import { defineTextStyles } from '@pandacss/dev'

export const textStyles = defineTextStyles({
  panda: {
    h1: {
      value: {
        fontSize: '14.5rem',
        lineHeight: '11.875rem',
        letterSpacing: 'tighter',
        fontWeight: 'bold',
        xlDown: {
          fontSize: '10.5rem',
          lineHeight: '9.375rem'
        },
        lgDown: {
          fontSize: '7.5rem',
          lineHeight: '6.875rem'
        }
      }
    },
    h2: {
      value: {
        fontSize: '3rem',
        lineHeight: '3.75rem',
        letterSpacing: 'tight',
        fontWeight: 'bold',
        xlDown: {
          fontSize: '2.5rem',
          lineHeight: '3.125rem'
        },
        lgDown: {
          fontSize: '1.625rem',
          lineHeight: '2.125rem'
        }
      }
    },
    h3: {
      value: {
        fontSize: '2.5rem',
        lineHeight: '3.125rem',
        letterSpacing: 'tight',
        fontWeight: 'bold',
        xlDown: {
          fontSize: '2rem',
          lineHeight: '2.5rem'
        },
        lgDown: {
          fontSize: '1.5rem',
          lineHeight: '2rem'
        }
      }
    },
    h4: {
      value: {
        fontSize: '1.625rem',
        lineHeight: '2.125rem',
        letterSpacing: 'tight',
        fontWeight: 'medium',
        xlDown: {
          fontSize: '1.25rem',
          lineHeight: '1.75rem'
        },
        lgDown: {
          fontSize: '1.125rem',
          lineHeight: '1.75rem'
        }
      }
    }
  }
})

// lineHeight="32px
