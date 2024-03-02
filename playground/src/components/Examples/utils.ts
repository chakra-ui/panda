export const getConfig = (
  config?: string,
  otherCode?: string,
  imports = 'import { defineConfig } from "@pandacss/dev";',
) => {
  const conf = `${imports ?? ''}${otherCode ? `\n\n${otherCode}` : ''}

export const config = defineConfig({
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
});`

  return conf
}
