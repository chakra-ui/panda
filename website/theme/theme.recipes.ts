import { breadcrumbRecipe } from '../src/components/breadcrumb.recipe'
import { bannerRecipe } from '../src/components/banner.recipe'
import { cardRecipe } from '../src/components/card.recipe'
import { calloutRecipe } from '../src/components/callout.recipe'
import { tabsRecipe } from '../src/components/tabs.recipe'
import { navbarRecipe } from '../src/components/navbar.recipe'
import { navLinksRecipe } from '../src/components/nav-links.recipe'
import { buttonRecipe } from './button.recipe'

export const recipes = {
  button: buttonRecipe,
  banner: bannerRecipe,
  breadcrumb: breadcrumbRecipe,
  card: cardRecipe,
  callout: calloutRecipe,
  navbar: navbarRecipe,
  navLinks: navLinksRecipe,
  tabs: tabsRecipe
}
