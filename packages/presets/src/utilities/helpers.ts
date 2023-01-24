import type { UtilityConfig } from '@pandacss/types'

const srMapping = {
  true: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  },
  false: {
    position: 'static',
    width: 'auto',
    height: 'auto',
    padding: '0',
    margin: '0',
    overflow: 'visible',
    clip: 'auto',
    whiteSpace: 'normal',
  },
}

export const helpers: UtilityConfig = {
  srOnly: {
    className: 'sr',
    values: { type: 'boolean' },
    transform(value) {
      return srMapping[value] || {}
    },
  },
  debug: {
    className: 'debug',
    values: { type: 'boolean' },
    transform(value) {
      if (!value) return {}
      return {
        outline: '1px solid blue !important',
        '&>*': {
          outline: '1px solid red !important',
        },
      }
    },
  },
}
