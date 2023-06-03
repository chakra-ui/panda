import { capitalize } from '@pandacss/shared'
import type { UserConfig } from '@pandacss/types'

export const getJsxEngine = (config: UserConfig) => {
  const { jsxFactory, jsxFramework } = config
  return {
    factoryName: jsxFactory!,
    upperName: capitalize(jsxFactory!),
    typeName: `HTML${capitalize(jsxFactory!)}Props`,
    componentName: `${capitalize(jsxFactory!)}Component`,
    framework: jsxFramework,
  } as JsxEngine
}

export type JsxEngine = {
  factoryName: string
  upperName: string
  typeName: string
  componentName: string
  framework: 'react' | 'solid' | 'preact' | 'vue' | 'qwik' | undefined
}
