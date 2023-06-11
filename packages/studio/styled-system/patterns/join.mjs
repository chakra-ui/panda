import { mapObject } from '../helpers.mjs'
import { css } from '../css/index.mjs'

const joinConfig = {
  transform(props, { map }) {
    const { orientation = 'horizontal', ...rest } = props
    return {
      display: 'inline-flex',
      alignItems: 'stretch',
      flexDirection: map(orientation, (v) => (v === 'vertical' ? 'column' : 'row')),
      '& > *:focus': {
        isolation: 'isolate',
      },
      '& > *:not(:first-child):not(:last-child)': {
        borderTopRightRadius: '0',
        borderBottomRightRadius: '0',
        borderBottomLeftRadius: '0',
        borderTopLeftRadius: '0',
      },
      '& > :where(*:not(:first-child))': {
        mt: map(orientation, (v) => (v === 'vertical' ? '-1px' : '0')),
        mr: map(orientation, (v) => (v === 'vertical' ? '0' : void 0)),
        mb: map(orientation, (v) => (v === 'horizontal' ? '0' : void 0)),
        ml: map(orientation, (v) => (v === 'horizontal' ? '-1px' : '0')),
      },
      '& > *:first-child:not(:last-child)': {
        borderBottomLeftRadius: map(orientation, (v) => (v === 'vertical' ? '0' : 'inherit')),
        borderBottomRightRadius: '0',
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: map(orientation, (v) => (v === 'vertical' ? 'inherit' : '0')),
      },
      '& > *:last-child:not(:first-child)': {
        borderBottomLeftRadius: map(orientation, (v) => (v === 'vertical' ? 'inherit' : '0')),
        borderBottomRightRadius: 'inherit',
        borderTopLeftRadius: '0',
        borderTopRightRadius: map(orientation, (v) => (v === 'vertical' ? '0' : 'inherit')),
      },
      ...rest,
    }
  },
}

export const getJoinStyle = (styles = {}) => joinConfig.transform(styles, { map: mapObject })

export const join = (styles) => css(getJoinStyle(styles))
