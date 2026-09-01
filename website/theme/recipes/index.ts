import { calloutRecipe } from './callout.recipe'
import { cardRecipe } from './card.recipe'
import { navbarRecipe } from './navbar.recipe'
import { nextraTabsRecipe } from './nextra-tabs.recipe'
import { codeTabsRecipe } from './code-tabs.recipe'
import { buttonRecipe } from './button.recipe'
import { docCardRecipe } from './doc-card.recipe'
import { docNavRecipe } from './doc-nav.recipe'
import { marqueeRecipe } from './marquee.recipe'
import { segmentedRecipe } from './segmented.recipe'
import { textLinkRecipe } from './text-link.recipe'

export const slotRecipes = {
  docCard: docCardRecipe,
  docNav: docNavRecipe
}

export const recipes = {
  button: buttonRecipe,
  codeTabs: codeTabsRecipe,
  card: cardRecipe,
  callout: calloutRecipe,
  navbar: navbarRecipe,
  nextraTabs: nextraTabsRecipe,
  segmented: segmentedRecipe,
  marquee: marqueeRecipe,
  textLink: textLinkRecipe
}
