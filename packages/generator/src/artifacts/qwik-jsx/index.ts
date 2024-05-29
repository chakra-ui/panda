import { qwikJsxFactoryArtifact } from './jsx'
import { qwikJsxStringLiteralFactoryArtifact } from './jsx.string-literal'
import { qwikJsxFactoryStringLiteralTypesArtifact, qwikJsxTypesStringLiteralArtifact } from './types.string-literal'
import { generateQwikJsxPattern } from './pattern'
import { qwikJsxFactoryTypesArtifact, qwikJsxTypesArtifact } from './types'

export const qwikJsx = {
  jsxFactory: { js: qwikJsxFactoryArtifact, dts: qwikJsxFactoryTypesArtifact },
  jsxTypes: qwikJsxTypesArtifact,
  stringLiteral: {
    jsxFactory: { js: qwikJsxStringLiteralFactoryArtifact, dts: qwikJsxFactoryStringLiteralTypesArtifact },
    jsxTypes: qwikJsxTypesStringLiteralArtifact,
  },
  generatePatterns: generateQwikJsxPattern,
}
