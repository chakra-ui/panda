import { Flex } from '@/design-system/jsx'
import { Editor, EditorProps } from './Editor'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'

type PlaygroundProps = EditorProps

export const Playground = (props: PlaygroundProps) => (
  <>
    <Toolbar />
    <Flex flex="1">
      <Editor {...props} />
      <Preview />
    </Flex>
  </>
)
