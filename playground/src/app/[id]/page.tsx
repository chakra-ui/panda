import { prisma } from '../../client/prisma'
import { Editor } from '../../components/Editor'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props
  const session = await prisma?.session.findFirst({ where: { id }, select: { code: true, config: true, view: true } })

  return <Editor session={session} />
}

export default Page
