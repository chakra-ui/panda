import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateReactJsxTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { ComponentPropsWithoutRef, ElementType, ElementRef, Ref } from 'react'
import type { Assign, DistributiveOmit, JsxStyleProps, JsxHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe'

type Dict = Record<string, unknown>

type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
  ref?: Ref<ElementRef<T>>
}

export type ${componentName}<T extends ElementType, P extends Dict = {}> = {
  (props: JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>): JSX.Element
  displayName?: string
}

type RecipeFn = { __type: any }

interface JsxFactory {
  ${styleProps === 'none' ? '' : `<T extends ElementType>(component: T): ${componentName}<T, {}>`}
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
}

type JsxElements = { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
