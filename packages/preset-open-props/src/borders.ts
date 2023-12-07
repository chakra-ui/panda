import Borders from 'open-props/src/borders'

export const borderWidths = Object.entries(Borders)
  .filter(([key]) => key.includes('-size-'))
  .reduce((acc, [key, value]) => Object.assign({}, acc, { [key.replace('--border-size-', '')]: { value } }), {})

export const radii = Object.entries(Borders)
  .filter(([key]) => !key.includes('-size-'))
  .reduce((acc, [key, value]) => Object.assign({}, acc, { [key.replace('--radius-', '')]: { value } }), {})
