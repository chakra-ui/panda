import { Playground } from '@/src/components/Playground'
import { prisma } from '../../client/prisma'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props

  const initialState = await prisma.session.findFirst({
    where: { id },
    select: { code: true, config: true },
  })

  return <Playground intialState={initialState} />
}

export default Page
