import { capitalize, memo } from '@pandacss/shared'
import type { Context } from './context'
import type { PatternNode } from './patterns'
import type { RecipeNode } from './types'

interface JsxMatcher {
  string: Set<string>
  regex: RegExp[]
}

export class JsxEngine {
  nodes: Array<PatternNode | RecipeNode> = []
  names: string[] = []

  recipeMatcher: JsxMatcher = { string: new Set(), regex: [] }
  recipePropertiesByJsxName = new Map<string, Set<string>>()

  patternMatcher: JsxMatcher = { string: new Set(), regex: [] }
  patternPropertiesByJsxName = new Map<string, Set<string>>()

  constructor(private context: Pick<Context, 'patterns' | 'recipes' | 'config'>) {
    this.nodes = [...context.patterns.details, ...context.recipes.details]
    this.names = [this.factoryName, 'x' + this.factoryName, ...this.nodes.map((node) => node.jsxName)]

    this.assignRecipeMatcher()
    this.assignPatternMatcher()
  }

  assignRecipeMatcher() {
    if (!this.isEnabled) return

    for (const recipe of this.context.recipes.details) {
      this.recipePropertiesByJsxName.set(recipe.jsxName, new Set(recipe.props ?? []))
      recipe.jsx.forEach((jsx) => {
        if (typeof jsx === 'string') {
          this.recipeMatcher.string.add(jsx)
        } else {
          this.recipeMatcher.regex.push(jsx)
        }
      })
    }
  }

  assignPatternMatcher() {
    if (!this.isEnabled) return

    for (const pattern of this.context.patterns.details) {
      this.patternPropertiesByJsxName.set(pattern.jsxName, new Set(pattern.props ?? []))
      pattern.jsx.forEach((jsx) => {
        if (typeof jsx === 'string') {
          this.patternMatcher.string.add(jsx)
        } else {
          this.patternMatcher.regex.push(jsx)
        }
      })
    }
  }

  private get jsxFactory() {
    return this.context.config.jsxFactory ?? 'styled'
  }

  get styleProps() {
    return this.context.config.jsxStyleProps ?? 'all'
  }

  get framework() {
    return this.context.config.jsxFramework
  }

  get isEnabled() {
    return this.framework != null
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

  isJsxFactory = (name: string) => {
    return name === this.factoryName
  }

  isJsxTagRecipe = memo((tagName: string) => {
    return this.recipeMatcher.string.has(tagName) || this.recipeMatcher.regex.some((regex) => regex.test(tagName))
  })

  isJsxTagPattern = memo((tagName: string) => {
    return this.patternMatcher.string.has(tagName) || this.patternMatcher.regex.some((regex) => regex.test(tagName))
  })

  isRecipeOrPatternProp = memo((tagName: string, propName: string) => {
    if (this.isJsxTagRecipe(tagName)) {
      const recipeList = this.context.recipes.filter(tagName)
      return recipeList.some((recipe) => this.recipePropertiesByJsxName.get(recipe.jsxName)?.has(propName))
    }

    if (this.isJsxTagPattern(tagName)) {
      const patternList = this.context.patterns.filter(tagName)
      return patternList.some((pattern) => this.patternPropertiesByJsxName.get(pattern.jsxName)?.has(propName))
    }

    return false
  })
}
