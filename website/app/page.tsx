import { Flex } from '../styled-system/jsx'
import { FeaturesList } from './features-list'
import { Navbar } from './navbar'
import { SectionCommunity } from './section.community'
import { SectionCssInJS } from './section.css-in-js'
import { SectionDesignTokens } from './section.design-tokens'
import { SectionFooter } from './section.footer'
import { SectionHero } from './section.hero'
import { SectionModernCss } from './section.modern-css'
import { SectionRecipes } from './section.recipes'
import { SectionStartBuilding } from './section.start-building'
import { SectionTestimonials } from './section.testimonials'
import { SectionTryPanda } from './section.try-panda'
import { SectionWorksEverywhere } from './section.works-everywhere'

export default function Page() {
  return (
    <>
      <Navbar />
      <Flex flexDirection="column">
        <SectionHero />
        <FeaturesList />
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
      </Flex>
    </>
  )
}
