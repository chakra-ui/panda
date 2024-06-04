import { ArtifactFile } from '../artifact-map'

export const preactJsxFactoryStringLiteralTypesArtifact = new ArtifactFile({
  id: `jsx/factory.d.ts`,
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

export const preactJsxTypesStringLiteralArtifact = new ArtifactFile({
  id: `types/jsx.d.ts`,
  fileName: 'jsx',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory', 'jsxFramework'],
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, typeName, upperName } = params.computed.jsx
    return `
    import type { ComponentProps, JSX } from 'preact'

    export type ElementType = JSX.ElementType

    interface Dict {
      [k: string]: unknown
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
      `
  },
})
