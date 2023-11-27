import { Playground } from '@/src/components/Playground'
import { prisma } from '../../client/prisma'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props

  const initialState = await prisma.session.findFirst({
    where: { id },
    select: { code: true, css: true, config: true },
  })

  return <Playground initialState={initialState} />
}

export default Page
