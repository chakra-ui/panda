import { EXAMPLES } from '@/src/components/Examples/data'
import { Playground } from '../components/Playground'
import { parseState } from '@/src/lib/parse-state'

const Page = ({ searchParams }: { searchParams: Record<string, string> }) => {
  const initialState = EXAMPLES.find((e) => e.id === searchParams.eg)

  return <Playground initialState={parseState(initialState)} />
}

export default Page
