import { ArtifactFile } from '../artifact'

export const solidJsxFactoryStringLiteralTypesArtifact = new ArtifactFile({
  id: 'jsx/factory.d.ts',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['jsxFactory'],
  imports: (ctx) => ({
    'types/jsx.d.ts': [ctx.jsx.upperName],
  }),
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { factoryName, upperName } = params.computed.jsx

    return `export declare const ${factoryName}: ${upperName}`
  },
})

export const solidJsxTypesStringLiteralArtifact = new ArtifactFile({
  id: 'types/jsx.d.ts',
  fileName: 'jsx',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['jsxFactory'],
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, upperName, typeName } = params.computed.jsx

    return `
    import type { Component, ComponentProps, JSX } from 'solid-js'

    interface Dict {
      [k: string]: unknown
    }

    export type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>

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
      `
  },
})
