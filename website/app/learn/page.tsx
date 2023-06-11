import { SectionArticleList } from '@/components.www/sections/article-list'
import { SectionFooter } from '@/components.www/sections/footer'
import { SectionLearn } from '@/components.www/sections/learn'

export default function Page() {
  return (
    <>
      <SectionLearn />
      <SectionArticleList />
      <SectionFooter />
    </>
  )
}
