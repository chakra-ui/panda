import { type Artifact, ArtifactFile } from '../artifact'
import astishMjs from '../generated/astish.mjs.json' assert { type: 'json' }
import helpersMjs from '../generated/helpers.mjs.json' assert { type: 'json' }
import normalizeHtmlMjs from '../generated/normalize-html.mjs.json' assert { type: 'json' }

const helpersJsArtifact = new ArtifactFile({
  id: 'helpers.js',
  fileName: 'helpers',
  type: 'js',
  dir: (ctx) => ctx.paths.root,
  dependencies: ['syntax', 'jsxFramework'],
  computed(ctx) {
    return { isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax, jsx: ctx.jsx }
  },
  code(params) {
    return `
    ${helpersMjs.content}
    ${params.computed.isTemplateLiteralSyntax ? astishMjs.content : ''}

    ${params.computed.jsx.framework ? `${normalizeHtmlMjs.content}` : ''}

    export function __spreadValues(a, b) {
      return { ...a, ...b }
    }

    export function __objRest(source, exclude) {
      return Object.fromEntries(Object.entries(source).filter(([key]) => !exclude.includes(key)))
    }
    `
  },
})

export const helpersArtifact: Artifact = {
  id: 'helpers',
  files: [helpersJsArtifact],
}
