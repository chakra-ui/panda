import Animations from 'open-props/src/animations'
import Easings from 'open-props/src/easing'
import { cssKeyframesToObj, transformOpenPropsObj } from './utils'
import type { Dict } from '@pandacss/types'

export const easings = transformOpenPropsObj(
  Easings,
  (key) => key.replace('--ease-', ''),
  (value) => value.replace(/var\(--ease-([^)]+)\)/g, '{easings.$1}'),
)

const _keyframes = Object.entries(Animations).filter(([key]) => key.includes('@'))
export const keyframes = _keyframes.reduce((acc, [_key, value]) => {
  const key = _key.replace(/--animation-(.*?)-@(.*)/, '$1')
  const suffix = _key.includes('media:dark') ? '-dark' : ''

  return Object.assign({}, acc, {
    [key + suffix]: cssKeyframesToObj(value),
  })
}, {})

export const animations = Object.entries(Animations)
  .filter(([key]) => !key.includes('@'))
  .reduce(
    (acc, [key, value]) =>
      Object.assign({}, acc, {
        [key.replace('--animation-', '')]: { value: value.replace(/var\(--ease-([^)]+)\)/g, '{easings.$1}') },
      }),
    {} as Dict,
  )

export const semanticAnimations = _keyframes
  .filter(([key]) => key.includes('media:dark'))
  .reduce((acc, [_key]) => {
    const key = _key.replace(/--animation-(.*?)-@(.*)/, '$1')
    const value = animations[key].value
    return Object.assign({}, acc, {
      [key]: { value: { _dark: value.replace(key, key + '-dark') } },
    })
  }, {})
