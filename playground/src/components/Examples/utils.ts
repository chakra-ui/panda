export const getConfig = (
  config?: string,
  otherCode?: string,
  imports = 'import { defineConfig } from "@pandacss/dev";',
) => {
  const conf = `${imports ?? ''}${otherCode ? `\n\n${otherCode}` : ''}

export const config = defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  ${config ?? ''}${config?.endsWith(',') ? '' : ','}
  globalCss: {
    html: {
      h: 'full',
    },
    body: {
      bg: { base: 'white', _dark: '#2C2C2C' },
    },
  },
  jsxFramework: 'react',
  validation: 'error',
});`

  return conf
}
