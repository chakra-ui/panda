import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const background: UtilityConfig = {
  backgroundPosition: {
    shorthand: 'bgPosition',
    className: 'bg-pos',
    group: 'Background',
  },
  backgroundPositionX: {
    shorthand: 'bgPositionX',
    className: 'bg-pos-x',
    group: 'Background',
  },
  backgroundPositionY: {
    shorthand: 'bgPositionY',
    className: 'bg-pos-y',
    group: 'Background',
  },
  backgroundAttachment: {
    shorthand: 'bgAttachment',
    className: 'bg-attach',
    group: 'Background',
  },
  backgroundClip: {
    shorthand: 'bgClip',
    className: 'bg-clip',
    group: 'Background',
    transform(value) {
      return {
        backgroundClip: value,
        WebkitBackgroundClip: value,
      }
    },
  },
  background: {
    shorthand: 'bg',
    className: 'bg',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('background'),
  },
  backgroundColor: {
    shorthand: 'bgColor',
    className: 'bg-color',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('backgroundColor'),
  },
  backgroundOrigin: {
    shorthand: 'bgOrigin',
    className: 'bg-origin',
    group: 'Background',
  },
  backgroundImage: {
    shorthand: 'bgImage',
    className: 'bg-img',
    values: 'assets',
    group: 'Background',
  },
  backgroundRepeat: {
    shorthand: 'bgRepeat',
    className: 'bg-repeat',
    group: 'Background',
  },
  backgroundBlendMode: {
    shorthand: 'bgBlendMode',
    className: 'bg-blend',
    group: 'Background',
  },
  backgroundSize: {
    shorthand: 'bgSize',
    className: 'bg-size',
    group: 'Background',
  },
}
