import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateQwikJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    return {
      name: dashName,
      js: outdent`
      import { h } from '@builder.io/qwik'
      ${ctx.file.import('mergeCss', '../css/css')}
      ${ctx.file.import('splitProps', '../helpers')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}
      ${ctx.file.import(factoryName, './factory')}

      export const ${jsxName} = /* @__PURE__ */ function ${jsxName}(props) {
        ${match(jsxStyleProps)
          .with(
            'none',
            () => outdent`
          const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})
          
          const styleProps = ${styleFnName}(patternProps)
          const Comp = ${factoryName}("${jsxElement}", { base: styleProps })
          
          return h(Comp, restProps)
          `,
          )
          .with(
            'minimal',
            () => outdent`
          const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})
          
          const styleProps = ${styleFnName}(patternProps)
          const cssProps = { css: mergeCss(styleProps, props.css) }
          const mergedProps = { ...restProps, ...cssProps }

          return h(${factoryName}.${jsxElement}, mergedProps)
          `,
          )
          .with(
            'all',
            () => outdent`
          const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})
          
          const styleProps = ${styleFnName}(patternProps)
          const mergedProps = { ...styleProps, ...restProps }
          
          return h(${factoryName}.${jsxElement}, mergedProps)
          `,
          )
          .exhaustive()}
      }
      `,

      dts: outdent`
      import type { Component } from '@builder.io/qwik'
      ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
      ${ctx.file.importType(typeName, '../types/jsx')}
      ${ctx.file.importType('Assign, DistributiveOmit', '../types/system-types')}

      export interface ${upperName}Props extends Assign<${typeName}<'${jsxElement}'>, DistributiveOmit<${upperName}Properties, ${
        blocklistType || '""'
      }>> {}

      ${description ? `/** ${description} */` : ''}
      export declare const ${jsxName}: Component<${upperName}Props>
      `,
    }
  })
}
