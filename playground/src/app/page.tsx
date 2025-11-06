import { EXAMPLES } from '@/src/components/Examples/data'
import { Playground } from '../components/Playground'
import { parseState } from '@/src/lib/parse-state'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const initialState = EXAMPLES.find((e) => e.id === params.eg)

  return <Playground initialState={parseState(initialState)} />
}

export default Page
