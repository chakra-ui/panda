import postcss from 'postcss'
import { GeneratorContext } from '../src/types'
import { conditions, breakpoints } from '@css-panda/fixture'
import { CSSCondition } from '../src'

const propMap = {
  display: 'd',
  height: 'h',
  width: 'w',
  minHeight: 'min-h',
  textAlign: 'ta',
}

export const createContext = (): GeneratorContext => ({
  root: postcss.root(),
  conditions: new CSSCondition({
    conditions,
    breakpoints,
  }),
  breakpoints,
  transform: (prop, value) => {
    const key = propMap[prop] ?? prop
    return {
      className: `${key}-${value}`,
      styles: { [prop]: value },
    }
  },
})
