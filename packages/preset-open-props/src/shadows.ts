import Shadows from 'open-props/src/shadows'
import { camelize } from './utils'

const _shadows = Object.entries(Shadows).filter(([key]) => /--(shadow|inner-shadow)-\d+/.test(key))

const _shadow_vars = Object.keys(Shadows).filter(
  (key) => !/--(shadow|inner-shadow)-\d+/.test(key) && !key.includes('media:dark'),
)

export const shadows = Object.fromEntries(
  _shadows.map(([key, _value]) => {
    const value = _shadow_vars.reduce((result, str) => {
      return result.replaceAll(`var(${str})`, Shadows[str as keyof typeof Shadows])
    }, _value)
    return [
      camelize(key.replace('-shadow-', '')),
      {
        value,
      },
    ]
  }),
)
export const semanticShadows = Object.fromEntries(
  _shadows.map(([key, _value]) => {
    const value = _shadow_vars.reduce((result, str) => {
      return result.replaceAll(`var(${str})`, Shadows[(str + '-@media:dark') as keyof typeof Shadows])
    }, _value)
    return [
      camelize(key.replace('-shadow-', '')),
      {
        value: { _dark: value },
      },
    ]
  }),
)
