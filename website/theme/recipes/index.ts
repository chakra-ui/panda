import { bannerRecipe } from './banner.recipe'
import { calloutRecipe } from './callout.recipe'
import { cardRecipe } from './card.recipe'
import { navbarRecipe } from './navbar.recipe'
import { tabsRecipe } from './tabs.recipe'
import { codeTabsRecipe } from './code-tabs.recipe'
import { buttonRecipe, docsButtonRecipe } from './button.recipe'
import { inputRecipe } from './input.recipe'

export const recipes = {
  button: buttonRecipe,
  docsButton: docsButtonRecipe,
  banner: bannerRecipe,
  codeTabs: codeTabsRecipe,
  card: cardRecipe,
  callout: calloutRecipe,
  input: inputRecipe,
  navbar: navbarRecipe,
  tabs: tabsRecipe,
}
