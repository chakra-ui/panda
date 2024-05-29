import { reactJsxFactoryArtifact } from './jsx'
import { reactJsxStringLiteralFactoryArtifact } from './jsx.string-literal'
import { reactJsxFactoryStringLiteralTypesArtifact, reactJsxTypesStringLiteralArtifact } from './types.string-literal'
import { generateReactJsxPattern } from './pattern'
import { reactJsxFactoryTypesArtifact, reactJsxTypesArtifact } from './types'

export const reactJsx = {
  jsxFactory: { js: reactJsxFactoryArtifact, dts: reactJsxFactoryTypesArtifact },
  jsxTypes: reactJsxTypesArtifact,
  stringLiteral: {
    jsxFactory: { js: reactJsxStringLiteralFactoryArtifact, dts: reactJsxFactoryStringLiteralTypesArtifact },
    jsxTypes: reactJsxTypesStringLiteralArtifact,
  },
  generatePatterns: generateReactJsxPattern,
}
