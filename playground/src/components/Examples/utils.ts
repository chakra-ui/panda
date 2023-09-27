import prettier from 'prettier'
import typescript from 'prettier/parser-typescript'

const formatText = (text: string) => {
  return prettier.format(text, {
    parser: 'typescript',
    plugins: [typescript],
    singleQuote: true,
  })
}

export const getConfig = (
  config?: string,
  otherCode?: string,
  imports = 'import { defineConfig } from "@pandacss/dev";',
) => {
  return formatText(`${imports ?? ''}

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
