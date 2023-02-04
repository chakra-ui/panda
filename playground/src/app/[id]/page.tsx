import { Playground } from '@/src/components/Playground'
import { prisma } from '../../client/prisma'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props
  const session = await prisma?.session.findFirst({ where: { id }, select: { code: true, config: true, view: true } })

  return <Playground session={session} />
}

export default Page
