export const DEFAULT_PRESETS = ['@pandacss/preset-base', '@pandacss/preset-panda']

export const getConfig = (
  config?: string,
  otherCode?: string,
  imports = 'import { defineConfig } from "@pandacss/dev";',
  presets: string[] = DEFAULT_PRESETS,
) => {
  const conf = `${imports ?? ''}${otherCode ? `\n\n${otherCode}` : ''}

export const config = defineConfig({
  ${config ?? ''}${config?.endsWith(',') ? '' : ','}
  presets: ${JSON.stringify(presets)},
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
