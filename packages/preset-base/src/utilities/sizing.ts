import type { UtilityConfig, PropertyValues } from '@pandacss/types'

const widthValues: PropertyValues = (theme) => ({
  ...theme('sizes'),
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
  '1/12': '8.333333%',
  '2/12': '16.666667%',
  '3/12': '25%',
  '4/12': '33.333333%',
  '5/12': '41.666667%',
  '6/12': '50%',
  '7/12': '58.333333%',
  '8/12': '66.666667%',
  '9/12': '75%',
  '10/12': '83.333333%',
  '11/12': '91.666667%',
  screen: '100vw',
})

const heightValues: PropertyValues = (theme) => ({
  ...theme('sizes'),
  svh: '100svh',
  lvh: '100lvh',
  dvh: '100dvh',
  screen: '100vh',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
})

export const sizing: UtilityConfig = {
  width: {
    shorthand: 'w',
    className: 'w',
    values: widthValues,
  },
  inlineSize: {
    className: 'w',
    values: widthValues,
  },

  minWidth: {
    shorthand: 'minW',
    className: 'min-w',
    values: widthValues,
  },
  minInlineSize: {
    className: 'min-w',
    values: widthValues,
  },

  maxWidth: {
    shorthand: 'maxW',
    className: 'max-w',
    values: widthValues,
  },
  maxInlineSize: {
    className: 'max-w',
    values: widthValues,
  },

  height: {
    shorthand: 'h',
    className: 'h',
    values: heightValues,
  },
  blockSize: {
    className: 'h',
    values: heightValues,
  },

  minHeight: {
    shorthand: 'minH',
    className: 'min-h',
    values: heightValues,
  },
  minBlockSize: {
    className: 'min-h',
    values: heightValues,
  },

  maxHeight: {
    shorthand: 'maxH',
    className: 'max-h',
    values: heightValues,
  },
  maxBlockSize: {
    className: 'max-b',
    values: heightValues,
  },
}
