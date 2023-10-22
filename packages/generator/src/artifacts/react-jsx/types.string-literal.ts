import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateReactJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { ComponentPropsWithoutRef, ElementType, ElementRef, Ref } from 'react'
${ctx.file.importType('DistributiveOmit', '../types/system-types')}

interface Dict {
  [k: string]: unknown
}

export type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
  ref?: Ref<ElementRef<T>>
}

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string
}

export interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: ${componentName}<K>
}

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
