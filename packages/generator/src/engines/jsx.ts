import { capitalize } from '@pandacss/shared'
import type { UserConfig } from '@pandacss/types'

export const getJsxEngine = (config: UserConfig) => {
  const { jsxFactory, jsxFramework, jsxStyleProps } = config
  return {
    factoryName: jsxFactory!,
    upperName: capitalize(jsxFactory!),
    typeName: `HTML${capitalize(jsxFactory!)}Props`,
    componentName: `${capitalize(jsxFactory!)}Component`,
    framework: jsxFramework,
    styleProps: jsxStyleProps ?? 'all',
  }
}
