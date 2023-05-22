import { breadcrumbRecipe } from '../src/components/breadcrumb.recipe'
import { bannerRecipe } from '../src/components/banner.recipe'
import { cardRecipe } from '../src/components/card.recipe'
import { calloutRecipe } from '../src/components/callout.recipe'
import { tabsRecipe } from '../src/components/tabs.recipe'
import { navbarRecipe } from '../src/components/navbar.recipe'
import { navLinksRecipe } from '../src/components/nav-links.recipe'

import { codeTabsRecipe } from './code-tabs.recipe'

import { codeRecipe } from './code.recipe'
import { contentRecipe } from './content.recipe'
import { buttonRecipe } from './button.recipe'
import { inputRecipe } from './input.recipe'

export const recipes = {
  button: buttonRecipe,
  banner: bannerRecipe,
  code: codeRecipe,
  codeTabs: codeTabsRecipe,
  content: contentRecipe,
  breadcrumb: breadcrumbRecipe,
  card: cardRecipe,
  callout: calloutRecipe,
  input: inputRecipe,
  navbar: navbarRecipe,
  navLinks: navLinksRecipe,
  tabs: tabsRecipe
}
