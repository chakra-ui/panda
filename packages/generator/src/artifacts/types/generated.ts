import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }
import system from '../generated/system-types.d.ts.json' assert { type: 'json' }
import composition from '../generated/composition.d.ts.json' assert { type: 'json' }
import recipe from '../generated/recipe.d.ts.json' assert { type: 'json' }
import selectors from '../generated/selectors.d.ts.json' assert { type: 'json' }

export function getGeneratedTypes() {
  return {
    cssType: csstype.content,
    recipe: recipe.content,
    composition: composition.content,
    selectors: selectors.content,
    system: system.content,
  }
}
