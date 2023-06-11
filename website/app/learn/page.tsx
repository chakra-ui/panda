import { SectionArticleList } from '@/components/sections/article-list'
import { SectionFooter } from '@/components/sections/footer'
import { SectionLearn } from '@/components/sections/learn'

export default function Page() {
  return (
    <>
      <SectionLearn />
      <SectionArticleList />
      <SectionFooter />
    </>
  )
}
