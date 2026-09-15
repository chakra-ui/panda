import { calloutRecipe } from './callout.recipe'
import { docsTabsRecipe } from './docs-tabs.recipe'
import { codeTabsRecipe } from './code-tabs.recipe'
import { buttonRecipe } from './button.recipe'
import { docCardRecipe } from './doc-card.recipe'
import { docNavRecipe } from './doc-nav.recipe'
import { marqueeRecipe } from './marquee.recipe'
import { segmentedRecipe } from './segmented.recipe'
import { textLinkRecipe } from './text-link.recipe'

export const slotRecipes = {
  docCard: docCardRecipe,
  docNav: docNavRecipe,
  codeTabs: codeTabsRecipe,
  callout: calloutRecipe,
  docsTabs: docsTabsRecipe,
  segmented: segmentedRecipe,
  marquee: marqueeRecipe
}

export const recipes = {
  button: buttonRecipe,
  textLink: textLinkRecipe
}
