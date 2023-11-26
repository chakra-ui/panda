import { capitalize } from '@pandacss/shared'
import type { UserConfig } from '@pandacss/types'

export class JsxEngine {
  constructor(private config: UserConfig) {}

  private get jsxFactory() {
    return this.config.jsxFactory ?? ''
  }

  get styleProps() {
    return this.config.jsxStyleProps ?? 'all'
  }

  get framework() {
    return this.config.jsxFramework
  }

  get factoryName() {
    return this.jsxFactory
  }

  get upperName() {
    return capitalize(this.jsxFactory)
  }

  get typeName() {
    return `HTML${capitalize(this.jsxFactory)}Props`
  }

  get variantName() {
    return `${capitalize(this.jsxFactory)}VariantProps`
  }

  get componentName() {
    return `${capitalize(this.jsxFactory)}Component`
  }
}
