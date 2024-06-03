import { match } from 'ts-pattern'
import { ArtifactFile } from '../artifact-map'
import isValidPropJson from '../generated/is-valid-prop.mjs.json' assert { type: 'json' }

const cssPropRegex = /var cssPropertiesStr = ".*?";/
const memoFnDeclarationRegex = /function memo(.+?)\nvar cssPropertySelectorRegex/s

export const isValidPropJsArtifact = new ArtifactFile({
  id: 'jsx/is-valid-prop.js',
  fileName: 'is-valid-prop',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  imports: (ctx) => {
    const helpersImports = ['splitProps']

    // we want memo if we're using style props
    if (ctx.jsx.styleProps === 'all') {
      helpersImports.push('memo')
    }

    return {
      'helpers.js': helpersImports,
    }
  },
  dependencies: [
    'syntax',
    'jsxFramework',
    'jsxStyleProps',
    'utilities',
    'conditions',
    'theme.breakpoints',
    'theme.containerNames',
    'theme.containerSizes',
  ],
  computed(ctx) {
    return {
      isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax,
      jsx: ctx.jsx,
      properties: ctx.properties,
    }
  },
  code(params) {
    if (params.computed.isTemplateLiteralSyntax) return
    if (!params.computed.jsx.framework) return

    let content = isValidPropJson.content

    // replace user generated props by those from ctx, `css` or nothing
    content = content.replace(
      'var userGeneratedStr = "";',
      `var userGeneratedStr = "${match(params.computed.jsx.styleProps)
        .with('all', () => Array.from(params.computed.properties).join(','))
        .with('minimal', () => 'css')
        .with('none', () => 'css')
        .exhaustive()}"`,
    )

    // replace memo function declaration with an import from helpers
    content = content.replace(memoFnDeclarationRegex, 'var cssPropertySelectorRegex')

    // remove browser CSS props / memo function call when not needed
    if (params.computed.jsx.styleProps === 'minimal' || params.computed.jsx.styleProps === 'none') {
      content = content.replace('/* @__PURE__ */ memo(', '/* @__PURE__ */ (')
      content = content.replace(cssPropRegex, 'var cssPropertiesStr = "";')
    }

    content += `export const splitCssProps = (props) =>  splitProps(props, isCssProperty)`

    return content
  },
})

export const isValidPropDtsArtifact = new ArtifactFile({
  id: 'jsx/is-valid-prop.d.ts',
  fileName: 'is-valid-prop',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFramework'],
  importsType: {
    'types/index.d.ts': ['DistributiveOmit', 'JsxStyleProps', 'Pretty'],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    if (!params.computed.jsx.framework) return

    return `
    declare const isCssProperty: (value: string) => boolean;

    type CssPropKey = keyof JsxStyleProps
    type OmittedCssProps<T> = Pretty<DistributiveOmit<T, CssPropKey>>

    declare const splitCssProps: <T>(props: T) => [JsxStyleProps, OmittedCssProps<T>]

    export { isCssProperty, splitCssProps };
    `
  },
})
