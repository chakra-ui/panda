import prettier from 'prettier'
import typescriptPlugin from 'prettier/plugins/typescript'
import * as prettierPluginEstree from 'prettier/plugins/estree'

export const formatTS = (code: string) => {
  try {
    return prettier.format(code, {
      parser: 'typescript',
      plugins: [typescriptPlugin, prettierPluginEstree],
      singleQuote: true,
      trailingComma: 'all',
    })
  } catch (e) {
    console.log('e', e)
    return code
  }
}
