import { EXAMPLES } from '@/src/components/Examples/data'
import { Playground } from '../components/Playground'

const Page = ({ searchParams }: { searchParams: Record<string, string> }) => {
  const initialState = EXAMPLES.find((e) => e.id === searchParams.eg)

  return <Playground initialState={initialState} />
}

export default Page
