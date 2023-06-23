import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxStringLiteralTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { FunctionComponent, QwikIntrinsicElements } from '@builder.io/qwik'

type ElementType = keyof QwikIntrinsicElements | FunctionComponent<any>

type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends FunctionComponent<infer P>
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

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = ComponentProps<T>
  `,
  }
}
