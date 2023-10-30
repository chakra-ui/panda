import { prettify } from '@/utils/prettify'

export const getConfig = (
  config: string = 'theme: { extend: {} },',
  otherCode?: string,
  imports = 'import { defineConfig } from "@pandacss/dev";'
) => {
  return prettify(`${imports ?? ''}

  ${otherCode ?? ''}

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
  });`)
}
