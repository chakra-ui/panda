import isValidPropJson from '../generated/is-valid-prop.mjs.json' assert { type: 'json' }
import type { Context } from '../../engines'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

const cssPropRegex = /var cssPropertiesStr = ".*?";/
const memoFnDeclarationRegex = /function memo(.+?)\nvar cssPropertySelectorRegex/s

const prefixRegex = /^([A-Z]?[a-z]{3,})[A-Z].*$/
const findPrefixes = (properties: string[], ignoredPrefixes: Set<string>) => {
  const prefixes = new Set()
  const unprefixed = new Set()

  properties.forEach((prop) => {
    const prefix = prop.match(prefixRegex)?.[1]
    if (prefix && !ignoredPrefixes.has(prefix)) {
      prefixes.add(prefix)
    } else {
      unprefixed.add(prop)
    }
  })

  return { prefixes, unprefixed }
}

export function generateIsValidProp(ctx: Context) {
  if (ctx.isTemplateLiteralSyntax) return
  let content = isValidPropJson.content

  const { prefixes, unprefixed } = findPrefixes(Array.from(new Set(ctx.properties)), new Set())

  // replace user generated props by those from ctx, `css` or nothing
  content = content
    .replace('var userGeneratedPrefixes = "";', `var userGeneratedPrefixes = "${Array.from(prefixes).join(',')}";`)
    .replace(
      'var userGeneratedStr = "";',
      `var userGeneratedStr = "${match(ctx.jsx.styleProps)
        .with('all', () => Array.from(unprefixed).join(','))
        .with('minimal', () => 'css')
        .with('none', () => '')
        .exhaustive()}";`,
    )

  // replace memo function declaration with an import from helpers
  content = content.replace(memoFnDeclarationRegex, 'var cssPropertySelectorRegex')

  // remove browser CSS props / memo function call when not needed
  if (ctx.jsx.styleProps === 'minimal' || ctx.jsx.styleProps === 'none') {
    content = content.replace('/* @__PURE__ */ memo(', '/* @__PURE__ */ (')
    content = content.replace(cssPropRegex, 'var cssPropertiesStr = "";')
  } else {
    // we want memo if we're using style props
    content = ctx.file.import('memo', '../helpers') + '\n' + content
  }

  return {
    js: content,
    dts: outdent`
    declare const isCssProperty: (value: string) => boolean;

    export { isCssProperty };
    `,
  }
}
