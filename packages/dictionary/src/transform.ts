import { isString } from '@css-panda/shared'
import type { RegisterTransform } from './dictionary'
import type { Token } from './token'

export const transformShadow: RegisterTransform = {
  type: 'value',
  name: 'shadow',
  match: (token) => token.extensions.category === 'shadows',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }

    if (Array.isArray(token.value)) {
      return token.value.map((value) => this.transform({ value } as Token)).join(', ')
    }

    const { offsetX, offsetY, blur, spread, color, inset } = token.value
    return `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`
  },
}

export const transformGradient: RegisterTransform = {
  type: 'value',
  name: 'gradient',
  match: (token) => token.extensions.category === 'gradients',
  transform(token) {
    if (isString(token.value)) {
      return token.value
    }

    const { type, stops, placement } = token.value

    const rawStops = stops.map((stop: any) => {
      const { color, position } = stop
      return `${color} ${position}px`
    })

    return `${type}-gradient(${placement}, ${rawStops.join(', ')})`
  },
}
