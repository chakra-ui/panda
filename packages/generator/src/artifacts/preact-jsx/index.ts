import { preactJsxFactoryArtifact } from './jsx'
import { preactJsxStringLiteralFactoryArtifact } from './jsx.string-literal'
import { preactJsxFactoryStringLiteralTypesArtifact, preactJsxTypesStringLiteralArtifact } from './types.string-literal'
import { generatePreactJsxPattern } from './pattern'
import { preactJsxFactoryTypesArtifact, preactJsxTypesArtifact } from './types'

export const preactJsx = {
  jsxFactory: { js: preactJsxFactoryArtifact, dts: preactJsxFactoryTypesArtifact },
  jsxTypes: preactJsxTypesArtifact,
  stringLiteral: {
    jsxFactory: { js: preactJsxStringLiteralFactoryArtifact, dts: preactJsxFactoryStringLiteralTypesArtifact },
    jsxTypes: preactJsxTypesStringLiteralArtifact,
  },
  generatePatterns: generatePreactJsxPattern,
}
