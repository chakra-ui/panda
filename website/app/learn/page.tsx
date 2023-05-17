import { SectionFooter } from '../section.footer'
import { SectionArticleList } from './section.article-list'
import { SectionLearn } from './section.learn'

export default function Page() {
  return (
    <>
      <SectionLearn />
      <SectionArticleList />
      <SectionFooter />
    </>
  )
}
