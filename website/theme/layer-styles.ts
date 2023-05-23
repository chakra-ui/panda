import { defineLayerStyles } from '@pandacss/dev'

export const layerStyles = defineLayerStyles({
  offShadow: {
    value: {
      border: '3px solid var(--shadow-color, black)',
      boxShadow: '4px 4px 0px 0px var(--shadow-color, black)'
    }
  }
})
