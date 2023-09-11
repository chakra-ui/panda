import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}

export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, FunctionalComponent, NativeElements } from 'vue'

${ctx.file.importType('RecipeDefinition, RecipeSelection, RecipeVariantRecord', './recipe')}
${ctx.file.importType('Assign, JsxStyleProps, JsxHTMLProps', './system-types')}

type IntrinsicElement = keyof NativeElements
type ElementType = IntrinsicElement | Component

type ComponentProps<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
  ? Props
  : never

type ${componentName}<T extends ElementType, P extends Dict = {}> = FunctionalComponent<
JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>
>

type RecipeFn = { __type: any }

interface JsxFactory {
  ${styleProps === 'none' ? '' : `<T extends ElementType>(component: T): ${componentName}<T, {}>`}
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
}

type JsxElements = { [K in IntrinsicElement]: ${componentName}<K, {}> }

export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
