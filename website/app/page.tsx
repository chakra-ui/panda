import { Navbar } from '@/components/navbar'
import { css } from '@/styled-system/css'
import { CommunitySection } from '@/www/community.section'
import { CourseSection } from '@/www/course.section'
import { CssInJSSection } from '@/www/css-in-js.section'
import { DesignTokensSection } from '@/www/design-tokens.section'
import { FeatureMarqueeSection } from '@/www/feature-marquee.section'
import { FooterSection } from '@/www/footer.section'
import { HeroSection } from '@/www/hero.section'
import { ModernCssSection } from '@/www/modern-css.section'
import { RecipesSection } from '@/www/recipes.section'
import { StartBuildingSection } from '@/www/start-building.section'
import { TestimonialsSection } from '@/www/testimonials.section'
import { TryPandaSection } from '@/www/try-panda.section'
import { WorksEverywhereSection } from '@/www/works-everywhere.section'

export default function Page() {
  return (
    <>
      <Navbar />
      <div className={css({ display: 'flex', flexDirection: 'column' })}>
        <HeroSection />
        <FeatureMarqueeSection />
        <CssInJSSection />
        <CourseSection />
        <ModernCssSection />
        <DesignTokensSection />
        <RecipesSection />
        <TestimonialsSection />
        <TryPandaSection />
        <WorksEverywhereSection />
        <StartBuildingSection />
        <CommunitySection />
      </div>
      <FooterSection />
    </>
  )
}
