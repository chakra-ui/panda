import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateReactJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType('X' + upperName, '../types/jsx.string-literal')}
export declare const x${factoryName}: X${upperName}
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

export type X${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string
}

export interface JsxFactory {
  <T extends ElementType>(component: T): X${componentName}<T>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: X${componentName}<K>
}

export type X${upperName} = JsxFactory & JsxElements

export type X${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
