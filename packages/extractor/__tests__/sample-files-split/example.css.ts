import { flatColors } from './flat-colors'
import { defineProperties } from '@box-extractor/vanilla-wind'

const colors = { ...flatColors, main: '#d2a8ff', secondary: '#7ee787' }
const breakpoins = { mobile: '320px', tablet: '768px', desktop: '1024px' }
const breakpointToCondition = (name: string, minWidth: string) => ({
  [name]: { '@media': `(min-width: ${minWidth})` },
})

export const exampleSprinkles = defineProperties({
  conditions: {
    ...Object.entries(breakpoins).reduce(
      (acc, [name, minWidth]) => ({ ...acc, ...breakpointToCondition(name, minWidth) }),
      {},
    ),
    idle: {},
    focus: { selector: '&:focus' },
    hover: { selector: '&:hover' },
  },
  defaultCondition: 'idle',
  properties: {
    position: ['relative', 'absolute'],
    display: ['block', 'inline-block', 'flex', 'inline-flex'],
    color: {
      ...colors,
      brand: 'red',
      other: 'blue',
    },
  },
  shorthands: {
    p: ['position'],
    d: ['display'],
  },
})
