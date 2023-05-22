import { Metadata } from 'next'
import { FeaturesList } from './features-list'
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

export const metadata: Metadata = {
  title: 'Panda CSS  - The fastest way to build beautiful websites in React.',
  description: 'The fastest way to build beautiful websites in React.',
  themeColor: '#F6E458',
  openGraph: {
    images: '/og-image.png'
  }
}

export default function Page() {
  return (
    <>
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
    </>
  )
}
