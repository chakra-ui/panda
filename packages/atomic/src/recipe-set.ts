import { Recipe } from '@css-panda/types'
import { ProcessOptions, Ruleset } from './ruleset'
import { GeneratorContext } from './types'

export class RecipeSet extends Ruleset {
  __context: Omit<GeneratorContext, 'transform'>

  constructor(context: Omit<GeneratorContext, 'transform'>, private recipe: Recipe, options: { hash?: boolean } = {}) {
    const transform = (prop: string, value: string) => {
      //
      if (value === '__ignore__') {
        return {
          className: recipe.name,
          styles: recipe.base ?? {},
        }
      }

      return {
        className: `${this.recipe.name}__${prop}-${value}`,
        styles: this.recipe.variants?.[prop][value] ?? {},
      }
    }

    super({ ...context, transform }, options)
    this.__context = context
  }

  resolve(options: ProcessOptions) {
    const { scope, styles } = options

    this.process({
      styles: { [this.recipe.name]: '__ignore__' },
    })

    const styleObject = {
      ...this.recipe.defaultVariants,
      ...styles,
    }

    this.process({ scope, styles: styleObject })

    return this
  }
}
