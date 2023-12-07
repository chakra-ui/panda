import Colors from 'open-props/src/colors'
import ColorsHSL from 'open-props/src/colors-hsl'
import { transformOpenPropsObj } from './utils'

const base = transformOpenPropsObj(Colors)
const hsl = transformOpenPropsObj(ColorsHSL)

export const colors = Object.assign({}, base, hsl)
