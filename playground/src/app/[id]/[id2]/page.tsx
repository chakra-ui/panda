import { Playground } from '@/src/components/Playground'
import { prisma } from '../../../client/prisma'
import { parseState } from '@/src/lib/parse-state'
import { notFound } from 'next/navigation'

const Page = async (props: any) => {
  const {
    params: { id, id2 },
  } = props

  const initialState = await prisma.session
    .findFirst({
      where: { id },
      select: { id: true, code: true, css: true, config: true },
    })
    .catch(() => {
      return notFound()
    })

  const diffState = await prisma.session
    .findFirst({
      where: { id: id2 },
      select: { id: true, code: true, css: true, config: true },
    })
    .catch(() => {
      return notFound()
    })

  return <Playground initialState={parseState(initialState)} diffState={parseState(diffState)} />
}

export default Page
