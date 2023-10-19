import { capitalize } from '@pandacss/shared'
import type { UserConfig } from '@pandacss/types'

export const getJsxEngine = (config: UserConfig): PandaJsxEngine => {
  const { jsxFactory, jsxFramework, jsxStyleProps } = config
  return {
    factoryName: jsxFactory!,
    upperName: capitalize(jsxFactory!),
    typeName: `HTML${capitalize(jsxFactory!)}Props`,
    variantName: `${capitalize(jsxFactory!)}VariantProps`,
    componentName: `${capitalize(jsxFactory!)}Component`,
    framework: jsxFramework,
    styleProps: jsxStyleProps ?? 'all',
  }
}

export interface PandaJsxEngine {
  factoryName: string
  upperName: string
  typeName: string
  componentName: string
  framework: UserConfig['jsxFramework']
  styleProps: UserConfig['jsxStyleProps']
}
