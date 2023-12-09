import Sizes from 'open-props/src/sizes'
import { transformOpenPropsObj } from './utils'

export const spacing = transformOpenPropsObj(Sizes, (key) => key.replace('--size-', ''))
export const sizes = spacing
