import { Playground } from '@/src/components/Playground'
import { prisma } from '../../client/prisma'
import { initialCSS } from '@/src/components/Examples/data'

const Page = async (props: any) => {
  const {
    params: { id },
  } = props

  const _initialState = await prisma.session.findFirst({
    where: { id },
    select: { code: true, css: true, config: true },
  })

  const initialState = _initialState ? { ..._initialState, css: _initialState.css ?? initialCSS } : null
  return <Playground initialState={initialState} />
}

export default Page
