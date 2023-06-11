import { FeatureMarquee } from '../src/components.www/feature-marquee'
import { SectionCommunity } from '../src/components.www/sections/community'
import { SectionCssInJS } from '../src/components.www/sections/css-in-js'
import { SectionDesignTokens } from '../src/components.www/sections/design-tokens'
import { SectionFooter } from '../src/components.www/sections/footer'
import { SectionHero } from '../src/components.www/sections/hero'
import { SectionModernCss } from '../src/components.www/sections/modern-css'
import { SectionRecipes } from '../src/components.www/sections/recipes'
import { SectionStartBuilding } from '../src/components.www/sections/start-building'
import { SectionTestimonials } from '../src/components.www/sections/testimonials'
import { SectionTryPanda } from '../src/components.www/sections/try-panda'
import { SectionWorksEverywhere } from '../src/components.www/sections/works-everywhere'

export default function Page() {
  return (
    <>
      <SectionHero />
      <FeatureMarquee />
      <SectionCssInJS />
      <SectionModernCss />
      <SectionDesignTokens />
      <SectionRecipes />
      <SectionTestimonials />
      <SectionTryPanda />
      <SectionWorksEverywhere />
      <SectionStartBuilding />
      <SectionCommunity />
      <SectionFooter />
    </>
  )
}
