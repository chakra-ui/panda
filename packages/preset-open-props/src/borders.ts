import Borders from 'open-props/src/borders'

export const borderWidths = Object.fromEntries(
  Object.entries(Borders)
    .filter(([key]) => key.includes('-size-'))
    .map(([key, value]) => [key.replace('--border-size-', ''), { value }]),
)

export const radii = Object.fromEntries(
  Object.entries(Borders)
    .filter(([key]) => !key.includes('-size-'))
    .map(([key, value]) => [
      key.replace('--radius-', ''),
      { value: value.replace(/var\(--radius-([^)]+)\)/g, '{radii.$1}') },
    ]),
)
