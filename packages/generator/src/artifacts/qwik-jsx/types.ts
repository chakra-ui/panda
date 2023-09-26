import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, QwikIntrinsicElements } from '@builder.io/qwik'
import type { Assign, JsxStyleProps, PatchedHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe'

type ElementType = keyof QwikIntrinsicElements | Component<any>

export type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends Component<infer P>
  ? P
  : never

type Dict = Record<string, unknown>

export interface ${componentName}<T extends ElementType, P extends Dict = {}> extends Component<Assign<ComponentProps<T>, PatchedHTMLProps, Assign<JsxStyleProps, P>>> {}

interface RecipeFn { __type: any }

interface JsxFactory {
  ${styleProps === 'none' ? '' : `<T extends ElementType>(component: T): ${componentName}<T, {}>`}
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
}

type JsxElements = { [K in keyof QwikIntrinsicElements]: ${componentName}<K, {}> }

export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

export type ${typeName}<T extends ElementType> = Assign<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
