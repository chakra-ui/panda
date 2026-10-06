import codegenPreset from './preset'

export default {
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda', codegenPreset],
  hash: true,
  include: ['./__tests__/fixtures/hash/**/*.ts'],
  exclude: [],
  outdir: 'styled-system-hash',
  jsxFramework: 'react',
}
