import { Playground } from '@/src/components/Playground'
import { prisma } from '../../client/prisma'
import { parseState } from '@/src/lib/parse-state'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props

  const initialState = await prisma.session.findFirst({
    where: { id },
    select: { code: true, css: true, config: true },
  })

  return <Playground initialState={parseState(initialState)} />
}

export default Page
