import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateVueJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}

export declare const ${factoryName}: ${upperName}
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

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): FunctionalComponent<ComponentProps<T>>
}

export interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T>
}

export type JsxElements = {
  [K in IntrinsicElement]: ${componentName}<K>
}

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
