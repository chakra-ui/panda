import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import { ArtifactFile } from '../artifact'

export const vueJsxFactoryStringLiteralTypesArtifact = new ArtifactFile({
  id: 'jsx/factory.d.ts',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory', 'jsxFramework'],
  importsType: (ctx) => {
    return {
      'types/jsx.d.ts': [ctx.jsx.upperName],
    }
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { factoryName, upperName } = params.computed.jsx
    return `export declare const ${factoryName}: ${upperName}`
  },
})

export const vueJsxTypesStringLiteralArtifact = new ArtifactFile({
  id: 'types/jsx.d.ts',
  fileName: 'jsx',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory', 'jsxFramework'],
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, upperName, typeName } = params.computed.jsx
    return `
    import type { Component, FunctionalComponent, NativeElements } from 'vue'

    export type IntrinsicElement = keyof NativeElements

    export type ElementType = IntrinsicElement | Component

    export type ComponentProps<T extends ElementType> = T extends IntrinsicElement
      ? NativeElements[T]
      : T extends Component<infer Props>
      ? Props
      : never

    export type ${componentName}<T extends ElementType> = FunctionalComponent<ComponentProps<T>>
    >

    export interface JsxFactory {
      <T extends ElementType>(component: T): ${componentName}<T>
    }

    export type JsxElements = {
      [K in IntrinsicElement]: ${componentName}<K>
    }

    export type ${upperName} = JsxFactory & JsxElements

    export type ${typeName}<T extends ElementType> = ComponentProps<T>
      `
  },
})

export function generateVueJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent,
  }
}
