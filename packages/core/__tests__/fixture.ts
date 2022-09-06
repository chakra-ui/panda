import { breakpoints, conditions } from '@css-panda/fixture'
import postcss from 'postcss'
import { createConditions } from '../src'
import type { GeneratorContext } from '../src/types'

const propMap = {
  display: 'd',
  height: 'h',
  width: 'w',
  minHeight: 'min-h',
  textAlign: 'ta',
}

export const createContext = (): GeneratorContext => ({
  root: postcss.root(),
  conditions: createConditions({
    conditions,
    breakpoints,
  }),
  breakpoints,
  helpers: {
    map: () => '',
  },
  transform: (prop, value) => {
    const key = propMap[prop] ?? prop
    return {
      className: `${key}-${value}`,
      styles: { [prop]: value },
    }
  },
})
