import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { FunctionComponent, QwikIntrinsicElements } from '@builder.io/qwik'
import type { Assign as _Assign, JsxStyleProps, PatchedHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe'

type ElementType = keyof QwikIntrinsicElements | FunctionComponent<any>

type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends FunctionComponent<infer P>
  ? P
  : never

type Dict = Record<string, unknown>

type Omitted = 'color' | 'translate' | 'transition' | 'width' | 'height' | 'size' | 'content'

// Patch due to Omit<T, K> not working with Qwik JSX Types

type Assign<T, U> = {
  [K in keyof T]?: K extends Omitted
    ? K extends keyof U
      ? U[K]
      : never
    : K extends keyof T
    ? K extends keyof U
      ? T[K] & U[K]
      : T[K]
    : never
} & U & PatchedHTMLProps

export type ${componentName}<T extends ElementType, P extends Dict = {}> = FunctionComponent<Assign<ComponentProps<T>, _Assign<JsxStyleProps, P>>>

type RecipeFn = { __type: any }

interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
}

type JsxElements = { [K in keyof QwikIntrinsicElements]: ${componentName}<K, {}> }

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = Assign<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
