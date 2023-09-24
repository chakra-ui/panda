import { defineRecipeConfigs } from '@pandacss/dev'

import { calloutRecipe } from './callout.recipe'
import { cardRecipe } from './card.recipe'
import { navbarRecipe } from './navbar.recipe'
import { nextraTabsRecipe } from './nextra-tabs.recipe'
import { codeTabsRecipe } from './code-tabs.recipe'
import { buttonRecipe } from './button.recipe'
import { inputRecipe } from './input.recipe'
import { nextraBannerRecipe } from './nextra-banner.recipe'

export const recipes = defineRecipeConfigs({
  button: buttonRecipe,
  nextraBanner: nextraBannerRecipe,
  codeTabs: codeTabsRecipe,
  card: cardRecipe,
  callout: calloutRecipe,
  input: inputRecipe,
  navbar: navbarRecipe,
  nextraTabs: nextraTabsRecipe
})
