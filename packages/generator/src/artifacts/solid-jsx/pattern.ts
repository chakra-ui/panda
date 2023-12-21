import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateSolidJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    return {
      name: dashName,
      js: outdent`
    import { createMemo, mergeProps, splitProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import('mergeCss', '../css/css')}
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
        
        return createComponent(Comp, restProps)
        `,
        )
        .with(
          'minimal',
          () => outdent`
        const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})
        
        const cssProps = createMemo(() => {
          const styleProps = ${styleFnName}(patternProps)
          return { css: mergeCss(styleProps, props.css) }
        })
        const mergedProps = mergeProps(restProps, cssProps)

        return createComponent(${factoryName}.${jsxElement}, mergedProps)
        `,
        )
        .with(
          'all',
          () => outdent`
        const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})
        
        const styleProps = ${styleFnName}(patternProps)        
        const mergedProps = mergeProps(styleProps, restProps)
        
        return createComponent(${factoryName}.${jsxElement}, mergedProps)
        `,
        )
        .exhaustive()}
    }
    `,

      dts: outdent`
    import type { Component } from 'solid-js'
    ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
    ${ctx.file.importType(typeName, '../types/jsx')}
    ${ctx.file.importType('DistributiveOmit', '../types/system-types')}

    export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

    ${description ? `/** ${description} */` : ''}
    export declare const ${jsxName}: Component<${upperName}Props>
    `,
    }
  })
}
