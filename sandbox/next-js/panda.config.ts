import { defineConfig } from 'css-panda'

export default defineConfig({
  presets: ['css-panda/presets'],
  outdir: 'styled-system',
  include: ['pages/**/*.jsx'],
  layerStyles: {
    Orange: {
      value: {
        background: 'orange',
        height: '150px',
      },
    },
    Blue: {
      value: {
        background: 'blue',
        height: '150px',
      },
    },
  },
})
