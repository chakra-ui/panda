import { solidJsxFactoryArtifact } from './jsx'
import { solidJsxStringLiteralFactoryArtifact } from './jsx.string-literal'
import { solidJsxFactoryStringLiteralTypesArtifact, solidJsxTypesStringLiteralArtifact } from './types.string-literal'
import { generateSolidJsxPattern } from './pattern'
import { solidJsxFactoryTypesArtifact, solidJsxTypesArtifact } from './types'

export const solidJsx = {
  jsxFactory: { js: solidJsxFactoryArtifact, dts: solidJsxFactoryTypesArtifact },
  jsxTypes: solidJsxTypesArtifact,
  stringLiteral: {
    jsxFactory: { js: solidJsxStringLiteralFactoryArtifact, dts: solidJsxFactoryStringLiteralTypesArtifact },
    jsxTypes: solidJsxTypesStringLiteralArtifact,
  },
  generatePatterns: generateSolidJsxPattern,
}
