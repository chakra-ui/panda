import { FeatureMarquee } from '@/components/feature-marquee'
import { SectionCommunity } from '@/components/sections/community'
import { SectionCourse } from '@/components/sections/course'
import { SectionCssInJS } from '@/components/sections/css-in-js'
import { SectionDesignTokens } from '@/components/sections/design-tokens'
import { SectionHero } from '@/components/sections/hero'
import { SectionModernCss } from '@/components/sections/modern-css'
import { SectionRecipes } from '@/components/sections/recipes'
import { SectionStartBuilding } from '@/components/sections/start-building'
import { SectionTestimonials } from '@/components/sections/testimonials'
import { SectionTryPanda } from '@/components/sections/try-panda'
import { SectionWorksEverywhere } from '@/components/sections/works-everywhere'

export default function Page() {
  return (
    <>
      <SectionHero />
      <FeatureMarquee />
      <SectionCssInJS />
      <SectionCourse />
      <SectionModernCss />
      <SectionDesignTokens />
      <SectionRecipes />
      <SectionTestimonials />
      <SectionTryPanda />
      <SectionWorksEverywhere />
      <SectionStartBuilding />
      <SectionCommunity />
    </>
  )
}
