import { vueJsxFactoryArtifact } from './jsx'
import { vueJsxStringLiteralFactoryArtifact } from './jsx.string-literal'
import { vueJsxFactoryStringLiteralTypesArtifact, vueJsxTypesStringLiteralArtifact } from './types.string-literal'
import { generateVueJsxPattern } from './pattern'
import { vueJsxFactoryTypesArtifact, vueJsxTypesArtifact } from './types'

export const vueJsx = {
  jsxFactory: { js: vueJsxFactoryArtifact, dts: vueJsxFactoryTypesArtifact },
  jsxTypes: vueJsxTypesArtifact,
  stringLiteral: {
    jsxFactory: { js: vueJsxStringLiteralFactoryArtifact, dts: vueJsxFactoryStringLiteralTypesArtifact },
    jsxTypes: vueJsxTypesStringLiteralArtifact,
  },
  generatePatterns: generateVueJsxPattern,
}
