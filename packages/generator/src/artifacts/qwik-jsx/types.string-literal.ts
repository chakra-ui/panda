import { ArtifactFile } from '../artifact-map'

export const qwikJsxFactoryStringLiteralTypesArtifact = new ArtifactFile({
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

export const qwikJsxTypesStringLiteralArtifact = new ArtifactFile({
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
    import type { Component, QwikIntrinsicElements } from '@builder.io/qwik'

    export type ElementType = keyof QwikIntrinsicElements | Component<any>

    export type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
      ? QwikIntrinsicElements[T]
      : T extends Component<infer P>
      ? P
      : never

    interface Dict {
      [k: string]: unknown
    }

    export type ${componentName}<T extends ElementType> = {
      (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
    }

    export interface JsxFactory {
      <T extends ElementType>(component: T): ${componentName}<T>
    }

    export type JsxElements = {
      [K in keyof QwikIntrinsicElements]: ${componentName}<K>
    }

    export type ${upperName} = JsxFactory & JsxElements

    export type ${typeName}<T extends ElementType> = ComponentProps<T>
      `
  },
})
