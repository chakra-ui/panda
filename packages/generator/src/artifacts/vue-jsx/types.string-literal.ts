import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateVueJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}

export declare const x${factoryName}: X${upperName}
    `,
    jsxType: outdent`
import type { Component, FunctionalComponent, NativeElements } from 'vue'

export type IntrinsicElement = keyof NativeElements

export type ElementType = IntrinsicElement | Component

export type ComponentProps<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
  ? Props
  : never

export type X${componentName}<T extends ElementType> = FunctionalComponent<ComponentProps<T>>
>

export interface JsxFactory {
  <T extends ElementType>(component: T): X${componentName}<T>
}

export type JsxElements = {
  [K in IntrinsicElement]: X${componentName}<K>
}

export type X${upperName} = JsxFactory & JsxElements

export type X${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
