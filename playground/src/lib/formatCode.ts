import { format } from 'prettier'
import postcss from 'prettier/parser-postcss'

export function formatCode(code: string) {
  return format(code, {
    parser: 'css',
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'always',
    semi: false,
    plugins: [postcss],
  })
}
