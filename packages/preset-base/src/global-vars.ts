import type { CssPropertyDefinition, GlobalVarsDefinition } from '@pandacss/types'

const effectValues: CssPropertyDefinition = {
  syntax: '*',
  inherits: false,
}

export const globalVars: GlobalVarsDefinition = {
  '--translate-x': {
    syntax: '<length-percentage>',
    initialValue: '0',
    inherits: false,
  },
  '--translate-y': {
    syntax: '<length-percentage>',
    initialValue: '0',
    inherits: false,
  },
  '--translate-z': {
    syntax: '<length>',
    initialValue: '0',
    inherits: false,
  },
  '--rotate-x': {
    syntax: '<angle>',
    initialValue: '0',
    inherits: false,
  },
  '--rotate-y': {
    syntax: '<angle>',
    initialValue: '0',
    inherits: false,
  },
  '--rotate-z': {
    syntax: '<angle>',
    initialValue: '0',
    inherits: false,
  },
  '--scale-x': {
    syntax: '<number> | <percentage>',
    initialValue: '1',
    inherits: false,
  },
  '--scale-y': {
    syntax: '<number> | <percentage>',
    initialValue: '1',
    inherits: false,
  },
  '--scale-z': {
    syntax: '<number>',
    initialValue: '1',
    inherits: false,
  },

  '--gradient-from': {
    syntax: '<color>',
    initialValue: '#000',
    inherits: false,
  },
  '--gradient-via': {
    syntax: '<color>',
    initialValue: '#000',
    inherits: false,
  },
  '--gradient-to': {
    syntax: '<color>',
    initialValue: '#000',
    inherits: false,
  },
  '--gradient-stops': {
    syntax: '*',
    initialValue: '#000',
    inherits: false,
  },
  '--gradient-from-position': {
    syntax: '<length-percentage>',
    initialValue: '0%',
    inherits: false,
  },
  '--gradient-via-position': {
    syntax: '<length-percentage>',
    initialValue: '50%',
    inherits: false,
  },
  '--gradient-to-position': {
    syntax: '<length-percentage>',
    initialValue: '100%',
    inherits: false,
  },
  '--blur': effectValues,
  '--brightness': effectValues,
  '--contrast': effectValues,
  '--grayscale': effectValues,
  '--hue-rotate': effectValues,
  '--invert': effectValues,
  '--saturate': effectValues,
  '--sepia': effectValues,
  '--drop-shadow': effectValues,
  '--backdrop-blur': effectValues,
  '--backdrop-brightness': effectValues,
  '--backdrop-contrast': effectValues,
  '--backdrop-grayscale': effectValues,
  '--backdrop-hue-rotate': effectValues,
  '--backdrop-invert': effectValues,
  '--backdrop-opacity': effectValues,
  '--backdrop-saturate': effectValues,
  '--backdrop-sepia': effectValues,
}
