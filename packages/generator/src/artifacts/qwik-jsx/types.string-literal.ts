import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, QwikIntrinsicElements } from '@builder.io/qwik'

type ElementType = keyof QwikIntrinsicElements | Component<any>

export type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends Component<infer P>
  ? P
  : never

type Dict = Record<string, unknown>

export type ${componentName}<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
}

interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T>
}

type JsxElements = { [K in keyof QwikIntrinsicElements]: ${componentName}<K> }

export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
