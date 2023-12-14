import { Playground } from '@/src/components/Playground'
import { prisma } from '../../client/prisma'
import { parseState } from '@/src/lib/parse-state'
import { notFound } from 'next/navigation'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props

  const initialState = await prisma.session
    .findFirst({
      where: { id },
      select: { id: true, code: true, css: true, config: true },
    })
    .catch(() => {
      return notFound()
    })

  return <Playground initialState={parseState(initialState)} />
}

export default Page
