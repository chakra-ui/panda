import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const background: UtilityConfig = {
  backgroundPosition: {
    shorthand: 'bgPosition',
    className: 'bg-p',
    group: 'Background',
  },
  backgroundPositionX: {
    shorthand: 'bgPositionX',
    className: 'bg-p-x',
    group: 'Background',
  },
  backgroundPositionY: {
    shorthand: 'bgPositionY',
    className: 'bg-p-y',
    group: 'Background',
  },
  backgroundAttachment: {
    shorthand: 'bgAttachment',
    className: 'bg-a',
    group: 'Background',
  },
  backgroundClip: {
    shorthand: 'bgClip',
    className: 'bg-cp',
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
    className: 'bg-c',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('backgroundColor'),
  },
  backgroundOrigin: {
    shorthand: 'bgOrigin',
    className: 'bg-o',
    group: 'Background',
  },
  backgroundImage: {
    shorthand: 'bgImage',
    className: 'bg-i',
    values: 'assets',
    group: 'Background',
  },
  backgroundRepeat: {
    shorthand: 'bgRepeat',
    className: 'bg-r',
    group: 'Background',
  },
  backgroundBlendMode: {
    shorthand: 'bgBlendMode',
    className: 'bg-bm',
    group: 'Background',
  },
  backgroundSize: {
    shorthand: 'bgSize',
    className: 'bg-s',
    group: 'Background',
  },
}
