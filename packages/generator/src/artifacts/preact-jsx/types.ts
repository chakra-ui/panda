import { ArtifactFile } from '../artifact'

export const preactJsxTypesArtifact = new ArtifactFile({
  id: 'types/jsx.d.ts',
  fileName: 'types',
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
